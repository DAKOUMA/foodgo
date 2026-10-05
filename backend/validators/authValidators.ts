import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().email("Invalid Email"),
    password: z.string().min(8, "Password must contenant at least 8 characters"),
    name: z.string().min(4, "name require"),
    phone: z.string().optional(),
    role: z.enum(["CLIENT", "RESTAURANT", "DRIVER"]),
    address: z.string().min(5, "Address required")
})

export const loginSchema = z.object({
    email: z.string().email("Invalid Email"),
    password: z.string().min(8, "Password must contenant at least 8 characters"),
})