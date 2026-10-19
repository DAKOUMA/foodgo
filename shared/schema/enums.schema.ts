import { z } from "zod";

export const paymentMethodSchema = z.enum(["CASH", "MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY"]);
export const roleSchema = z.enum(["CLIENT", "RESTAURANT", "DRIVER", "ADMIN"]);
export const orderStatusSchema = z.enum(["PENDING", "CONFIRMED", "PREPARING", "READY", "PICKED_UP", "DELIVERED", "CANCELLED"]);

export type Role = z.infer<typeof roleSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;