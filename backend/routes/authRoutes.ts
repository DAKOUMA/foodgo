import { Router } from "express";
import bcrypt from "bcrypt"
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validators/authValidators";

const router = Router()

router.post("/register", validate(registerSchema), async (req, res) => {
    try {
        const { email, password, name, phone, role } = req.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: "Email already used" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, phone, role },
            select: { id: true, email: true, name: true, role: true } // never send critical data
        });

        res.status(201).json(user)
    } catch (error) {
        res.status(500).json({ error: "Registration failed" })
    }
})

router.post("/login",validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Incorect email or password" })
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ error: "Incorect email or password" })
        }

        if (!user.isActive) {
            return res.status(403).json({ error: "Account deactivate" })
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        )

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
})

export default router