import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth, requireRole } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createMenuItemSchema, updateMenuItemSchema } from "../validators/menuItemValidators";
const router = Router();

router.get("/", async (req, res) => {
    try {
        const searchQuery = req.query.search as string | undefined;
        const menuItems = await prisma.menuItem.findMany({
            where: {
                isAvailable: true,
                ...(searchQuery ? { name: { contains: searchQuery, mode: "insensitive" } } : {})
            }
        });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch menu items" });
    }
});

router.post("/", requireAuth, requireRole("RESTAURANT"), validate(createMenuItemSchema), async (req: AuthRequest, res) => {
    try {
        const { restaurantId, name, description, price } = req.body;

        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" })
        }
        if (restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: "You are note the owner of this restaurant" })
        }

        const menuItem = await prisma.menuItem.create({
            data: { restaurantId, name, description, price }
        })
        res.status(201).json(menuItem);
    } catch (error) {
        res.status(500).json({ error: "Failed to create menu item" });
    }
})

router.patch("/:id", requireAuth, validate(updateMenuItemSchema), async (req: AuthRequest, res) => {
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
        const updated = await prisma.menuItem.update({
            where: { id: menuItemId },
            data: { isAvailable, name, description, price }
        })
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update menu item" });
    }
})

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
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
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete menu item" });
    }
})

export default router;