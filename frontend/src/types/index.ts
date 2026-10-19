import { z } from "zod"
import { registerSchema } from "../../../shared/schemas/auth.schemas"

export type Role = "CLIENT" | "RESTAURANT" | "DRIVER" | "ADMIN";

export type PaymentMethod = "CASH" | "MVOLA" | "ORANGE_MONEY" | "AIRTEL_MONEY";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "PICKED_UP" | "DELIVERED" | "CANCELLED";

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    address?: string;
    role: Role;
    isActive: boolean;
    paymentMethod?: PaymentMethod;
    createdAt: Date;
}

export type UserType = z.infer<typeof registerSchema>

export interface AuthResponse {
    user: User;
    token: string;
}

export interface Restaurant {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    createdAt: Date;
}

export interface MenuItem {
    id: string;
    restaurantId: string;
    name: string;
    description?: string;
    price: number;
    isAvailable: boolean;
}

export interface OrderItem {
    id: string;
    orderId: string;
    menuItemId: string;
    quantity: number;
}

export interface Order {
    id: string;
    clientId: string;
    restaurantId: string;
    driverId?: string | null;
    status: OrderStatus;
    totalPrice: number;
    createdAt: Date;
}