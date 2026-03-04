import db from '../db';

// ── Ensure payments table has required columns for mock checkout ──────────────
try { db.exec("ALTER TABLE payments ADD COLUMN plan TEXT;"); } catch (_) { }
try { db.exec("ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT 'USD';"); } catch (_) { }
try { db.exec("ALTER TABLE payments ADD COLUMN plan_expires_at DATETIME;"); } catch (_) { }
// Ensure plan_expires_at column exists on users
try { db.exec("ALTER TABLE users ADD COLUMN plan_expires_at DATETIME;"); } catch (_) { }

// Lazy-load Stripe only when keys are present & valid
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key || key.startsWith('sk_test_1234') || key.length < 20) {
    return null;
  }
  // Dynamic require to avoid crash on import when key is missing
  const Stripe = require('stripe');
  return new Stripe(key);
}

export const createCheckoutSession = async (req: any, res: any) => {
  // Accept both 'plan' (PricingModal) and legacy 'type'
  const rawPlan: string = (req.body.plan || req.body.type || '').toUpperCase();
  const userId = req.user.id;

  // Normalize: MONTHLY / LIFETIME
  const planType = rawPlan === 'LIFETIME' ? 'LIFETIME' : 'MONTHLY';

  try {
    const user: any = db.prepare("SELECT plan, plan_expires_at FROM users WHERE id = ?").get(userId);
    if (user?.plan === 'LIFETIME' || (user?.plan === 'MONTHLY' && user?.plan_expires_at && new Date(user.plan_expires_at) > new Date())) {
      return res.status(409).json({ error: "Siz allaqachon PREMIUMga obuna bo'lgansiz." });
    }
  } catch (e) { }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: "To'lov tizimi sozlanmagan (dev mode). Stripe kalitlarini .env ga qo'shing."
    });
  }

  try {
    const user: any = db.prepare("SELECT email, stripe_customer_id FROM users WHERE id = ?").get(userId);

    let customerId = user?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email || `user_${userId}@fasttime.app`,
        metadata: { userId: userId.toString() }
      });
      customerId = customer.id;
      db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customerId, userId);
    }

    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
    const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME;

    const priceId = planType === 'LIFETIME' ? lifetimePriceId : monthlyPriceId;
    if (!priceId) {
      return res.status(503).json({
        error: "To'lov narxlari sozlanmagan. STRIPE_PRICE_ID_MONTHLY va STRIPE_PRICE_ID_LIFETIME ni .env ga qo'shing."
      });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: planType === 'MONTHLY' ? 'subscription' : 'payment',
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing/cancel`,
      metadata: {
        userId: userId.toString(),
        planType
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ error: error.message || "To'lov tizimida xatolik" });
  }
};

export const verifySession = async (req: any, res: any) => {
  const sessionId = req.query.session_id as string;
  const userId = req.user.id;

  const stripe = getStripe();
  if (!stripe) {
    // In dev mode without Stripe, we skip verification but still update plan
    return res.json({ verified: false, message: 'Dev mode: Stripe not configured' });
  }

  try {
    const session: any = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return res.status(400).json({ error: "To'lov tasdiqlanmadi" });
    }

    const planType = session.metadata?.planType || 'MONTHLY';

    if (planType === 'LIFETIME') {
      db.prepare("UPDATE users SET plan = 'LIFETIME', is_premium = 1, premium_expires_at = NULL WHERE id = ?").run(userId);
    } else {
      // Monthly: get subscription expiry
      let expiresAt: string | null = null;
      if (session.subscription) {
        const subscription: any = await stripe.subscriptions.retrieve(session.subscription);
        expiresAt = new Date(subscription.current_period_end * 1000).toISOString();
        db.prepare("UPDATE users SET stripe_subscription_id = ? WHERE id = ?").run(session.subscription, userId);
      }
      db.prepare("UPDATE users SET plan = 'MONTHLY', is_premium = 1, premium_expires_at = ? WHERE id = ?").run(expiresAt, userId);
    }

    res.json({ verified: true, plan: planType });
  } catch (error: any) {
    console.error('Verify Session Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleWebhook = async (req: any, res: any) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.json({ received: false, message: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;

        if (!userId) break;

        if (planType === 'LIFETIME') {
          db.prepare("UPDATE users SET plan = 'LIFETIME', is_premium = 1, premium_expires_at = NULL WHERE id = ?").run(userId);
          console.log(`[STRIPE_WEBHOOK] Lifetime Premium activated for user ${userId}`);
        } else if (planType === 'MONTHLY') {
          // Will be fully handled by invoice.paid
          db.prepare("UPDATE users SET plan = 'MONTHLY', is_premium = 1 WHERE id = ?").run(userId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice: any = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;
          const expiresAt = new Date(subscription.current_period_end * 1000).toISOString();

          db.prepare("UPDATE users SET plan = 'MONTHLY', is_premium = 1, premium_expires_at = ?, stripe_subscription_id = ? WHERE stripe_customer_id = ?")
            .run(expiresAt, subscriptionId, customerId);
          console.log(`[STRIPE_WEBHOOK] Monthly Premium renewed for customer ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription: any = event.data.object;
        const customerId = subscription.customer as string;
        db.prepare("UPDATE users SET plan = 'FREE', is_premium = 0, stripe_subscription_id = NULL WHERE stripe_customer_id = ?").run(customerId);
        console.log(`[STRIPE_WEBHOOK] Subscription cancelled for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook Processing Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ── Demo Purchase (demo mode — no real payment) ───────────────────────────────
export const demoPurchase = (req: any, res: any) => {
  const userId = req.user.id;
  const rawPlan: string = (req.body.plan || '').toUpperCase();

  if (rawPlan !== 'MONTHLY' && rawPlan !== 'LIFETIME') {
    return res.status(400).json({ error: "Noto'g'ri tarif. MONTHLY yoki LIFETIME bo'lishi kerak." });
  }

  const planType: 'MONTHLY' | 'LIFETIME' = rawPlan as any;
  const amount = planType === 'LIFETIME' ? 49 : 1.50;

  try {
    const user: any = db.prepare("SELECT plan, plan_expires_at FROM users WHERE id = ?").get(userId);
    if (user?.plan === 'LIFETIME' || (user?.plan === 'MONTHLY' && user?.plan_expires_at && new Date(user.plan_expires_at) > new Date())) {
      return res.status(409).json({ error: "Siz allaqachon PREMIUMga obuna bo'lgansiz." });
    }

    // Calculate expiry: MONTHLY → now + 30 days, LIFETIME → null
    const expiresAt: string | null =
      planType === 'MONTHLY'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    // Update user plan
    db.prepare(`
      UPDATE users
      SET plan = ?, is_premium = 1, plan_expires_at = ?, premium_expires_at = ?
      WHERE id = ?
    `).run(planType, expiresAt, expiresAt, userId);

    // Audit record in payments table
    db.prepare(`
      INSERT INTO payments (user_id, plan, amount, currency, status, lifetime, created_at)
      VALUES (?, ?, ?, 'USD', 'PAID', ?, CURRENT_TIMESTAMP)
    `).run(userId, planType, amount, planType === 'LIFETIME' ? 1 : 0);

    console.log(`[DEMO_PURCHASE] User ${userId} upgraded to ${planType}. Expires: ${expiresAt ?? 'never'}`);

    res.json({
      ok: true,
      message: "To‘lov yechildi ✅",
      plan: planType,
      plan_expires_at: expiresAt
    });
  } catch (error: any) {
    console.error('[DEMO_PURCHASE] Error:', error);
    res.status(500).json({ error: "To'lovni qayta ishlashda xatolik yuz berdi." });
  }
};

