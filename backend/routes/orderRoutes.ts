import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest, requireRole } from "../middleware/authMiddleware";
import { OrderStatus } from "../generated/prisma/enums";
const router = Router();

const RESTAURANT_ALLOWED_TRANSITIONS: { [key: string]: string[] } = {
    "PENDING": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["READY"],
    "READY": ["CANCELLED"],
    "PICKED_UP": [],
    "DELIVERED": [],
    "CANCELLED": []
}

const DRIVER_ALLOWED_TRANSITIONS: { [key: string]: string[] } = {
    "PENDING": [],
    "CONFIRMED": [],
    "PREPARING": [],
    "READY": ["PICKED_UP"],
    "PICKED_UP": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": []
}

router.post("/", requireAuth, requireRole("CLIENT"), async (req: AuthRequest, res) => {
    try {
        const clientId = req.userId
        if (!clientId) {
            return res.status(401).json({ error: "no userId in req.userId" });
        }
        const { restaurantId, deliveryAddress, items } = req.body;

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
                    unitPrice: menuItem.price
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

router.get("/", requireAuth, async (req: AuthRequest, res) => {
    try {
        const { clientId, restaurantId, driverId } = req.query;
        const userRole = req.userRole
        const whereClause: any = {};

        switch (userRole) {
            case "ADMIN":
                if (clientId) whereClause.clientId = clientId as string;
                if (restaurantId) whereClause.restaurantId = restaurantId as string;
                if (driverId) whereClause.driverId = driverId as string;
                break;
            case "CLIENT":
                whereClause.clientId = req.userId
                break;
            case "RESTAURANT": {
                const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.userId } });
                if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
                whereClause.restaurantId = restaurant.id;
                break
            }
            case "DRIVER":
                whereClause.driverId = req.userId
                break
            default:
                break
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                items: { include: { menuItem: true } },
                restaurant: true
            },
            orderBy: { createdAt: "desc" }
        })
    
        if (orders.length === 0) {
            return res.status(404).json({ message: "No orders found" })
        }

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
})

router.get("/available", requireAuth, requireRole("DRIVER"), async (req: AuthRequest, res) => {
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



router.patch("/:id/assign-driver", requireAuth, requireRole("DRIVER"), async (req: AuthRequest, res) => {
    try {
        const orderId = req.params.id as string
        const { status: newStatus } = req.body
        const order = await prisma.order.findUnique({ where: { id: orderId } })
        if (!order) return res.status(404).json({ error: "Order not found" });

        // const driverTransitions: OrderStatus[] = ["PICKED_UP", "DELIVERED"]
        const allowed = DRIVER_ALLOWED_TRANSITIONS[order.status];



        if (!order.driverId) {
            if (order.status !== "READY") {
                return res.status(400).json({ error: "Order is not ready for pickup" });
            }
        } else if (order.driverId !== req.userId) {
            return res.status(409).json({ error: "Order already assigned to another driver" });
        }

        if (!allowed || !allowed.includes(newStatus)) {
            return res.status(400).json({ error: `Invalid status transition from ${order.status} to ${newStatus}` });
        }


        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { driverId: req.userId, status: newStatus }
        })
        res.json(updatedOrder);
    } catch (error) {
        return res.status(500).json({ error: "Failed to update order status" });
    }
})

router.patch("/:id/status", requireAuth, async (req: AuthRequest, res) => {
    try {
        const orderId = req.params.id as string;
        const { status: newStatus } = req.body;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { restaurant: true }
        })

        if (!order) return res.status(404).json({ error: "Order not found" });

        const allowed = RESTAURANT_ALLOWED_TRANSITIONS[order.status];

        if (!allowed.includes(newStatus)) {
            return res.status(400).json({ error: `Invalid status transition from ${order.status} to ${newStatus}` });
        }

        if (req.userRole !== "RESTAURANT" || order.restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: "Not authorized for this transitions" })
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