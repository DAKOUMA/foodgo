import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest, requireAuth, requireRole } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { createRestaurantSchema, updateRestaurantSchema } from "../validators/restaurantsValidators";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            where: { isOpen: true }, // Fetch only open restaurants
            include: { menuItems: true } // Include the menu items for each restaurant
        })
        if (restaurants.length === 0) {
            return res.status(200).json({ message: "No open restaurants found" });
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

router.post("/", requireAuth, requireRole("RESTAURANT"), validate(createRestaurantSchema),  async (req: AuthRequest, res) => {
    try {
        const { name, address, phone } = req.body;
        const ownerId = req.userId as string

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

router.patch("/:id", requireAuth, validate(updateRestaurantSchema), async (req: AuthRequest, res) => {
    try {
        const restaurantId = req.params.id as string;
        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" })
        }
        if (restaurant.ownerId !== req.userId) {
            return res.status(403).json({ error: "Your are not the owner" })
        }

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