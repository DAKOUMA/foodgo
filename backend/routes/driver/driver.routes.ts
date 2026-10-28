import { Router } from "express";
import { requireDriver } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { driverController } from "./driver.controller";
import { updateDriverSchema } from "../../../shared/schemas/users.schemas";
import { orderController } from "../order/order.controller";


const router = Router();
router.use(requireDriver)

router.get("/me", driverController.getme),
router.patch("/update", validate(updateDriverSchema), driverController.updateDriver)
router.get("/order", orderController.getOrder),
router.get("/order-available", orderController.getAvailableOrder),
router.patch("/order/:id/assign-driver", orderController.assignDriver)


export default router;