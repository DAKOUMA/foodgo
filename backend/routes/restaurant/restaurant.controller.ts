import { prisma } from "../../lib/prisma";
import { AuthRequest } from "../../middleware/authMiddleware";
import { Response } from "express";
import { sameDataHandler } from "../../middleware/checkSameData";
import { Prisma } from "../../generated/prisma/client";

export const restaurantController = {

    createRestaurant: async (req: AuthRequest, res: Response) => {
        try {
            const { name, address, phone } = req.body;
            const ownerId = req.userId as string

            const updateUserRole = await prisma.user.update({
                where: { id: ownerId},
                data: {
                    role: "RESTAURANT"
                },
                select: {
                    name: true,
                    role: true,
                    isActive: true
                }
            })

            const newRestaurant = await prisma.restaurant.create({
                data: {
                    ownerId,
                    name,
                    address,
                    phone,
                }
            });
            res.status(201).json({"restaurant": newRestaurant, "owner": updateUserRole});
        } catch (error) {
            res.status(500).json({ error: "Failed to create restaurant" });
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
                return res.status(403).json({ error: same.error })
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
            res.status(500).json({ error: "Failed to update restaurant" });
        }
    },

    findMenuItems: async (req: AuthRequest, res: Response) => {
        const ownerId = req.userId

        try {
            const restaurant = await prisma.restaurant.findUnique({
                where: { ownerId: ownerId }, // Fetch only open restaurants
                include: { menuItems: true } // Include the menu items for each restaurant
            })

            res.json(restaurant?.menuItems);
        } catch (error) {
            res.status(404).json({ error: "Restaurant not foun d", message: ownerId });
        }
    },

    createMenuItem: async (req: AuthRequest, res: Response) => {
        try {
            const { restaurantId, name, description, price } = req.body;

            const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
            const menuItemFind = await prisma.menuItem.findFirst({ where: { name: name } }) // find another menuItem with the same name
            if (!restaurant) {
                return res.status(404).json({ error: "Restaurant not found" })
            }
            // Check if the person creating the menu item is the owner
            if (restaurant.ownerId !== req.userId) {
                return res.status(403).json({ error: "You are note the owner of this restaurant" })
            }
            // Check the name and return an error of same name of menuItem
            if (menuItemFind?.name === name) {
                return res.status(403).json({ error: "Another items with this name already exist" })
            }
            // Create the menuItem with all the data
            const menuItem = await prisma.menuItem.create({
                data: { restaurantId, name, description, price }
            })
            res.status(201).json(menuItem);
        } catch (error) {
            res.status(500).json({ error: "Failed to create menu item" });
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
            const data: Prisma.MenuItemUpdateInput = {isAvailable, name, description, price}
            const same = sameDataHandler(data, menuItem)
            
            if (same) {
                return res.status(403).json({ error: same.error })
            }
            
            const updated = await prisma.menuItem.update({
                where: { id: menuItemId },
                data: { isAvailable, name, description, price }
            })
            res.status(200).json(updated);
        } catch (error) {
            res.status(500).json({ error: "Failed to update menu item" });
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
            res.status(204).send({ message: "Item deleted" });
        } catch (error) {
            res.status(500).json({ error: "Failed to delete menu item" });
        }
    }
}