// server/src/seed.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    
    // Clear existing data (optional)
    console.log('🗑️ Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('recipes').deleteMany({});
    await db.collection('favorites').deleteMany({});
    await db.collection('reports').deleteMany({});
    await db.collection('payments').deleteMany({});
    console.log('✅ Old data cleared');

    // Hash password
    const hashedPassword = await bcrypt.hash('Password@123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);

    // Create Users
    console.log('👤 Creating users...');
    const users = [
      {
        _id: 1,
        name: 'Admin',
        email: 'admin@recipehub.com',
        password: adminPassword,
        image: 'https://ui-avatars.com/api/?name=Admin&background=random',
        role: 'admin',
        isBlocked: false,
        isPremium: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: 2,
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        image: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
        role: 'user',
        isBlocked: false,
        isPremium: false,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        _id: 3,
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        image: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
        role: 'user',
        isBlocked: false,
        isPremium: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        _id: 4,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: hashedPassword,
        image: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=random',
        role: 'user',
        isBlocked: false,
        isPremium: false,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15')
      },
      {
        _id: 5,
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        password: hashedPassword,
        image: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=random',
        role: 'user',
        isBlocked: false,
        isPremium: false,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      }
    ];

    await db.collection('users').insertMany(users);
    console.log(`✅ ${users.length} users created`);

    // Create Recipes (20+ Recipes)
    console.log('🍳 Creating recipes...');
    const recipes = [
      // Bangladeshi Recipes
      {
        _id: 1,
        recipeName: 'Chicken Biryani',
        recipeImage: 'https://images.unsplash.com/photo-1563379091-3fe6d62e2c8c?w=500',
        category: 'Dinner',
        cuisineType: 'Bangladeshi',
        difficultyLevel: 'Hard',
        preparationTime: 90,
        ingredients: ['Chicken 1kg', 'Basmati Rice 500g', 'Onion 2 large', 'Garlic 6 cloves', 'Ginger 2 inch', 'Biryani Masala', 'Yogurt 1 cup', 'Saffron', 'Ghee 4 tbsp'],
        instructions: 'Marinate chicken with yogurt and spices. Cook rice separately. Layer chicken and rice in a pot. Cook on low heat for 30 minutes. Garnish with fried onions and serve hot.',
        authorId: 2,
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        likesCount: 45,
        isFeatured: true,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        _id: 2,
        recipeName: 'Shorshe Ilish (Hilsa in Mustard Sauce)',
        recipeImage: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500',
        category: 'Lunch',
        cuisineType: 'Bangladeshi',
        difficultyLevel: 'Medium',
        preparationTime: 45,
        ingredients: ['Hilsa Fish 4 pieces', 'Mustard Seeds 3 tbsp', 'Green Chili 5', 'Turmeric Powder', 'Mustard Oil 4 tbsp', 'Salt to taste'],
        instructions: 'Grind mustard seeds with green chili. Heat mustard oil. Fry fish lightly. Add mustard paste and water. Cook for 10 minutes. Serve with steamed rice.',
        authorId: 3,
        authorName: 'Jane Smith',
        authorEmail: 'jane@example.com',
        likesCount: 38,
        isFeatured: true,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05')
      },
      {
        _id: 3,
        recipeName: 'Beef Curry (Gosht)',
        recipeImage: 'https://images.unsplash.com/photo-1604909052743-94c293edc3cb?w=500',
        category: 'Dinner',
        cuisineType: 'Bangladeshi',
        difficultyLevel: 'Medium',
        preparationTime: 75,
        ingredients: ['Beef 1kg', 'Onion 3 large', 'Garlic 8 cloves', 'Ginger 2 inch', 'Cumin Powder', 'Coriander Powder', 'Red Chili Powder', 'Bay Leaves 2'],
        instructions: 'Pressure cook beef with spices for 20 minutes. Sauté onions until golden. Add cooked beef and simmer for 15 minutes. Garnish with coriander leaves.',
        authorId: 4,
        authorName: 'Mike Johnson',
        authorEmail: 'mike@example.com',
        likesCount: 52,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20')
      },
      {
        _id: 4,
        recipeName: 'Panta Ilish (Fermented Rice with Hilsa)',
        recipeImage: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500',
        category: 'Breakfast',
        cuisineType: 'Bangladeshi',
        difficultyLevel: 'Easy',
        preparationTime: 15,
        ingredients: ['Fermented Rice 2 cups', 'Hilsa Fish 2 pieces', 'Onion 1', 'Green Chili', 'Mustard Oil', 'Salt'],
        instructions: 'Soak rice overnight. Mix with water and salt. Fry Hilsa with mustard oil. Serve rice with fried Hilsa, onions, and chili.',
        authorId: 5,
        authorName: 'Sarah Wilson',
        authorEmail: 'sarah@example.com',
        likesCount: 28,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05')
      },

      // Indian Recipes
      {
        _id: 5,
        recipeName: 'Butter Chicken',
        recipeImage: 'https://images.unsplash.com/photo-1604909052743-94c293edc3cb?w=500',
        category: 'Dinner',
        cuisineType: 'Indian',
        difficultyLevel: 'Medium',
        preparationTime: 60,
        ingredients: ['Chicken 800g', 'Butter 4 tbsp', 'Tomato Puree 2 cups', 'Heavy Cream 1 cup', 'Kasuri Methi', 'Ginger-Garlic Paste', 'Spices'],
        instructions: 'Marinate chicken with spices. Cook in butter until tender. Add tomato puree and cream. Simmer for 20 minutes. Garnish with coriander.',
        authorId: 2,
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        likesCount: 67,
        isFeatured: true,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25')
      },
      {
        _id: 6,
        recipeName: 'Chicken Tikka Masala',
        recipeImage: 'https://images.unsplash.com/photo-1565557623262-b5ba8fb5e8d4?w=500',
        category: 'Dinner',
        cuisineType: 'Indian',
        difficultyLevel: 'Medium',
        preparationTime: 55,
        ingredients: ['Chicken 800g', 'Yogurt 1 cup', 'Tomato Puree', 'Cream', 'Tikka Masala', 'Ginger', 'Garlic', 'Spices'],
        instructions: 'Marinate chicken in yogurt and spices. Grill until charred. Make gravy with tomato and cream. Add chicken and simmer.',
        authorId: 3,
        authorName: 'Jane Smith',
        authorEmail: 'jane@example.com',
        likesCount: 43,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10')
      },

      // Italian Recipes
      {
        _id: 7,
        recipeName: 'Pasta Carbonara',
        recipeImage: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500',
        category: 'Lunch',
        cuisineType: 'Italian',
        difficultyLevel: 'Easy',
        preparationTime: 30,
        ingredients: ['Spaghetti 400g', 'Eggs 4', 'Parmesan 100g', 'Pancetta 150g', 'Black Pepper', 'Salt'],
        instructions: 'Cook pasta al dente. Fry pancetta until crispy. Mix eggs and cheese. Combine everything quickly. Season with pepper.',
        authorId: 4,
        authorName: 'Mike Johnson',
        authorEmail: 'mike@example.com',
        likesCount: 55,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-25'),
        updatedAt: new Date('2024-02-25')
      },
      {
        _id: 8,
        recipeName: 'Margherita Pizza',
        recipeImage: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500',
        category: 'Dinner',
        cuisineType: 'Italian',
        difficultyLevel: 'Medium',
        preparationTime: 90,
        ingredients: ['Pizza Dough', 'Tomato Sauce', 'Mozzarella 200g', 'Basil', 'Olive Oil', 'Salt'],
        instructions: 'Roll out dough. Add tomato sauce and mozzarella. Bake at 450°F for 12-15 minutes. Garnish with basil.',
        authorId: 5,
        authorName: 'Sarah Wilson',
        authorEmail: 'sarah@example.com',
        likesCount: 72,
        isFeatured: true,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10')
      },
      {
        _id: 9,
        recipeName: 'Tiramisu',
        recipeImage: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
        category: 'Dessert',
        cuisineType: 'Italian',
        difficultyLevel: 'Medium',
        preparationTime: 45,
        ingredients: ['Ladyfingers', 'Mascarpone 500g', 'Eggs 4', 'Sugar 100g', 'Coffee', 'Cocoa Powder'],
        instructions: 'Make coffee and let cool. Mix mascarpone with egg yolks and sugar. Dip ladyfingers in coffee. Layer and refrigerate.',
        authorId: 2,
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        likesCount: 48,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-01-30'),
        updatedAt: new Date('2024-01-30')
      },

      // Chinese Recipes
      {
        _id: 10,
        recipeName: 'Chow Mein',
        recipeImage: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500',
        category: 'Lunch',
        cuisineType: 'Chinese',
        difficultyLevel: 'Easy',
        preparationTime: 25,
        ingredients: ['Noodles 400g', 'Chicken 200g', 'Carrot', 'Cabbage', 'Soy Sauce', 'Oyster Sauce', 'Ginger', 'Garlic'],
        instructions: 'Boil noodles. Stir-fry chicken and vegetables. Add noodles and sauces. Toss well and serve hot.',
        authorId: 3,
        authorName: 'Jane Smith',
        authorEmail: 'jane@example.com',
        likesCount: 34,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-12'),
        updatedAt: new Date('2024-02-12')
      },
      {
        _id: 11,
        recipeName: 'Kung Pao Chicken',
        recipeImage: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500',
        category: 'Dinner',
        cuisineType: 'Chinese',
        difficultyLevel: 'Medium',
        preparationTime: 35,
        ingredients: ['Chicken 500g', 'Peanuts', 'Chili Peppers', 'Soy Sauce', 'Vinegar', 'Sugar', 'Cornstarch'],
        instructions: 'Marinate chicken. Stir-fry with peanuts and chili. Add sauce and thicken. Serve with rice.',
        authorId: 4,
        authorName: 'Mike Johnson',
        authorEmail: 'mike@example.com',
        likesCount: 41,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-02-28')
      },

      // Mexican Recipes
      {
        _id: 12,
        recipeName: 'Chicken Enchiladas',
        recipeImage: 'https://images.unsplash.com/photo-1534352956036-cd81b27dd615?w=500',
        category: 'Dinner',
        cuisineType: 'Mexican',
        difficultyLevel: 'Medium',
        preparationTime: 60,
        ingredients: ['Tortillas 8', 'Chicken 500g', 'Cheese 200g', 'Enchilada Sauce', 'Onion', 'Garlic', 'Cumin'],
        instructions: 'Shred cooked chicken. Roll in tortillas with cheese. Top with sauce and more cheese. Bake until bubbly.',
        authorId: 5,
        authorName: 'Sarah Wilson',
        authorEmail: 'sarah@example.com',
        likesCount: 39,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15')
      },
      {
        _id: 13,
        recipeName: 'Guacamole',
        recipeImage: 'https://images.unsplash.com/photo-1598866342105-1bc44cd2b8da?w=500',
        category: 'Snack',
        cuisineType: 'Mexican',
        difficultyLevel: 'Easy',
        preparationTime: 10,
        ingredients: ['Avocado 3', 'Tomato 1', 'Onion 1/2', 'Lime Juice', 'Cilantro', 'Salt', 'Garlic'],
        instructions: 'Mash avocados. Mix with chopped vegetables. Add lime juice and seasonings. Serve with tortilla chips.',
        authorId: 2,
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        likesCount: 56,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-02'),
        updatedAt: new Date('2024-02-02')
      },

      // Thai Recipes
      {
        _id: 14,
        recipeName: 'Pad Thai',
        recipeImage: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500',
        category: 'Lunch',
        cuisineType: 'Thai',
        difficultyLevel: 'Medium',
        preparationTime: 35,
        ingredients: ['Rice Noodles 400g', 'Shrimp 200g', 'Eggs 2', 'Tofu', 'Bean Sprouts', 'Peanuts', 'Tamarind Sauce'],
        instructions: 'Soak noodles. Stir-fry shrimp, tofu, and eggs. Add noodles and sauce. Toss with bean sprouts and peanuts.',
        authorId: 3,
        authorName: 'Jane Smith',
        authorEmail: 'jane@example.com',
        likesCount: 47,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-18'),
        updatedAt: new Date('2024-02-18')
      },
      {
        _id: 15,
        recipeName: 'Thai Green Curry',
        recipeImage: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500',
        category: 'Dinner',
        cuisineType: 'Thai',
        difficultyLevel: 'Medium',
        preparationTime: 40,
        ingredients: ['Chicken 500g', 'Green Curry Paste', 'Coconut Milk 400ml', 'Vegetables', 'Fish Sauce', 'Sugar'],
        instructions: 'Fry curry paste. Add chicken and coconut milk. Add vegetables and simmer. Serve with rice.',
        authorId: 4,
        authorName: 'Mike Johnson',
        authorEmail: 'mike@example.com',
        likesCount: 33,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-02'),
        updatedAt: new Date('2024-03-02')
      },

      // Dessert Recipes
      {
        _id: 16,
        recipeName: 'Chocolate Cake',
        recipeImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500',
        category: 'Dessert',
        cuisineType: 'American',
        difficultyLevel: 'Medium',
        preparationTime: 60,
        ingredients: ['Flour 2 cups', 'Sugar 2 cups', 'Cocoa 3/4 cup', 'Eggs 3', 'Butter 1 cup', 'Milk 1 cup', 'Baking Powder'],
        instructions: 'Mix dry ingredients. Cream butter and sugar. Add eggs and milk. Bake at 350°F for 35 minutes. Frost with chocolate ganache.',
        authorId: 5,
        authorName: 'Sarah Wilson',
        authorEmail: 'sarah@example.com',
        likesCount: 82,
        isFeatured: true,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-03-20')
      },
      {
        _id: 17,
        recipeName: 'Cheesecake',
        recipeImage: 'https://images.unsplash.com/photo-1524351199670-6f4fe5de4194?w=500',
        category: 'Dessert',
        cuisineType: 'American',
        difficultyLevel: 'Hard',
        preparationTime: 120,
        ingredients: ['Cream Cheese 800g', 'Sugar 1 cup', 'Eggs 4', 'Sour Cream', 'Vanilla', 'Graham Cracker Crust'],
        instructions: 'Make crust. Beat cream cheese and sugar. Add eggs one by one. Bake in water bath. Chill for 4 hours.',
        authorId: 2,
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        likesCount: 61,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-08'),
        updatedAt: new Date('2024-02-08')
      },

      // American Recipes
      {
        _id: 18,
        recipeName: 'BBQ Ribs',
        recipeImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
        category: 'Dinner',
        cuisineType: 'American',
        difficultyLevel: 'Hard',
        preparationTime: 180,
        ingredients: ['Pork Ribs 2kg', 'BBQ Sauce', 'Brown Sugar', 'Paprika', 'Garlic Powder', 'Onion Powder', 'Salt', 'Pepper'],
        instructions: 'Rub ribs with spices. Slow cook at 250°F for 3 hours. Baste with BBQ sauce. Finish on grill for char.',
        authorId: 4,
        authorName: 'Mike Johnson',
        authorEmail: 'mike@example.com',
        likesCount: 44,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-08'),
        updatedAt: new Date('2024-03-08')
      },
      {
        _id: 19,
        recipeName: 'Classic Burger',
        recipeImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        category: 'Lunch',
        cuisineType: 'American',
        difficultyLevel: 'Easy',
        preparationTime: 25,
        ingredients: ['Ground Beef 500g', 'Burger Buns 4', 'Cheese 4 slices', 'Lettuce', 'Tomato', 'Onion', 'Pickles', 'Ketchup', 'Mustard'],
        instructions: 'Form beef into patties. Season with salt and pepper. Grill to desired doneness. Assemble with toppings.',
        authorId: 3,
        authorName: 'Jane Smith',
        authorEmail: 'jane@example.com',
        likesCount: 58,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-02-22'),
        updatedAt: new Date('2024-02-22')
      },
      {
        _id: 20,
        recipeName: 'Chicken Wings',
        recipeImage: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500',
        category: 'Snack',
        cuisineType: 'American',
        difficultyLevel: 'Easy',
        preparationTime: 45,
        ingredients: ['Chicken Wings 1kg', 'Buffalo Sauce', 'Butter', 'Garlic Powder', 'Paprika', 'Salt', 'Pepper'],
        instructions: 'Season wings and bake at 400°F for 40 minutes. Toss in buffalo sauce. Serve with ranch dressing.',
        authorId: 5,
        authorName: 'Sarah Wilson',
        authorEmail: 'sarah@example.com',
        likesCount: 69,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-25'),
        updatedAt: new Date('2024-03-25')
      },
      {
        _id: 21,
        recipeName: 'Mac and Cheese',
        recipeImage: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=500',
        category: 'Lunch',
        cuisineType: 'American',
        difficultyLevel: 'Easy',
        preparationTime: 35,
        ingredients: ['Macaroni 400g', 'Cheddar Cheese 300g', 'Milk 2 cups', 'Butter 4 tbsp', 'Flour 1/4 cup', 'Salt', 'Pepper'],
        instructions: 'Cook macaroni. Make cheese sauce with butter, flour, milk, and cheese. Combine and bake until golden.',
        authorId: 2,
        authorName: 'John Doe',
        authorEmail: 'john@example.com',
        likesCount: 51,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18')
      },
      {
        _id: 22,
        recipeName: 'Caesar Salad',
        recipeImage: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500',
        category: 'Lunch',
        cuisineType: 'American',
        difficultyLevel: 'Easy',
        preparationTime: 20,
        ingredients: ['Romaine Lettuce', 'Parmesan Cheese', 'Croutons', 'Chicken Breast', 'Caesar Dressing', 'Lemon Juice'],
        instructions: 'Chop lettuce and grill chicken. Toss with dressing, cheese, and croutons. Serve immediately.',
        authorId: 4,
        authorName: 'Mike Johnson',
        authorEmail: 'mike@example.com',
        likesCount: 37,
        isFeatured: false,
        status: 'active',
        isPremiumOnly: false,
        createdAt: new Date('2024-03-12'),
        updatedAt: new Date('2024-03-12')
      }
    ];

    await db.collection('recipes').insertMany(recipes);
    console.log(`✅ ${recipes.length} recipes created`);

    // Create Favorites
    console.log('❤️ Creating favorites...');
    const favorites = [
      { userId: 2, userEmail: 'john@example.com', recipeId: 2, addedAt: new Date('2024-02-06') },
      { userId: 2, userEmail: 'john@example.com', recipeId: 5, addedAt: new Date('2024-01-26') },
      { userId: 2, userEmail: 'john@example.com', recipeId: 8, addedAt: new Date('2024-03-11') },
      { userId: 3, userEmail: 'jane@example.com', recipeId: 1, addedAt: new Date('2024-01-21') },
      { userId: 3, userEmail: 'jane@example.com', recipeId: 7, addedAt: new Date('2024-02-26') },
      { userId: 3, userEmail: 'jane@example.com', recipeId: 16, addedAt: new Date('2024-03-21') },
      { userId: 4, userEmail: 'mike@example.com', recipeId: 4, addedAt: new Date('2024-03-06') },
      { userId: 4, userEmail: 'mike@example.com', recipeId: 13, addedAt: new Date('2024-02-03') },
      { userId: 5, userEmail: 'sarah@example.com', recipeId: 6, addedAt: new Date('2024-02-11') },
      { userId: 5, userEmail: 'sarah@example.com', recipeId: 14, addedAt: new Date('2024-02-19') },
      { userId: 5, userEmail: 'sarah@example.com', recipeId: 20, addedAt: new Date('2024-03-26') }
    ];

    await db.collection('favorites').insertMany(favorites);
    console.log(`✅ ${favorites.length} favorites created`);

    // Create Reports
    console.log('📋 Creating reports...');
    const reports = [
      {
        recipeId: 4,
        reporterEmail: 'john@example.com',
        reporterId: 2,
        reason: 'Spam',
        description: 'This recipe seems suspicious and contains wrong information.',
        status: 'pending',
        createdAt: new Date('2024-03-06')
      },
      {
        recipeId: 11,
        reporterEmail: 'jane@example.com',
        reporterId: 3,
        reason: 'Offensive Content',
        description: 'The recipe contains inappropriate language.',
        status: 'pending',
        createdAt: new Date('2024-03-01')
      },
      {
        recipeId: 18,
        reporterEmail: 'mike@example.com',
        reporterId: 4,
        reason: 'Copyright Issue',
        description: 'This recipe appears to be copied from another source.',
        status: 'pending',
        createdAt: new Date('2024-03-09')
      }
    ];

    await db.collection('reports').insertMany(reports);
    console.log(`✅ ${reports.length} reports created`);

    // Create Payments
    console.log('💳 Creating payments...');
    const payments = [
      {
        userId: 3,
        userEmail: 'jane@example.com',
        amount: 9.99,
        recipeId: null,
        transactionId: 'txn_premium_001',
        paymentStatus: 'success',
        paymentType: 'premium_membership',
        paidAt: new Date('2024-02-01'),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        userId: 2,
        userEmail: 'john@example.com',
        amount: 4.99,
        recipeId: 8,
        transactionId: 'txn_recipe_008',
        paymentStatus: 'success',
        paymentType: 'recipe_purchase',
        paidAt: new Date('2024-03-11'),
        createdAt: new Date('2024-03-11'),
        updatedAt: new Date('2024-03-11')
      },
      {
        userId: 4,
        userEmail: 'mike@example.com',
        amount: 9.99,
        recipeId: null,
        transactionId: 'txn_premium_002',
        paymentStatus: 'success',
        paymentType: 'premium_membership',
        paidAt: new Date('2024-03-15'),
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15')
      },
      {
        userId: 5,
        userEmail: 'sarah@example.com',
        amount: 4.99,
        recipeId: 16,
        transactionId: 'txn_recipe_016',
        paymentStatus: 'success',
        paymentType: 'recipe_purchase',
        paidAt: new Date('2024-03-21'),
        createdAt: new Date('2024-03-21'),
        updatedAt: new Date('2024-03-21')
      }
    ];

    await db.collection('payments').insertMany(payments);
    console.log(`✅ ${payments.length} payments created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   👤 Users: ${users.length}`);
    console.log(`   🍳 Recipes: ${recipes.length}`);
    console.log(`   ❤️ Favorites: ${favorites.length}`);
    console.log(`   📋 Reports: ${reports.length}`);
    console.log(`   💳 Payments: ${payments.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log(`   Admin: admin@recipehub.com / Admin@123`);
    console.log(`   User: john@example.com / Password@123`);
    console.log(`   User: jane@example.com / Password@123`);
    console.log(`   User: mike@example.com / Password@123`);
    console.log(`   User: sarah@example.com / Password@123`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('🔒 MongoDB connection closed');
  }
}

// Run the seed function
seedDatabase();