import express  from "express";
import cors from "cors";
import restaurantRoutes from "./routes/restaurant/restaurant.routes";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/admin/admin.routes";
import usersRoutes from "./routes/user/users.routes";
import driverRoutes from "./routes/driver/driver.routes";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "FoodGo API is running" });
});

app.use("/restaurants", restaurantRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/users", usersRoutes);
app.use("/driver", driverRoutes)

app.use(notFound);
app.use(errorHandler);

const PORT = env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on  http://localhost:${PORT}`);
});