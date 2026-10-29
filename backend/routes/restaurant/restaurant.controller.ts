import { prisma } from "../../lib/prisma";
import { AuthRequest } from "../../middleware/authMiddleware";
import { Response } from "express";
import { sameDataHandler } from "../../middleware/checkSameData";
import { Prisma } from "../../generated/prisma/client";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export const restaurantController = {

    createRestaurant: async (req: AuthRequest, res: Response) => {
        try {
            const { name, address, phone } = req.body;
            const ownerId = req.userId as string

            const [owner, restaurant] = await prisma.$transaction([
                prisma.user.update({
                    where: { id: ownerId },
                    data: {
                        role: "RESTAURANT"
                    },
                    select: {
                        id: true,
                        name: true,
                        role: true,
                        isActive: true
                    }
                }),
                prisma.restaurant.create({
                    data: {
                        ownerId,
                        name,
                        address,
                        phone,
                    }
                })
            ]);

            const token = jwt.sign(
                { userId: owner.id, role: owner.role },
                env.JWT_SECRET,
                { expiresIn: "7d" }
            )

            return res.status(201).json({ restaurant, owner, token });
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to create restaurant" });
        }
    },

    updateRestaurant: async (req: AuthRequest, res: Response) => {
        try {
            const restaurantId = req.params.id as string;
            const { name, address, phone, isOpen } = req.body;
            const data: Prisma.RestaurantUpdateInput = { name, address, phone, isOpen }
            const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })

            if (!restaurant) {
                return res.status(404).json({ error: "Restaurant not found" })
            }
            if (restaurant.ownerId !== req.userId) {
                return res.status(403).json({ error: "Your are not the owner" })
            }

            const same = sameDataHandler(data, restaurant)
            if (same) {
                return res.status(400).json({ error: same.error })
            }

            const updatedRestaurant = await prisma.restaurant.update({
                where: { id: restaurantId },
                data: {
                    name,
                    address,
                    phone,
                    isOpen
                }
            });
            res.json(updatedRestaurant);
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to update restaurant" });
        }
    },

    findMenuItems: async (req: AuthRequest, res: Response) => {

        try {
            const restaurant = await prisma.restaurant.findUnique({
                where: { ownerId: req.userId },
                include: { menuItems: true },
            });

            if (!restaurant) {
                return res.status(404).json({ error: "Restaurant not found" });
            }

            res.json(restaurant.menuItems);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch menu items" });
        }
    },

    createMenuItem: async (req: AuthRequest, res: Response) => {
        try {
            const { restaurantId, name, description, price } = req.body;

            const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
            const menuItemFind = await prisma.menuItem.findFirst({ where: { name: name, restaurantId: restaurantId } }) // find another menuItem with the same name
            
            if (!restaurant) {
                return res.status(404).json({ error: "Restaurant not found" })
            }
            // Check if the person creating the menu item is the owner
            if (restaurant.ownerId !== req.userId) {
                return res.status(400).json({ error: "You are note the owner of this restaurant" })
            }
            // Check the name and return an 0rror of same name of menuItem
            if (menuItemFind?.name === name) {
                return res.status(409).json({ error: "Another items with this name already exist" })
            }
            // Create the menuItem with all the data
            const menuItem = await prisma.menuItem.create({
                data: { restaurantId, name, description, price }
            })
            return res.status(201).json(menuItem);
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to create menu item" });
        }
    },

    updateMenuItem: async (req: AuthRequest, res: Response) => {
        try {
            const menuItemId = req.params.id as string
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: menuItemId },
                include: { restaurant: true }
            })

            if (!menuItem) {
                return res.status(404).json({ error: "Menu item not found" })
            }
            if (menuItem.restaurant.ownerId !== req.userId) {
                return res.status(403).json({ error: "You are not the owner of this restaurant" })
            }

            const { isAvailable, name, description, price } = req.body;
            const data: Prisma.MenuItemUpdateInput = { isAvailable, name, description, price }
            const same = sameDataHandler(data, menuItem)

            if (same) {
                return res.status(400).json({ error: same.error })
            }

            const updated = await prisma.menuItem.update({
                where: { id: menuItemId },
                data: { isAvailable, name, description, price }
            })
            return res.status(200).json(updated);
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to update menu item" });
        }
    },

    deleteMenuItem: async (req: AuthRequest, res: Response) => {
        try {
            const menuItemId = req.params.id as string
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: menuItemId },
                include: { restaurant: true }
            })

            if (!menuItem) {
                return res.status(404).json({ error: "Menu item not found" })
            }
            if (menuItem.restaurant.ownerId !== req.userId) {
                return res.status(403).json({ error: "You are not the owner of this restaurant" })
            }

            await prisma.menuItem.delete({ where: { id: menuItemId } })
            return res.status(204).send({ message: "Item deleted" });
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Failed to delete menu item" });
        }
    }
}