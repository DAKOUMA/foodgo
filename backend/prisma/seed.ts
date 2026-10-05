import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

async function main() {
    // 1. On vide les tables dans l'ordre inverse des dépendances.
    // Un OrderItem dépend d'une Order, une Order d'un User, etc.
    // Supprimer dans le mauvais ordre déclenche une erreur de clé étrangère.
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 2. Utilisateurs
    const admin = await prisma.user.create({
        data: {
            email: "admin@test.com",
            password: hashedPassword,
            name: "Admin FoodGo",
            address: "Antananarivo",
            role: "ADMIN",
        },
    });

    const owner = await prisma.user.create({
        data: {
            email: "restaurant@test.com",
            password: hashedPassword,
            name: "Rado Randria",
            address: "Analakely, Antananarivo",
            role: "RESTAURANT",
        },
    });

    const client = await prisma.user.create({
        data: {
            email: "client@test.com",
            password: hashedPassword,
            name: "Fara Soa",
            address: "Ambatobe, Antananarivo",
            paymentMethod: "MVOLA",
            role: "CLIENT",
        },
    });

    const driver = await prisma.user.create({
        data: {
            email: "driver@test.com",
            password: hashedPassword,
            name: "Tojo Andry",
            address: "Isotry, Antananarivo",
            role: "DRIVER",
        },
    });

    // 3. Restaurant + plats (prix en Ariary, donc des entiers)
    const restaurant = await prisma.restaurant.create({
        data: {
            ownerId: owner.id,
            name: "Chez Rado",
            address: "Analakely, Antananarivo",
            phone: "0321234567",
            isOpen: true, // sinon GET /restaurants ne le renvoie pas
            menuItems: {
                create: [
                    { name: "Poulet frites", price: 12000 },
                    { name: "Salade César", price: 9000 },
                    { name: "Pizza Margherita", price: 15000 },
                ],
            },
        },
        include: { menuItems: true },
    });

    const [poulet, salade] = restaurant.menuItems;

    // 4. Une commande de test
    await prisma.order.create({
        data: {
            clientId: client.id,
            restaurantId: restaurant.id,
            status: "PENDING",
            totalPrice: poulet.price * 1 + salade.price * 2,
            pickupAddress: restaurant.address,
            deliveryAddress: "Ambatobe, Antananarivo",
            paymentMethod: "MVOLA",
            items: {
                create: [
                    { menuItemId: poulet.id, quantity: 1, unitPrice: poulet.price },
                    { menuItemId: salade.id, quantity: 2, unitPrice: salade.price },
                ],
            },
        },
    });

    console.log("Seed terminé ✅");
    console.log({ admin: admin.email, driver: driver.email });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });