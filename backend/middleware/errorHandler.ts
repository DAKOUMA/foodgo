import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";

// 404 : aucune route ne correspond
export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express reconnaît un handler d'erreur à ses 4 paramètres (même si next n'est pas utilisé)
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error(`[${req.method} ${req.originalUrl}]`, err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "This value already exists" });
    if (err.code === "P2025") return res.status(404).json({ error: "Resource not found" });
  }

  // JSON invalide envoyé par le client (erreur du body-parser)
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  res.status(500).json({ error: "Internal server error" });
}