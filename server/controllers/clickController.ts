import { Request, Response } from "express";
import crypto from "crypto";
import db from "../db";

const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || "";
const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID || "";
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || "";

export const handleClickRequest = async (req: Request, res: Response) => {
    const {
        click_trans_id,
        service_id,
        click_paydoc_id,
        merchant_trans_id, // This will be our user_id
        amount,
        action,
        error,
        error_note,
        sign_time,
        sign_string,
    } = req.body;

    // Verify signature
    // sign_string = md5(click_trans_id + service_id + CLICK_SECRET_KEY + merchant_trans_id + amount + action + sign_time)
    const mySignString = crypto
        .createHash("md5")
        .update(
            `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`
        )
        .digest("hex");

    if (mySignString !== sign_string) {
        return res.json({ error: -1, error_note: "Sign string mismatch" });
    }

    const userId = parseInt(merchant_trans_id);

    // Check if user exists
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) {
        return res.json({ error: -5, error_note: "User not found" });
    }

    // Handle Prepare
    if (parseInt(action) === 0) {
        // Check if there is already a successful payment for this transaction
        const existingPayment = db.prepare("SELECT * FROM payments WHERE transaction_id = ? AND provider = 'click' AND status = 'completed'").get(click_trans_id);
        if (existingPayment) {
            return res.json({ error: -4, error_note: "Already paid" });
        }

        // Return success for prepare
        return res.json({
            click_trans_id,
            merchant_trans_id,
            merchant_prepare_id: click_trans_id,
            error: 0,
            error_note: "Success",
        });
    }

    // Handle Complete
    if (parseInt(action) === 1) {
        if (parseInt(error) < 0) {
            return res.json({ error, error_note });
        }

        // Activate Premium
        try {
            db.transaction(() => {
                // Update User
                db.prepare("UPDATE users SET is_premium = 1 WHERE id = ?").run(userId);

                // Log Payment
                db.prepare(`
                INSERT INTO payments (user_id, transaction_id, provider, amount, phone_number, status, lifetime)
                VALUES (?, ?, 'click', ?, ?, 'completed', 1)
            `).run(userId, click_trans_id, amount, user.phone || '');
            })();

            return res.json({
                click_trans_id,
                merchant_trans_id,
                merchant_confirm_id: click_trans_id,
                error: 0,
                error_note: "Success",
            });
        } catch (e: any) {
            return res.json({ error: -7, error_note: "Internal database error" });
        }
    }

    return res.json({ error: -3, error_note: "Invalid action" });
};

export const generateClickUrl = (userId: number, amount: number) => {
    // Example: https://my.click.uz/services/pay?service_id=ID&merchant_id=ID&amount=100.00&transaction_param=PARAM
    const url = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amount}&transaction_param=${userId}`;
    return url;
};
