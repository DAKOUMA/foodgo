import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            where: { isOpen: true }, // Fetch only open restaurants
            include: { menuItems: true } // Include the menu items for each restaurant
        })
        if (restaurants.length === 0) {
            return res.status(404).json({ message: "No open restaurants found" });
        }
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
})

router.get("/:id", async (req, res) => {
    try {
        const restaurantId = req.params.id;
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: { menuItems: true } // Include the menu items for the restaurant
        })
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch restaurant" });
    }
})

router.post("/", async (req, res) => {
    try {
        const { ownerId, name, address, phone } = req.body;
        
        const newRestaurant = await prisma.restaurant.create({
            data: {
                ownerId,
                name,
                address,
                phone,
            }
        });
        res.status(201).json(newRestaurant);
    } catch (error) {
        res.status(500).json({ error: "Failed to create restaurant" });
    }
})

router.patch("/:id", async (req, res) => {
    try {
        const restaurantId = req.params.id;
        const { name, address, phone, isOpen } = req.body;

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
})

export default router;