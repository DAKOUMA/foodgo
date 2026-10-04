import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, requireRole } from "../middleware/authMiddleware";
import { OrderStatus } from "../generated/prisma/enums";
import bcrypt from "bcrypt"
import { validate } from "../middleware/validate";
import { updateUserSchema } from "../validators/usersValidators";
const router = Router();

router.get("/me", requireAuth, requireRole("CLIENT"), async (req: AuthRequest, res) => {
    try {
        const clientId = req.userId
        if (!clientId) {
            return res.status(401).json({ error: "no userId in req.userId" });
        }
        const orders = await prisma.order.findMany({
            where: { clientId },
            include: {
                restaurant: { select: { name: true } },
                items: { include: { menuItem: true } },
                driver: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        })
        res.json(orders);
    } catch (error) { 
        res.status(500).json({ error: "Failed to fetch user information" });
     }
})

router.patch("/me", requireAuth, requireRole("CLIENT"), validate(updateUserSchema), async (req: AuthRequest, res) => {
    try {
        const clientId = req.userId
        if (!clientId) {
            return res.status(401).json({ error: "no userId in req.userId" });
        }
        const { name, email, phone, paymentMethod, password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await prisma.user.update({
            where: { id: clientId },
            data: { name, email, phone, paymentMethod, password: hashedPassword },
            select: { id: true, email: true, name: true, phone: true, paymentMethod: true } // never send critical data
        })
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: "Failed to update user information" });
    }
})