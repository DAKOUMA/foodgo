import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";

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

export const orderController = {
    createOrder: async (req: AuthRequest, res: Response) => {
        try {
            const clientId = req.userId
            if (!clientId) {
                return res.status(401).json({ error: "no userId in req.userId" });
            }
            const { restaurantId, deliveryAddress, paymentMethod, items } = req.body;

            // 1. Le restaurant existe et est ouvert ?
            const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
            if (!restaurant) {
                return res.status(404).json({ error: "Restaurant not found" });
            }
            if (!restaurant.isOpen) {
                return res.status(400).json({ error: "Restaurant is closed" });
            }

            // 2. Les plats appartiennent à CE restaurant et sont disponibles ?
            const menuItemsIds: string[] = items.map((item: { menuItemId: string }) => item.menuItemId);
            const menuItems = await prisma.menuItem.findMany({
                where: { id: { in: menuItemsIds }, restaurantId, isAvailable: true }
            });

            // Set retire les doublons : on compare au nombre de plats DISTINCTS demandés
            if (menuItems.length !== new Set(menuItemsIds).size) {
                return res.status(400).json({ error: "Some menu items are not available" });
            }

            // 3. Le total est calculé côté serveur, à partir des prix en base
            let totalPrice = 0;
            const orderItemsData = items.map((item: { menuItemId: string; quantity: number }) => {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!;
                totalPrice += menuItem.price * item.quantity;
                return {
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    unitPrice: menuItem.price
                };
            });

            // 4. Création : pickupAddress vient du restaurant, pas du client
            const newOrder = await prisma.order.create({
                data: {
                    clientId,
                    restaurantId,
                    deliveryAddress,
                    pickupAddress: restaurant.address,
                    paymentMethod,
                    totalPrice,
                    items: { create: orderItemsData },
                },
                include: { items: { include: { menuItem: true } } }
            })
            return res.status(201).json(newOrder);
        } catch (error) {
            return res.status(500).json({ error: "Failed to create order" });
        }
    },

    getOrder: async (req: AuthRequest, res: Response) => {
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
                return res.status(200).json({ message: "No orders found" })
            }

            res.json(orders);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch orders" });
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
            res.json(orders);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch available orders" });
        }
    },

    assignDriver: async (req: AuthRequest, res: Response) => {
        try {
            const orderId = req.params.id as string;
            const driverId = req.userId as string;
            const driver = await prisma.user.findUnique({ where: { id: driverId } });
            const { status: newStatus } = req.body;

            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) return res.status(404).json({ error: "Order not found" });

            if (!driver?.isActiveAsDriver) {
                return res.status(403).json({ error: "You must be active as driver to take orders" });
            }

            // La commande appartient déjà à un autre livreur
            if (order.driverId && order.driverId !== driverId) {
                return res.status(409).json({ error: "Order already assigned to another driver" });
            }

            // Prendre une commande libre : elle doit être READY et le livreur actif
            if (!order.driverId) {
                if (order.status !== "READY") {
                    return res.status(400).json({ error: "Order is not ready for pickup" });
                }
            }

            const allowed = DRIVER_ALLOWED_TRANSITIONS[order.status];
            if (!allowed.includes(newStatus)) {
                return res.status(400).json({ error: `Invalid status transition from ${order.status} to ${newStatus}` });
            }

            // ⭐ Écriture conditionnelle : ne marche que si rien n'a changé depuis la lecture
            const result = await prisma.order.updateMany({
                where: { id: orderId, status: order.status, driverId: order.driverId },
                data: { driverId, status: newStatus },
            });

            if (result.count === 0) {
                return res.status(409).json({ error: "Order was just taken or updated by someone else" });
            }

            const updatedOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { items: { include: { menuItem: true } }, restaurant: true },
            });
            res.json(updatedOrder);
        } catch (error) {
            return res.status(500).json({ error: "Failed to update order status" });
        }
    },

    patchOrderStatus: async (req: AuthRequest, res: Response) => {
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
    }
}