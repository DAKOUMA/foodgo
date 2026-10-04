import { z } from "zod";

export const createMenuItemSchema = z.object({
    restaurantId: z.uuid("ID de restaurant invalide"),
    name: z.string().min(2, "Nom du menu trop court"),
    description: z.string().optional(),
    price: z.number().positive("must be positive")
})

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
    isAvailable: z.boolean().optional()
});