import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma/enums";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
}

export function requireAuth(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // 1. Vérif présence du token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];

    // 2. Vérif validité du token
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
        role: Role;
      };
      req.userId = payload.userId;
      req.userRole = payload.role;
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 3. Vérif rôle (uniquement si des rôles sont demandés)
    if (roles.length > 0 && (!req.userRole || !roles.includes(req.userRole))) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  };
}

// ─── Alias sémantiques (facultatifs mais très lisibles) ─────
export const requireClient = requireAuth("CLIENT");
export const requireRestaurant = requireAuth("RESTAURANT");
export const requireAdmin = requireAuth("ADMIN");
export const requireDriver = requireAuth("DRIVER");
export const requireLoggedIn = requireAuth(); // juste authentifié, sans rôle