import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware";
const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { clientId, restaurantId, deliveryAddress, items } = req.body;

        const menuItemsIds = items.map((item: { menuItemId: string; quantity: number }) => item.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
            where: { id: { in: menuItemsIds } }
        });

        if (menuItems.length !== items.length) {
            return res.status(400).json({ error: "Some menu items are not available" });
        }

        let totalPrice = 0;
        const orderItemsData = items.map((item: { menuItemId: string; quantity: number }) => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);

            if (!menuItem) {
                throw new Error("Menu item not found");
            } else {
                totalPrice += menuItem.price * item.quantity;
                return {
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: menuItem.price
                }
            }
        });

        const newOrder = await prisma.order.create({
            data: {
                clientId,
                restaurantId,
                deliveryAddress,
                totalPrice,
                items: { create: orderItemsData },
            },
            include: { items: { include: { menuItem: true } } }
        })
        res.json(newOrder);
    } catch (error) {
        res.status(500).json({ error: "Failed to create order" });
    }
})

router.get("/", async (req, res) => {
    try {
        const { clientId, restaurantId, driverId } = req.query;
        const whereClause: any = {};
        if (clientId) whereClause.clientId = clientId as String;
        if (restaurantId) whereClause.restaurantId = restaurantId as String;
        if (driverId) whereClause.driverId = driverId as String;

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                items: { include: { menuItem: true } },
                restaurant: true
            },
            orderBy: { createdAt: "desc" }
        })

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
})

router.get("/available", async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { driverId: null, status: "READY" },
            include: {
                items: { include: { menuItem: true } },
                restaurant: true
            }
        })

        if (orders.length === 0) {
            return res.status(404).json({ message: "No available orders found" });
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch available orders" });
    }
})

const ALLOWED_TRANSITIONS: { [key: string]: string[] } = {
    "PENDING": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["READY"],
    "READY": ["PICKED_UP"],
    "PICKED_UP": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": ["PENDING"]
}

router.patch("/:id/status", async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status: newStatus } = req.body;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const allowed = ALLOWED_TRANSITIONS[order.status];
        if (!allowed.includes(newStatus)) {
            return res.status(400).json({ error: `Invalid status transition from ${order.status} to ${newStatus}` });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        });
        res.json(updatedOrder);

    } catch (error) {
        return res.status(500).json({ error: "Failed to update order status" });
    }
})

export default router;