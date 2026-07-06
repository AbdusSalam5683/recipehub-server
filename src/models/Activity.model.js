// server/src/models/Activity.model.js
const { ObjectId } = require('mongodb');

let dbInstance;

const setDB = (db) => {
  dbInstance = db;
};

const getCollection = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setDB first.');
  }
  return dbInstance.collection('activities');
};

const Activity = {
  // Create a new activity log
  create: async (data) => {
    const collection = getCollection();
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date(),
    });
    return await collection.findOne({ _id: result.insertedId });
  },

  // Get all activities with pagination
  findAll: async (filter = {}, page = 1, limit = 20) => {
    const collection = getCollection();
    const skip = (page - 1) * limit;
    
    const activities = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await collection.countDocuments(filter);
    
    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Get recent activities (for dashboard)
  findRecent: async (limit = 10) => {
    const collection = getCollection();
    return await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  },

  // Count activities
  count: async (filter = {}) => {
    const collection = getCollection();
    return await collection.countDocuments(filter);
  },

  // Delete old activities (optional)
  deleteOld: async (days = 30) => {
    const collection = getCollection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return await collection.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
  },
};

// Helper function to log activities
const logActivity = async (data) => {
  try {
    return await Activity.create({
      userId: data.userId || null,
      userEmail: data.userEmail || null,
      userName: data.userName || null,
      action: data.action,
      target: data.target || null,
      targetId: data.targetId || null,
      details: data.details || null,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

module.exports = { Activity, logActivity, setDB };