import { z } from "zod";

export const registerSchema = z.object({
    email: z.email("Invalid Email"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
    name: z.string().min(4, "name require"),
    phone: z.string().optional(),
    role: z.enum(["CLIENT", "RESTAURANT", "DRIVER"]),
    address: z.string().min(10, "Address must be at least 10 character").optional()
})

export const loginSchema = z.object({
    email: z.email("Invalid Email"),
    password: z.string().min(8, "Password must contain at least 8 characters"),
})
