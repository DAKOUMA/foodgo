import { z } from "zod";
import { registerSchema } from "./authValidators";

export const updateUserSchema = registerSchema.partial().extend({
    isActive: z.boolean().optional()
});
