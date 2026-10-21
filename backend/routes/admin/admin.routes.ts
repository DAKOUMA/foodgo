import { Router } from "express";
import { requireAdmin } from "../../middleware/authMiddleware";
import { adminController } from "./admin.controller";

const router = Router();

router.use(requireAdmin);

router.get("/users", adminController.findManyUser)

router.get("/restaurants", adminController.findManyRestaurant);

router.get("/orders", adminController.findManyOrders);

router.patch("/users/:id/deactivate", adminController.deactiveUsers)

export default router