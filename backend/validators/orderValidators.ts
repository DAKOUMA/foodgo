import {z} from "zod"

const item = z.object({
    menuItemId: z.uuid(),
    quantity: z.number().int("must be an integer").positive("must be a positive number")
})

export const createOrderSchema = z.object({
    restaurantId: z.uuid(),
    deliveryAddress: z.string().min(1, "must be at least 1 character long"),
    items: z.array(item).min(1, "must have at least 1 item")
})