// server/src/index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();

// ✅ Production-Ready CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://recipehub-client-six.vercel.app',
  'https://recipehub-server-psi.vercel.app',
  process.env.CLIENT_URL
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie', 'Cookie']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// MongoDB Connection
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  console.error('❌ Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
  console.error(`Current URI: ${uri}`);
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');

const client = new MongoClient(uri);
let db;

async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db();
    console.log('✅ MongoDB connected successfully!');
    await createAdminUser();
    return client;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Please check your MONGODB_URI in .env file');
    console.log('💡 Make sure the password is URL encoded');
    process.exit(1);
  }
}

function getDB() {
  return db;
}

global.getDB = getDB;

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const recipeRoutes = require('./routes/recipe.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Create admin user
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

// Connect to MongoDB and start server
connectToMongoDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Closing MongoDB connection...');
  await client.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});