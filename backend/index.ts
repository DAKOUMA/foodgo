import express  from "express";
import cors from "cors";
import restaurantRoutes from "./routes/restaurant/restaurant.routes";

import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/admin/admin.routes";
import usersRoutes from "./routes/user/users.routes";
import driverRoutes from "./routes/driver/driver.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "FoodGo API is running" });
});

app.use("/restaurants", restaurantRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/users", usersRoutes);
app.use("/driver", driverRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on  http://localhost:${PORT}`);
});