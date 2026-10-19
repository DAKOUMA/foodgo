import { z } from "zod"

// export const updateUserSchema = z.object({
//     name: z.string().min(4, "name must be at leat 4 character"),
//     phone: z.string(),
//     address: z.string().min(10, "Adress must be at least 10 character"),
//     paymentMethode: z.enum(["CASH", "MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY"]),
//     currentPassword: z.string(),
//     newPassword: z.string().min(8, "The new password must be at least 8 character")
// }).partial()
//     .refine(
//         (data) => !data.newPassword || data.currentPassword,
//         { message: "the current password is required to change password", path: ["currentPassword"] }
//     )

export const updateUserSchema = z.object({
    name: z.string().min(4, { message: "4 caractere minimum" }),
    phone: z.string().optional(),
    address: z.string().min(10, { message: "Indique ton adresse (10 caracteres minimum)" }).optional(),
    role: z.enum(["CLIENT", "RESTAURANT", "DRIVER"]),
    currentPassword: z.string().min(8, { message: "8 caractere minimum" }),
    newPassword: z.string().min(8, { message: "8 caractere minimum" }),
    confirmNewPassword: z.string().min(8, { message: "8 caractere minimum" }),
})
    .partial()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"]
    })
