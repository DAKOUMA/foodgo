import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { AuthRequest } from "../../middleware/authMiddleware";
import { Response } from "express";
import { sameDataHandler } from "../../middleware/checkSameData";
import { UpdateDriverInput } from "../../../shared/schemas/users.schemas";

const DRIVER_ALLOWED_TRANSITIONS: { [key: string]: string[] } = {
    "PENDING": [],
    "CONFIRMED": [],
    "PREPARING": [],
    "READY": ["PICKED_UP"],
    "PICKED_UP": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": []
}

const publicUserSelect = {
    id: true,
    name: true,
    phone: true,
    address: true,
    paymentMethod: true,
    ordersAsDriver: true,
    role: true,
    isActiveAsDriver: true
} satisfies Prisma.UserSelect;

export const driverController = {
    getme: async (req: AuthRequest, res: Response) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                select: publicUserSelect,
            });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            return res.json(user);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch user information" });
        }
    },

    updateDriver: async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId as string;
            const { name, phone, address, paymentMethod, currentPassword, newPassword, isActiveAsDriver } = req.body;
            // Prisma ignore les champs valant undefined : seuls les champs envoyés sont modifiés
            const data: UpdateDriverInput = { name, phone, address, paymentMethod, isActiveAsDriver };
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (newPassword) {
                const valid = await bcrypt.compare(currentPassword, user.password);
                if (!valid) {
                    return res.status(403).json({ error: "Current password is incorrect" });
                }
                const same = await bcrypt.compare(newPassword, user.password);
                if (same) {
                    return res.status(403).json({ error: "New password must be different of current password" })
                }
                data.password = await bcrypt.hash(newPassword, 10);
            }

            const same = sameDataHandler(data, user)
            if (same) {
                return res.status(403).json({ error: same.error })
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data,
                select: publicUserSelect,
            });
            return res.json(updatedUser);
        } catch (error) {
            return res.status(500).json({ error: "Failed to update driver information" });
        }
    },

    getAvailableOrder: async (req: AuthRequest, res: Response) => {
        try {
            const orders = await prisma.order.findMany({
                where: { driverId: null, status: "READY" },
                include: {
                    items: { include: { menuItem: true } },
                    restaurant: true
                }
            })

            if (orders.length === 0) {
                return res.status(200).json({ message: "No available orders found" });
            }
            return res.json(orders);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch available orders" });
        }
    },

    assignDriver: async (req: AuthRequest, res: Response) => {
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
            return res.json(updatedOrder);
        } catch (error) {
            return res.status(500).json({ error: "Failed to update order status" });
        }
    },
}