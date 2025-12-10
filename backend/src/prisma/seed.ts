import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create restaurant owners
  const passwordHash = await bcrypt.hash('password123', 10);

  const owner1 = await prisma.user.upsert({
    where: { email: 'pizza.palace@owner.com' },
    update: {},
    create: {
      email: 'pizza.palace@owner.com',
      password: passwordHash,
      name: 'Mario Rossi',
      role: 'restaurant_owner',
      phone: '12345670',
    },
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'sushi.master@owner.com' },
    update: {},
    create: {
      email: 'sushi.master@owner.com',
      password: passwordHash,
      name: 'Yuki Tanaka',
      role: 'restaurant_owner',
      phone: '12345671',
    },
  });

  const owner3 = await prisma.user.upsert({
    where: { email: 'taco.ville@owner.com' },
    update: {},
    create: {
      email: 'taco.ville@owner.com',
      password: passwordHash,
      name: 'Carlos Rodriguez',
      role: 'restaurant_owner',
      phone: '12345672',
    },
  });

  const owner4 = await prisma.user.upsert({
    where: { email: 'burger.blast@owner.com' },
    update: {},
    create: {
      email: 'burger.blast@owner.com',
      password: passwordHash,
      name: 'John Smith',
      role: 'restaurant_owner',
      phone: '12345673',
    },
  });

  const owner5 = await prisma.user.upsert({
    where: { email: 'curry.house@owner.com' },
    update: {},
    create: {
      email: 'curry.house@owner.com',
      password: passwordHash,
      name: 'Priya Sharma',
      role: 'restaurant_owner',
      phone: '12345674',
    },
  });

  const owner6 = await prisma.user.upsert({
    where: { email: 'dragon.wok@owner.com' },
    update: {},
    create: {
      email: 'dragon.wok@owner.com',
      password: passwordHash,
      name: 'Li Wei',
      role: 'restaurant_owner',
      phone: '12345675',
    },
  });

  console.log('✅ Created restaurant owners');

  // Delete existing restaurants and related data
  await prisma.menuItem.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.restaurant.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.order.deleteMany({});

  // Create restaurants
  const restaurants = await Promise.all([
    prisma.restaurant.upsert({
      where: { name: 'Pizza Palace' },
      update: {},
      create: {
        name: 'Pizza Palace',
        description: 'Authentic Italian pizza with fresh ingredients and traditional recipes passed down for generations',
        cuisine: 'Italian',
        rating: 4.5,
        totalReviews: 234,
        priceRange: 'medium',
        address: '123 Main Street, Tsim Sha Tsui, Kowloon',
        phone: '12345671',
        email: 'info@pizzapalace.com',
        ownerId: owner1.id,
        isActive: true,
        isOpen: true,
        deliveryFee: 35,
        minOrderAmount: 15.0,
        estimatedDeliveryTime: 30,
      },
    }),

    prisma.restaurant.upsert({
      where: { name: 'Sushi Master' },
      update: {},
      create: {
        name: 'Sushi Master',
        description: 'Fresh sushi and Japanese cuisine prepared by expert chefs with the finest ingredients',
        cuisine: 'Japanese',
        rating: 4.8,
        totalReviews: 189,
        priceRange: 'premium',
        address: '456 Oak Avenue, North Point, Hong Kong',
        phone: '12345672',
        email: 'order@sushimaster.com',
        ownerId: owner2.id,
        isActive: true,
        isOpen: true,
        deliveryFee: 35,
        minOrderAmount: 25.0,
        estimatedDeliveryTime: 40,
      },
    }),

    prisma.restaurant.upsert({
      where: { name: 'Taco Ville' },
      update: {},
      create: {
        name: 'Taco Ville',
        description: 'Authentic Mexican tacos, burritos, and more with traditional flavors and fresh ingredients',
        cuisine: 'Mexican',
        rating: 4.3,
        totalReviews: 156,
        priceRange: 'budget',
        address: '789 Elm Street, Sham Shui Po, Kowloon',
        phone: '12345672',
        email: 'hello@tacoville.com',
        ownerId: owner3.id,
        isActive: true,
        isOpen: true,
        deliveryFee: 40,
        minOrderAmount: 10.0,
        estimatedDeliveryTime: 25,
      },
    }),

    prisma.restaurant.upsert({
      where: { name: 'Burger Blast' },
      update: {},
      create: {
        name: 'Burger Blast',
        description: 'Juicy burgers made with 100% beef, fresh vegetables, and our signature sauces',
        cuisine: 'American',
        rating: 4.2,
        totalReviews: 298,
        priceRange: 'budget',
        address: '321 Pine Road, Yuen Long, New Territories',
        phone: '12345673',
        email: 'contact@burgerblast.com',
        ownerId: owner4.id,
        isActive: true,
        isOpen: true,
        deliveryFee: 38,
        minOrderAmount: 12.0,
        estimatedDeliveryTime: 20,
      },
    }),

    prisma.restaurant.upsert({
      where: { name: 'Curry House' },
      update: {},
      create: {
        name: 'Curry House',
        description: 'Authentic Indian curry and traditional dishes with aromatic spices and flavors',
        cuisine: 'Indian',
        rating: 4.6,
        totalReviews: 167,
        priceRange: 'medium',
        address: '654 Maple Drive, Causeway Bay, Hong Kong',
        phone: '12345674',
        email: 'orders@curryhouse.com',
        ownerId: owner5.id,
        isActive: true,
        isOpen: true,
        deliveryFee: 37,
        minOrderAmount: 18.0,
        estimatedDeliveryTime: 35,
      },
    }),

    prisma.restaurant.upsert({
      where: { name: 'Dragon Wok' },
      update: {},
      create: {
        name: 'Dragon Wok',
        description: 'Delicious Chinese cuisine with fresh ingredients and traditional cooking techniques',
        cuisine: 'Chinese',
        rating: 4.4,
        totalReviews: 203,
        priceRange: 'budget',
        address: '987 Cedar Lane, Mong Kok, Kowloon',
        phone: '12345675',
        email: 'info@dragonwok.com',
        ownerId: owner6.id,
        isActive: true,
        isOpen: true,
        deliveryFee: 36,
        minOrderAmount: 15.0,
        estimatedDeliveryTime: 30,
      },
    }),
  ]);

  console.log('✅ Created restaurants');

  // Create operating hours for each restaurant
  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday, 6 = Saturday
  for (const restaurant of restaurants) {
    for (const dayOfWeek of daysOfWeek) {
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isClosed = false; // All restaurants open every day

      await prisma.operatingHours.upsert({
        where: {
          restaurantId_dayOfWeek: {
            restaurantId: restaurant.id,
            dayOfWeek,
          },
        },
        update: {},
        create: {
          restaurantId: restaurant.id,
          dayOfWeek,
          openTime: isWeekend ? '10:00' : '09:00',
          closeTime: isWeekend ? '22:00' : '21:00',
          isClosed,
        },
      });
    }
  }

  console.log('✅ Created operating hours');

  // Create menu categories and items for each restaurant
  const menuData = [
    {
      restaurantId: 'Pizza Palace', // Pizza Palace
      categories: [
        {
          name: 'Pizzas',
          description: 'Our signature pizzas',
          order: 1,
          items: [
            {
              name: 'Margherita Pizza',
              description: 'Fresh mozzarella, tomato sauce, and basil',
              price: 79,
              preparationTime: 15,
            },
            {
              name: 'Pepperoni Pizza',
              description: 'Classic pepperoni with mozzarella cheese',
              price: 89,
              preparationTime: 15,
            },
            {
              name: 'Supreme Pizza',
              description: 'Pepperoni, sausage, peppers, onions, and mushrooms',
              price: 119,
              preparationTime: 20,
            },
            {
              name: 'Hawaiian Pizza',
              description: 'Ham and pineapple with mozzarella cheese',
              price: 99,
              preparationTime: 15,
            },
          ],
        },
        {
          name: 'Appetizers',
          description: 'Start your meal right',
          order: 2,
          items: [
            {
              name: 'Garlic Bread',
              description: 'Toasted bread with garlic butter and herbs',
              price: 19,
              preparationTime: 10,
            },
            {
              name: 'Mozzarella Sticks',
              description: 'Crispy fried mozzarella with marinara sauce',
              price: 29,
              preparationTime: 12,
            },
          ],
        },
        {
          name: 'Beverages',
          description: 'Refreshing drinks',
          order: 3,
          items: [
            {
              name: 'Coca Cola',
              description: 'Classic Coke',
              price: 12,
              preparationTime: 1,
            },
            {
              name: 'Fresh Lemonade',
              description: 'Homemade lemonade',
              price: 12,
              preparationTime: 3,
            },
          ],
        },
      ],
    },
    {
      restaurantId: 'Sushi Master', // Sushi Master
      categories: [
        {
          name: 'Sushi Rolls',
          description: 'Fresh sushi rolls',
          order: 1,
          items: [
            {
              name: 'California Roll',
              description: 'Crab, avocado, and cucumber',
              price: 39,
              preparationTime: 10,
            },
            {
              name: 'Salmon Roll',
              description: 'Fresh salmon and rice',
              price: 49,
              preparationTime: 10,
            },
            {
              name: 'Dragon Roll',
              description: 'Shrimp tempura with eel and avocado',
              price: 59,
              preparationTime: 15,
            },
          ],
        },
        {
          name: 'Sashimi',
          description: 'Fresh sliced fish',
          order: 2,
          items: [
            {
              name: 'Salmon Sashimi',
              description: '6 pieces of fresh salmon',
              price: 39,
              preparationTime: 8,
            },
            {
              name: 'Tuna Sashimi',
              description: '6 pieces of fresh tuna',
              price: 49,
              preparationTime: 8,
            },
          ],
        },
      ],
    },
    {
      restaurantId: 'Taco Ville', // Taco Ville
      categories: [
        {
          name: 'Tacos',
          description: 'Authentic Mexican tacos',
          order: 1,
          items: [
            {
              name: 'Carne Asada Taco',
              description: 'Grilled steak with onions and cilantro',
              price: 39,
              preparationTime: 8,
            },
            {
              name: 'Chicken Taco',
              description: 'Grilled chicken with salsa',
              price: 29,
              preparationTime: 8,
            },
            {
              name: 'Fish Taco',
              description: 'Battered fish with cabbage slaw',
              price: 39,
              preparationTime: 10,
            },
          ],
        },
        {
          name: 'Burritos',
          description: ' hearty burritos',
          order: 2,
          items: [
            {
              name: 'Beef Burrito',
              description: 'Ground beef, rice, beans, and cheese',
              price: 49,
              preparationTime: 12,
            },
            {
              name: 'Chicken Burrito',
              description: 'Grilled chicken, rice, and beans',
              price: 49,
              preparationTime: 12,
            },
          ],
        },
      ],
    },
    {
      restaurantId: 'Burger Blast', // Burger Blast
      categories: [
        {
          name: 'Burgers',
          description: 'Juicy beef burgers',
          order: 1,
          items: [
            {
              name: 'Classic Burger',
              description: 'Beef patty with lettuce, tomato, and onion',
              price: 49,
              preparationTime: 12,
            },
            {
              name: 'Cheeseburger',
              description: 'Beef patty with cheddar cheese',
              price: 49,
              preparationTime: 12,
            },
            {
              name: 'Bacon Burger',
              description: 'Beef patty with crispy bacon',
              price: 49,
              preparationTime: 15,
            },
          ],
        },
        {
          name: 'Sides',
          description: 'Delicious sides',
          order: 2,
          items: [
            {
              name: 'French Fries',
              description: 'Crispy golden fries',
              price: 29,
              preparationTime: 8,
            },
            {
              name: 'Onion Rings',
              description: 'Beer-battered onion rings',
              price: 29,
              preparationTime: 10,
            },
          ],
        },
      ],
    },
    {
      restaurantId: 'Curry House', // Curry House
      categories: [
        {
          name: 'Curries',
          description: 'Authentic Indian curries',
          order: 1,
          items: [
            {
              name: 'Butter Chicken',
              description: 'Creamy tomato-based curry with tender chicken',
              price: 59,
              preparationTime: 18,
            },
            {
              name: 'Lamb Vindaloo',
              description: 'Spicy lamb curry with potatoes',
              price: 69,
              preparationTime: 20,
            },
            {
              name: 'Paneer Tikka Masala',
              description: 'Cottage cheese in creamy tomato gravy',
              price: 59,
              preparationTime: 15,
            },
          ],
        },
        {
          name: 'Rice & Biryani',
          description: 'Rice dishes',
          order: 2,
          items: [
            {
              name: 'Chicken Biryani',
              description: 'Fragrant rice with spiced chicken',
              price: 59,
              preparationTime: 25,
            },
            {
              name: 'Basmati Rice',
              description: 'Plain basmati rice',
              price: 59,
              preparationTime: 5,
            },
          ],
        },
      ],
    },
    {
      restaurantId: 'Dragon Wok', // Dragon Wok
      categories: [
        {
          name: 'Noodles',
          description: 'Fresh noodles',
          order: 1,
          items: [
            {
              name: 'Lo Mein',
              description: 'Stir-fried noodles with vegetables',
              price: 49,
              preparationTime: 12,
            },
            {
              name: 'Chow Fun',
              description: 'Rice noodles with bean sprouts',
              price: 59,
              preparationTime: 12,
            },
          ],
        },
        {
          name: 'Fried Rice',
          description: 'Wok-fried rice dishes',
          order: 2,
          items: [
            {
              name: 'Chicken Fried Rice',
              description: 'Wok-fried rice with chicken and eggs',
              price: 59,
              preparationTime: 10,
            },
            {
              name: 'Vegetable Fried Rice',
              description: 'Wok-fried rice with mixed vegetables',
              price: 49,
              preparationTime: 10,
            },
          ],
        },
      ],
    },
  ];

  for (const restaurantData of menuData) {
    // Get the restaurant by name
    const restaurant = await prisma.restaurant.findUnique({
      where: { name: restaurantData.restaurantId },
    });

    if (!restaurant) {
      console.error(`Restaurant not found: ${restaurantData.restaurantId}`);
      continue;
    }

    for (const categoryData of restaurantData.categories) {
      // Try to find existing category, if not found create it
      let category = await prisma.menuCategory.findFirst({
        where: {
          restaurantId: restaurant.id,
          name: categoryData.name,
        },
      });

      if (!category) {
        category = await prisma.menuCategory.create({
          data: {
            restaurantId: restaurant.id,
            name: categoryData.name,
            description: categoryData.description,
            order: categoryData.order,
          },
        });
      }

      for (const itemData of categoryData.items) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            preparationTime: itemData.preparationTime,
            isAvailable: true,
          },
        });
      }
    }
  }

  console.log('✅ Created menu categories and items');

  // Create some sample customers
  const customer1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'John Doe',
      role: 'customer',
      phone: '12345680',
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Jane Smith',
      role: 'customer',
      phone: '12345681',
    },
  });

  console.log('✅ Created sample customers');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Restaurants: ${await prisma.restaurant.count()}`);
  console.log(`- Menu Categories: ${await prisma.menuCategory.count()}`);
  console.log(`- Menu Items: ${await prisma.menuItem.count()}`);
  console.log(`- Operating Hours: ${await prisma.operatingHours.count()}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
