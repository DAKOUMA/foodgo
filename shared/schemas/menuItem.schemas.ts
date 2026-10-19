import { z } from "zod";

export const createMenuItemSchema = z.object({
    restaurantId: z.uuid("restaurant id invalid"),
    name: z.string().min(4, "name must be at least 4 character"),
    description: z.string().min(10, "Description must be at least 10 character").optional(),
    price: z.number().int("must be an integer").positive("must be positive"),
    isAvailable: z.boolean().optional(),
    imageUrl: z.url().optional()
})

// export const updateMenuItemSchema = createMenuItemSchema.partial()

export const updateMenuItemSchema = z.object({
    name: z.string().min(4, "name must be at least 4 character"),
    description: z.string().min(10, "Description must be at least 10 character").optional(),
    price: z.number().int("must be an integer").positive("must be positive"),
    isAvailable: z.boolean().optional(),
    imageUrl: z.url()
}).partial()