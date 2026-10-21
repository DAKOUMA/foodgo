import { Router } from "express";
import { requireClient, requireRestaurant } from "../../middleware/authMiddleware";
import { validate } from "../../middleware/validate";
import { createRestaurantSchema, updateRestaurantSchema } from "../../../shared/schemas/restaurants.schemas";
import { restaurantController } from "./restaurant.controller";
import { createMenuItemSchema, updateMenuItemSchema } from "../../../shared/schemas/menuItem.schemas";
import { orderController } from "../order/order.controller";

const router = Router();

router.post("/create", requireClient, validate(createRestaurantSchema),  restaurantController.createRestaurant)
router.patch("/update/:id", requireRestaurant, validate(updateRestaurantSchema), restaurantController.updateRestaurant)
router.get("/menu-item", requireRestaurant,restaurantController.findMenuItems)
router.post("/menu-item/create", requireRestaurant, validate(createMenuItemSchema), restaurantController.createMenuItem)
router.patch("/menu-item/update/:id", requireRestaurant, validate(updateMenuItemSchema), restaurantController.updateMenuItem)
router.delete("/menu-item/delete/:id", requireRestaurant, restaurantController.deleteMenuItem)
router.get("/order", requireRestaurant, orderController.getOrder)
router.patch("/order/:id/status", requireRestaurant, orderController.patchOrderStatus)

export default router;