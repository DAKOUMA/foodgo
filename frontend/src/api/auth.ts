import { apiClient } from "./client";
import type { AuthResponse, Role, User } from "../types";

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
    address: string;
    phone?: string;
    role: Exclude<Role, "ADMIN">;
}

export async function loginRequest(email: string, password: string) {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    return data;
}

export async function registerRequest(input: RegisterInput) {
    const { data } = await apiClient.post<User>("/auth/register", input);
    return data;
}