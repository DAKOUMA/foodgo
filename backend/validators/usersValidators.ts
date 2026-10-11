import { z } from "zod";
import { registerSchema } from "./authValidators";

export const updateUserSchema = z.object({
    name: z.string().min(4, "Nom trop court"),
    phone: z.string(),
    address: z.string().min(5, "Adresse trop court"),
    paymentMethode: z.enum(["CASH", "MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY"]),
    currentPassword: z.string(),
    newPassword: z.string().min(8, "au moins 8 caracter pour password")
})  .partial()
    .refine(
    (data) => !data.newPassword || data.currentPassword,
    {message: "currentPassword est requis pour changer le mot de passe", path: ["currentPassword"]}
)
