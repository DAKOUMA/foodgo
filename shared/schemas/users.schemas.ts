import { z } from "zod";
import {PaymentMethod}  from "../../backend/generated/prisma/enums";

// Champs communs à tous les utilisateurs (tous optionnels : PATCH partiel)
const profileFields = {
    name: z.string().min(4, "4 caractères minimum").optional(),
    phone: z.string().optional(),
    address: z.string().min(10, "10 caractères minimum").optional(),
    paymentMethod: z.enum(PaymentMethod).optional(),
    password: z.string().min(8, "8 caractères minimum").optional(),
    currentPassword: z.string().min(8, "8 caractères minimum").optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
};

// Règles qui lient plusieurs champs entre eux
type PasswordFields = {
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
};

function checkPasswordChange(data: PasswordFields, ctx: z.RefinementCtx) {
    const { currentPassword, newPassword, confirmNewPassword } = data;

    if (!newPassword) {
        if (confirmNewPassword) {
            ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Nouveau mot de passe manquant" });
        }
        return;
    }
    if (!currentPassword) {
        ctx.addIssue({ code: "custom", path: ["currentPassword"], message: "Mot de passe actuel requis" });
    }
    if (newPassword !== confirmNewPassword) {
        ctx.addIssue({ code: "custom", path: ["confirmNewPassword"], message: "Les mots de passe ne correspondent pas" });
    }
}

export const updateClientSchema = z.object(profileFields).superRefine(checkPasswordChange);

export const updateDriverSchema = z
    .object({ ...profileFields, isActiveAsDriver: z.boolean("must be a boolean").optional() })
    .superRefine(checkPasswordChange);

// Types réutilisables côté frontend
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
