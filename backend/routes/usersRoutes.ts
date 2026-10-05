import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { requireAuth, AuthRequest } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { updateUserSchema } from "../validators/usersValidators";

const router = Router();

// Les champs qu'on a le droit de renvoyer. Jamais le password.
const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    address: true,
    paymentMethod: true,
    role: true,
} satisfies Prisma.UserSelect;

// Tous les rôles ont un profil, donc requireAuth seul (pas de requireRole)
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: publicUserSelect,
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user information" });
    }
});

router.patch("/me", requireAuth, validate(updateUserSchema), async (req: AuthRequest, res) => {
    try {
        const userId = req.userId as string;
        const { name, phone, address, paymentMethod, currentPassword, newPassword } = req.body;

        // Prisma ignore les champs valant undefined : seuls les champs envoyés sont modifiés
        const data: Prisma.UserUpdateInput = { name, phone, address, paymentMethod };

        if (newPassword) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) {
                return res.status(403).json({ error: "Current password is incorrect" });
            }
            data.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data,
            select: publicUserSelect,
        });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: "Failed to update user information" });
    }
});

export default router;