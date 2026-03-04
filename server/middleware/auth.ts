import jwt from "jsonwebtoken";
import { checkPremiumStatus } from "./premium";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });

    // Check for premium expiration
    checkPremiumStatus(user.id);

    req.user = user;
    next();
  });
};
