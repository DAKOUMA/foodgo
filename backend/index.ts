import express  from "express";
import cors from "cors";
import restaurantRoutes from "./routes/restaurantRoutes";
import menuItemRoutes from "./routes/menuItemRoutes";
import orderRoutes from "./routes/orderRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes"

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "FoodGo API is running" });
});

app.use("/restaurants", restaurantRoutes);
app.use("/menu-items", menuItemRoutes);
app.use("/orders", orderRoutes);
app.use("/auth", authRoutes)
app.use("/admin", adminRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on  http://localhost:${PORT}`);
});