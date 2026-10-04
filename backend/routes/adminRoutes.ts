import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
            orderBy: { createdAt: "desc" }
        });
        res.json(users)
    } catch (error) {
        res.status(500).json({ error: "failed to fecth users" })
    }
})

router.get("/restaurants", async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: { owner: { select: { email: true, name: true } }, menuItems: true },
            orderBy: { createdAt: "desc" }
        })
        res.json(restaurants)
    } catch (error) {
        res.status(500).json({ error: "Failde to fetch restaurants" });
    }
});

router.get("/orders", async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                client: { select: { name: true, email: true } },
                restaurant: { select: { name: true } },
                items: { include: { menuItem: true } },
                driver: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders" })
    }
});

router.patch("/users/:id/deactivate", async (req, res) => {
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isActivate: false },
            select: { id: true, email: true, isActive: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to deactive user" })
    }
})

export default router