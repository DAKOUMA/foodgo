import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AuthRequest } from "../../middleware/authMiddleware";
import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { sameDataHandler } from "../../middleware/checkSameData";

const publicUserSelect = {
    id: true,
    name: true,
    phone: true,
    address: true,
    paymentMethod: true,
    role: true,
} satisfies Prisma.UserSelect;

export const userController = {
    getme: async (req: AuthRequest, res: Response) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                select: publicUserSelect,
            });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch user information" });
        }
    },

    findMenuItems: async (req: Request, res: Response) => {
        try {
            const searchQuery = req.query.search as string | undefined;
            const menuItems = await prisma.menuItem.findMany({ 
                where: {
                    isAvailable: true,
                    ...(searchQuery ? { name: { contains: searchQuery, mode: "insensitive" } } : {})
                }
            });

            if (menuItems.length === 0) { // check the length of the menu-items found
                res.status(404).json({ message: "no avalaible menu-items found" })
            }

            res.json(menuItems);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch menu items" });
        }
    },

    findRestaurants: async (req: Request, res: Response) => {
        try {
            const searchQuery = req.query.search as string | undefined;
            const restaurants = await prisma.restaurant.findMany({
                where: {
                    isOpen: true,
                    ...(searchQuery ? { name: { contains: searchQuery, mode: "insensitive" } } : {})
                }
            });

            if (restaurants.length === 0) { // check the length of the restaurants found
                res.status(404).json({ message: "no Open restaurant found" }) 
            }

            res.json(restaurants);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch restaurants" });
        }
    },

    updateUser: async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.userId as string;
            const { name, phone, address, paymentMethod, currentPassword, newPassword } = req.body;
            // Prisma ignore les champs valant undefined : seuls les champs envoyés sont modifiés
            const data: Prisma.UserUpdateInput = { name, phone, address, paymentMethod };
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
            res.json(updatedUser);
        } catch (error) {
            res.status(500).json({ error: "Failed to update user information" });
        }
    },
}