import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const searchQuery = req.query.search as string | undefined;
        const menuItems = await prisma.menuItem.findMany({
            where: {
                isAvailable: true,
                ...(searchQuery ? {name: { contains: searchQuery, mode: "insensitive" }} : {})
            }
        });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch menu items" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { restaurantId, name, description, price} = req.body;
        const menuItem = await prisma.menuItem.create({
            data: { restaurantId, name, description, price}
        })
        res.status(201).json(menuItem);
    } catch (error) {
        res.status(500).json({ error: "Failed to create menu item" });
    }
})

router.patch("/:id", async (req, res) => {
    try {
        const { restaurantId, name, description, price} = req.body;
        const menuItem = await prisma.menuItem.update({
            where: { id: req.params.id },
            data: { restaurantId, name, description, price}
        })
        res.status(200).json(menuItem);
    } catch (error) {
        res.status(500).json({ error: "Failed to update menu item" });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const menuItem = await prisma.menuItem.delete({
            where: { id: req.params.id }
        })
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete menu item" });
    }
})

export default router;