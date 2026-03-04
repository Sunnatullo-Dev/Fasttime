// stripeController.ts — Stripe initialization helper
// This file provides a lazy singleton to avoid crashing the server if STRIPE_SECRET_KEY is not set.

import dotenv from "dotenv";
dotenv.config();

let _stripe: any = null;

export function getStripeInstance() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key || key.startsWith('sk_test_1234') || key.length < 20) {
    return null;
  }
  if (!_stripe) {
    const Stripe = require('stripe');
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.patch_1' });
  }
  return _stripe;
}

export const createPaymentIntent = async (amount: number) => {
  const stripe = getStripeInstance();
  if (!stripe) throw new Error("Stripe sozlanmagan");
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });
  return paymentIntent.client_secret;
};
