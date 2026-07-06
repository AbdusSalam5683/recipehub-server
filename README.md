# 🍳 RecipeHub - Server Side

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)

RESTful API backend for RecipeHub - A modern recipe sharing platform.

## 🌐 Live API

**Base URL:** [https://recipehub-server-psi.vercel.app/api](https://recipehub-server-psi.vercel.app/api)

**Health Check:** [https://recipehub-server-psi.vercel.app/api/health](https://recipehub-server-psi.vercel.app/api/health)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Database Architecture](#-database-architecture)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Authentication](#-authentication)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🚀 Features

### 🔐 Authentication & Authorization
- User Registration (Email/Password)
- User Login (Email/Password)
- Google OAuth Login
- JWT Token Generation
- HTTP-Only Cookie Storage
- Token Verification Middleware
- Role-based Authorization (Admin/User)

### 👤 User Management
| Feature | Endpoint | Description |
|---------|----------|-------------|
| Get Profile | `GET /api/users/profile` | Get current user profile |
| Update Profile | `PUT /api/users/profile` | Update user profile |
| Get Stats | `GET /api/users/stats` | Get user statistics |
| Get Favorites | `GET /api/users/favorites` | Get favorite recipes |
| Toggle Favorite | `POST /api/users/favorites/:id` | Add/Remove favorite |
| Check Favorite | `GET /api/users/favorites/check/:id` | Check favorite status |

### 🍽️ Recipe Management
| Feature | Endpoint | Description |
|---------|----------|-------------|
| All Recipes | `GET /api/recipes` | Get all recipes (paginated) |
| Featured | `GET /api/recipes/featured` | Get featured recipes |
| Popular | `GET /api/recipes/popular` | Get popular recipes |
| Recipe Details | `GET /api/recipes/:id` | Get single recipe |
| Create Recipe | `POST /api/recipes` | Create new recipe |
| Update Recipe | `PUT /api/recipes/:id` | Update recipe |
| Delete Recipe | `DELETE /api/recipes/:id` | Delete recipe |
| Like Recipe | `POST /api/recipes/:id/like` | Like/Unlike recipe |
| Report Recipe | `POST /api/recipes/:id/report` | Report recipe |
| My Recipes | `GET /api/recipes/my-recipes` | Get user's recipes |

### 👑 Admin Management
| Feature | Endpoint | Description |
|---------|----------|-------------|
| Overview | `GET /api/admin/overview` | Dashboard statistics |
| Users | `GET /api/admin/users` | Get all users |
| Block User | `PUT /api/admin/users/:id/block` | Block/Unblock user |
| Change Role | `PUT /api/admin/users/:id/role` | Change user role |
| Delete User | `DELETE /api/admin/users/:id` | Delete user |
| All Recipes | `GET /api/admin/recipes` | Get all recipes |
| Feature Recipe | `PUT /api/admin/recipes/:id/feature` | Feature/Unfeature |
| Reports | `GET /api/admin/reports` | Get all reports |
| Handle Report | `PUT /api/admin/reports/:id` | Remove/Dismiss |

### 💳 Payment System
| Feature | Endpoint | Description |
|---------|----------|-------------|
| Premium Checkout | `POST /api/payment/create-premium-checkout` | Create premium checkout |
| Recipe Checkout | `POST /api/payment/create-recipe-checkout` | Create recipe purchase |
| Verify Payment | `GET /api/payment/verify` | Verify payment status |
| Purchased Recipes | `GET /api/payment/purchased` | Get purchased recipes |
| Webhook | `POST /api/payment/webhook` | Stripe webhook handler |

### 📊 Activity Log
| Feature | Endpoint | Description |
|---------|----------|-------------|
| All Activities | `GET /api/activities` | Get all activities |
| Recent Activities | `GET /api/activities/recent` | Get recent activities |
| Activity Stats | `GET /api/activities/stats` | Get activity statistics |

---

## 🛠️ Tech Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | v22.20.0 | Runtime Environment |
| **Express** | 5.2.1 | Web Framework |
| **MongoDB** | Latest | Database |
| **MongoDB Native Driver** | Latest | Database Driver |
| **JWT** | 9.0.3 | Authentication |
| **Stripe** | 22.3.0 | Payment Processing |
| **imgBB** | 1.5.1 | Image Upload |
| **bcryptjs** | 3.0.3 | Password Hashing |
| **Helmet** | 8.2.0 | Security Headers |
| **CORS** | 2.8.6 | Cross-Origin Resource Sharing |
| **Morgan** | 1.11.0 | Logging |

### Development Tools
- Nodemon
- ESLint
- Prettier

---

## 📊 Database Architecture

### Users Collection
```javascript
{
  _id: Number,
  name: String,
  email: String,
  password: String,
  image: String,
  role: String,      // 'admin' | 'user'
  isBlocked: Boolean,
  isPremium: Boolean,
  favorites: [Number],
  createdAt: Date,
  updatedAt: Date
}
Recipes Collection
javascript
{
  _id: Number,
  recipeName: String,
  recipeImage: String,
  category: String,
  cuisineType: String,
  difficultyLevel: String,
  preparationTime: Number,
  ingredients: [String],
  instructions: String,
  authorId: Number,
  authorName: String,
  authorEmail: String,
  likesCount: Number,
  viewsCount: Number,
  isFeatured: Boolean,
  status: String,    // 'active' | 'deleted' | 'reported'
  createdAt: Date,
  updatedAt: Date
}
Favorites Collection
javascript
{
  _id: Number,
  userId: Number,
  userEmail: String,
  recipeId: Number,
  addedAt: Date
}
Reports Collection
javascript
{
  _id: Number,
  recipeId: Number,
  reporterEmail: String,
  reporterId: Number,
  reason: String,
  description: String,
  status: String,    // 'pending' | 'resolved' | 'dismissed'
  createdAt: Date,
  updatedAt: Date
}
Payments Collection
javascript
{
  _id: Number,
  userId: Number,
  userEmail: String,
  amount: Number,
  recipeId: Number,
  transactionId: String,
  paymentStatus: String,
  paymentType: String,  // 'premium_membership' | 'recipe_purchase'
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
Activities Collection
javascript
{
  _id: ObjectId,
  userId: Number,
  userEmail: String,
  userName: String,
  action: String,
  target: String,
  targetId: String,
  details: Object,
  ip: String,
  userAgent: String,
  createdAt: Date
}
🔧 Environment Variables
Create a .env file in the root directory:

env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipehub

# JWT
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# imgBB
IMGBB_API_KEY=your_imgbb_api_key

# Admin
ADMIN_EMAIL=admin@recipehub.com
ADMIN_PASSWORD=Admin@123

# Client
CLIENT_URL=http://localhost:3000
🚀 Getting Started
Prerequisites
Node.js (v18 or higher)

MongoDB (Local or Atlas)

npm or yarn

Installation Steps
bash
# 1. Clone the repository
git clone https://github.com/AbdusSalam5683/recipehub-server.git

# 2. Navigate to project directory
cd recipehub-server

# 3. Install dependencies
npm install

# 4. Create .env file and add environment variables

# 5. Run development server
npm run dev

# 6. Server will run on
http://localhost:5000
Available Scripts
Command	Description
npm run dev	Start development server (with nodemon)
npm start	Start production server
npm test	Run tests
Seed Database
bash
# Seed the database with sample data
node src/seed.js
📡 API Endpoints
Authentication Routes
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login user
POST	/api/auth/google	Google login
POST	/api/auth/logout	Logout user
GET	/api/auth/me	Get current user
User Routes (Protected)
Method	Endpoint	Description
GET	/api/users/profile	Get user profile
PUT	/api/users/profile	Update profile
GET	/api/users/stats	Get user stats
GET	/api/users/favorites	Get favorites
POST	/api/users/favorites/:id	Toggle favorite
GET	/api/users/favorites/check/:id	Check favorite
Recipe Routes
Method	Endpoint	Description
GET	/api/recipes	Get all recipes
GET	/api/recipes/featured	Get featured
GET	/api/recipes/popular	Get popular
GET	/api/recipes/my-recipes	Get user's recipes
GET	/api/recipes/:id	Get recipe by ID
POST	/api/recipes	Create recipe
PUT	/api/recipes/:id	Update recipe
DELETE	/api/recipes/:id	Delete recipe
POST	/api/recipes/:id/like	Like/Unlike
POST	/api/recipes/:id/report	Report recipe
Admin Routes (Protected + Admin)
Method	Endpoint	Description
GET	/api/admin/overview	Dashboard overview
GET	/api/admin/users	Get all users
PUT	/api/admin/users/:id/block	Block/Unblock user
PUT	/api/admin/users/:id/role	Change user role
DELETE	/api/admin/users/:id	Delete user
GET	/api/admin/recipes	Get all recipes
PUT	/api/admin/recipes/:id/feature	Feature/Unfeature
GET	/api/admin/reports	Get all reports
PUT	/api/admin/reports/:id	Handle report
GET	/api/admin/reports/stats	Report statistics
Payment Routes (Protected)
Method	Endpoint	Description
POST	/api/payment/create-premium-checkout	Premium checkout
POST	/api/payment/create-recipe-checkout	Recipe purchase
GET	/api/payment/verify	Verify payment
GET	/api/payment/purchased	Get purchased
POST	/api/payment/webhook	Stripe webhook
Activity Routes (Protected + Admin)
Method	Endpoint	Description
GET	/api/activities	All activities
GET	/api/activities/recent	Recent activities
GET	/api/activities/stats	Activity stats
🔑 Authentication
JWT Authentication Flow
User logs in with credentials

Server validates credentials

Server generates JWT token

Token stored in HTTP-Only Cookie

Protected routes verify token via middleware

Token expires after 7 days

Token Verification Middleware
javascript
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};
🚀 Deployment
Vercel Deployment
bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
Environment Variables for Production
Variable	Value
MONGODB_URI	Production MongoDB URL
JWT_SECRET	Production JWT Secret
CLIENT_URL	Production Client URL
NODE_ENV	production
🛡️ Security Features
JWT Authentication with HTTP-Only Cookies

Password Hashing (bcryptjs)

Role-Based Access Control (RBAC)

CORS Configuration

Helmet.js Security Headers

Input Validation

XSS Protection

Rate Limiting (Optional)

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
This project is licensed under the MIT License.

📞 Contact
Developer: Abdus Salam

Platform	Link
GitHub	https://github.com/AbdusSalam5683
Email	abdus.salam06111997@gmail.com
Project Client	https://github.com/AbdusSalam5683/-recipehub-client
Project Server	https://github.com/AbdusSalam5683/recipehub-server
📊 Project Status
✅ Complete - All features implemented and tested

Metric	Value
Server Commits	25+
API Endpoints	35+
Deployment	Vercel
Status	✅ Live
Last Updated: July 6, 2026

text

---

## ✅ **Submission Summary**

### **What to Submit**

| Item | Value |
|------|-------|
| **Admin Email** | admin@recipehub.com |
| **Admin Password** | Admin@123 |
| **Live Site Link** | https://recipehub-client-six.vercel.app |
| **Server API Link** | https://recipehub-server-psi.vercel.app |
| **Client Repository** | https://github.com/AbdusSalam5683/-recipehub-client |
| **Server Repository** | https://github.com/AbdusSalam5683/recipehub-server |

---

**🎉 Good luck with your submission!**