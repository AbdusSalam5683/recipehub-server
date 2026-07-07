const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

const { setDB: setActivityDB } = require('./models/Activity.model');
const { setDB: setUserDB } = require('./models/User.model');
const { setDB: setRecipeDB } = require('./models/Recipe.model');
const { setDB: setReportDB } = require('./models/Report.model');
const { setDB: setFavoriteDB } = require('./models/Favorite.model');
const { setDB: setPaymentDB } = require('./models/Payment.model');

dotenv.config();

const app = express();

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://recipehub-client-six.vercel.app',
  'https://recipehub-server-psi.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie', 'Cookie']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// ✅ IMPORTANT: Webhook route must be registered BEFORE express.json()
// Import payment routes
const paymentRoutes = require('./routes/payment.routes');
app.use('/api/payment', paymentRoutes);

// ✅ Then apply express.json() for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// Root Routes
// ============================================

app.get('/', (req, res) => {
  res.json({
    name: 'RecipeHub API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      recipes: '/api/recipes',
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      payment: '/api/payment',
      activities: '/api/activities',
      reports: '/api/reports'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'RecipeHub API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      recipes: '/api/recipes',
      auth: '/api/auth/login',
      auth_register: '/api/auth/register',
      users: '/api/users/profile',
      admin: '/api/admin/overview',
      payment: '/api/payment/create-premium-checkout',
      activities: '/api/activities',
      reports: '/api/reports'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB'
  });
});

// ============================================
// MongoDB Connection
// ============================================

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  console.error('❌ Invalid MONGODB_URI format');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');

const client = new MongoClient(uri);
let db;

async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db();
    
    setActivityDB(db);
    setUserDB(db);
    setRecipeDB(db);
    setReportDB(db);
    setFavoriteDB(db);
    setPaymentDB(db);
    
    console.log('✅ MongoDB connected successfully!');
    await createAdminUser();
    return client;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

client.on('error', async (err) => {
  console.error('❌ MongoDB error:', err);
  console.log('🔄 Attempting to reconnect...');
  setTimeout(async () => {
    try {
      await client.connect();
      db = client.db();
      console.log('✅ MongoDB reconnected successfully!');
    } catch (e) {
      console.error('❌ Failed to reconnect:', e);
    }
  }, 5000);
});

function getDB() {
  return db;
}

global.getDB = getDB;

// ============================================
// Routes
// ============================================

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const recipeRoutes = require('./routes/recipe.routes');
const adminRoutes = require('./routes/admin.routes');
const activityRoutes = require('./routes/activity.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activities', activityRoutes);

// ============================================
// Error Handlers
// ============================================

app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// Create Admin User
// ============================================

async function createAdminUser() {
  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@recipehub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await usersCollection.insertOne({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        image: 'https://ui-avatars.com/api/?name=Admin&background=random',
        role: 'admin',
        isBlocked: false,
        isPremium: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Admin user created successfully');
      console.log(`📧 Admin Email: ${adminEmail}`);
      console.log(`🔑 Admin Password: ${adminPassword}`);
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// ============================================
// Start Server
// ============================================

connectToMongoDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
  });
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Closing MongoDB connection...');
  await client.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});