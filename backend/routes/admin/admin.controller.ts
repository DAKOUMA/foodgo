import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export const adminController = {
    findManyUser: async (req: Request, res: Response) => {
        try {
            const users = await prisma.user.findMany({
                select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
                orderBy: { createdAt: "desc" }
            });
            return res.json(users)
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "failed to fetch users" })
        }
    },

    findManyRestaurant: async (req: Request, res: Response) => {
        try {
            const restaurants = await prisma.restaurant.findMany({
                include: { owner: { select: { email: true, name: true } }, menuItems: true },
                orderBy: { createdAt: "desc" }
            })
            return res.json(restaurants)
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to fetch restaurants" });
        }
    },

    findManyOrders: async (req: Request, res: Response) => {
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
            return res.json(orders);
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to fetch orders" })
        }
    },

    deactiveUsers: async (req: Request, res: Response) => {
        try {
            const userActive = await prisma.user.findUnique({
                where: { id: req.params?.id as string },
                select: { isActive: true }
            })

            if (!userActive) {
                return res.status(404).json({ error: "user not found" })
            }

            const user = await prisma.user.update({
                where: { id: req.params?.id as string },
                data: { isActive: !userActive?.isActive },
                select: { id: true, email: true, isActive: true, name: true }
            });
            return res.json({ user: user, message: (userActive?.isActive ? `${user.name} is now deactive` : `${user.name} is now active`) });
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to deactivate user" })
        }
    }
}