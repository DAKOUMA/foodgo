import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { Role } from "../generated/prisma/enums";

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: Role
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing token" })
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            role: Role;
        };
        req.userId = payload.userId;
        req.userRole = payload.role;
        next();

    } catch (error) {
        return res.status(401).json({ error: "Invalid token" })
    }
}

export function requireRole(...roles: Role[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ error: "Access denied" })
        }
        next()
    }
}