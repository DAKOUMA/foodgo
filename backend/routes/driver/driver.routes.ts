import { Router } from "express";
import { requireDriver } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { driverController } from "./driver.controller";
import { updateUserSchema } from "../../../shared/schemas/users.schemas";
import { orderController } from "../order/order.controller";


const router = Router();
router.use(requireDriver)

router.get("/me", driverController.getme),
router.patch("/update", validate(updateUserSchema), driverController.updateDriver)
router.get("/order", orderController.getOrder),
router.get("/order-available", orderController.getAvailableOrder),
router.patch("/order-status", orderController.patchOrderStatus),
router.patch("/order/:id/assign-driver", orderController.assignDriver)


export default router;