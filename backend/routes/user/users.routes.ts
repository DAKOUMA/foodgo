import { Router } from "express";
import { requireClient } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { updateUserSchema } from "../../../shared/schemas/users.schemas";
import { userController } from "./users.controller";
import { createOrderSchema } from "../../../shared/schemas/order.schemas";
import { orderController } from "../order/order.controller";

const router = Router();
router.use(requireClient)
// Tous les rôles ont un profil, donc requireAuth seul (pas de requireRole)
router.get("/me", userController.getme);
router.get("/menu-items", userController.findMenuItems);
router.get("/restaurants", userController.findRestaurants)
router.patch("/me", validate(updateUserSchema), userController.updateUser);
router.get("/order", orderController.getOrder)
router.post("/order/create", validate(createOrderSchema), orderController.createOrder)

export default router;
