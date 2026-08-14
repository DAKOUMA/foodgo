import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
        return res.status(401).json({ error: "Missing token" })
    }

    const token = authHeader.split(" ")[1];

    try {
        const playload = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            role: string;
        };
        req.userId = playload.userId;
        req.userRole = playload.role;
        next();

    } catch (error) {
        return res.status(401).json({ error: "Invalid token" })
    }
}