import { boolean, z } from "zod";

export const createRestaurantSchema = z.object({
    name: z.string().min(4, "name required"),
    address: z.string().min(10, "address required"),
    phone: z.string().regex(/^(\+261|0)3[2-9]\d{7}$/, "Numéro de téléphone invalide"),
    isOpen: z.boolean().optional()
})

export const updateRestaurantSchema = createRestaurantSchema.partial().extend({
    isOpen: z.boolean().optional()
})