import { z } from "zod";

export const createMenuItemSchema = z.object({
    restaurantId: z.uuid("ID de restaurant invalide"),
    name: z.string().min(8, "Restaurant name fail"),
    description: z.string().optional(),
    price: z.number().positive("must be positive")
})

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
    isAvailable: z.boolean().optional()
});