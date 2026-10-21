import { z } from "zod"

export const updateUserSchema = z.object({
    name: z.string().min(4, { message: "4 caractere minimum" }),
    phone: z.string().optional(),
    address: z.string().min(10, { message: "Indique ton adresse (10 caracteres minimum)" }).optional(),
    role: z.enum(["CLIENT", "RESTAURANT", "DRIVER"]),
    currentPassword: z.string().min(8, { message: "8 caractere minimum" }),
    newPassword: z.string().min(8, { message: "8 caractere minimum" }),
    isActiveAsDriver: z.boolean({message: "must be a boolean"}),
    confirmNewPassword: z.string().min(8, { message: "8 caractere minimum" }),
})
    .partial()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"]
    })
