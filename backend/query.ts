import { prisma } from "./lib/prisma";

async function main() {
    // findMany returns all the restaurants in the database
    const findManyrestaurants = await prisma.restaurant.findMany({});

    // findFirst returns the first restaurant in the database
    const findFirstrestaurants = await prisma.restaurant.findFirst({
        where: { name: "Chez Rado" }, // where clause to filter by name
        include: { menuItems: true }, // include the menuItems relation in the result
    });

    // findUnique returns a unique restaurant in the database based on its @id or @unique field
    const findUniqueRestaurant = await prisma.restaurant.findUnique({
        where: { id: findFirstrestaurants?.id },  // where clause to filter by id
        include: { menuItems: true },             // include the menuItems relation in the result
    });

    const orders = await prisma.order.findMany({
        where: { status: "PENDING" },
        include: {
            items: {
                include: {
                    menuItem: true
                }
            },
            restaurant: true,
            client: true
        }
    })

    const affordableItems = await prisma.menuItem.findMany({
        where: { price: { gte: 10, lte: 12 } } // {gte: number, lte: number} means "greater than or equal to" and "less than or equal to"
    });

    const search = await prisma.restaurant.findMany({
        where: { name: { contains: "Chez", mode: "insensitive" } }, // contains means "contains the string" and mode: "insensitive" means "case insensitive"
    });

    const activeOrders = await prisma.order.findMany({
        where: { status: {in: ["CONFIRMED", "PREPARING", "READY"]}} // in means "in the array"
    })
    
    const client = await prisma.user.findFirst({
        where: { role: "CLIENT" },
        select: {   // select only the fields we want to return
            id: true,
            name: true,
            email: true,
            phone: true,
        }
    })

    const pendingOrders = await prisma.order.findMany({where: {status: "PENDING"}})
    if (!pendingOrders) {
        console.log("No pending orders found.");
    } else {
        console.log(`Found ${pendingOrders.length} pending orders.`);
    }

    const updatedOrder = await prisma.order.update({
        where: { id: pendingOrders[0].id },
        data: { status: "CONFIRMED" }
    })

    console.log("findManyrestaurants", findManyrestaurants);
    console.log("findFirstrestaurants", findFirstrestaurants);
    console.log("findUniqueRestaurant", findUniqueRestaurant);
    console.log("orders", orders);
    console.log("affordableItems", affordableItems);
    console.log("search", search)
    console.log("activeOrders", activeOrders)
    console.log("client", client)
    console.log("pendingOrders", pendingOrders)
    console.log("updatedOrder", updatedOrder)
}

main().finally(async () => {
    await prisma.$disconnect();
});