import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";


async function main() {
    const hashedPassword = await bcrypt.hash("password123", 10);

    const owner = await prisma.user.create({
        data: {
            email: "restaurant@test.com",
            password: hashedPassword,
            name: "Rado RANDRIA",
            role: "RESTAURANT"
        }
    })

    const restaurant = await prisma.restaurant.create({
        data: {
            ownerId: owner.id,
            name: "Chez Rado",
            address: "Analakely, Antananarivo",
            menuItems: {
                create: [
                    { name: "Poulet frites", price: 12.99 },
                    { name: "Salade César", price: 9.99 },
                    { name: "Pizza Margherita", price: 11.99 },
                ]
            }
        },
        include: { menuItems: true }
    })

    const client = await prisma.user.create({
        data: {
            email: "client@test.com",
            password: hashedPassword,
            name: "Fara SOA",
            role: "CLIENT"
        }
    })

    await prisma.user.create({
        data: {
            email: "driver@test.com",
            password: hashedPassword,
            name: "Tojo Andry",
            role: "DRIVER",
        },
    });

    const [poulet, romazava] = restaurant.menuItems;

    await prisma.order.create({
    data: {
      clientId: client.id,
      restaurantId: restaurant.id,
      status: "PENDING",
      totalPrice: poulet.price * 1 + romazava.price * 2,
      deliveryAddress: "Ambatobe, Antananarivo",
      items: {
        create: [
          { menuItemId: poulet.id, quantity: 1, unitPrice: poulet.price },
          { menuItemId: romazava.id, quantity: 2, unitPrice: romazava.price },
        ],
      },
    },
  });

  console.log("Seed terminé ✅");

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });