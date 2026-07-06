// server/src/models/User.model.js
const { ObjectId } = require('mongodb');

let dbInstance;

const setDB = (db) => {
  dbInstance = db;
};

const getCollection = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setDB first.');
  }
  return dbInstance.collection('users');
};

// Get next auto-increment ID - finds the largest _id
const getNextId = async () => {
  const collection = getCollection();
  
  // Find only numeric _id values (exclude ObjectId)
  const lastUser = await collection
    .find({ _id: { $type: 'number' } })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  
  if (lastUser.length === 0) {
    // If no numeric _id exists, use total user count
    const totalUsers = await collection.countDocuments();
    return totalUsers + 1;
  }
  
  // Return the largest _id + 1
  return lastUser[0]._id + 1;
};

const User = {
  find: async (filter = {}) => {
    const collection = getCollection();
    return await collection.find(filter).toArray();
  },
  
  findOne: async (filter) => {
    const collection = getCollection();
    return await collection.findOne(filter);
  },
  
  findById: async (id) => {
    const collection = getCollection();
    try {
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        return await collection.findOne({ _id: numericId });
      }
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      return await collection.findOne({ _id: objectId });
    } catch (error) {
      console.error('FindById error:', error);
      if (typeof id === 'string' && /^\d+$/.test(id)) {
        return await collection.findOne({ _id: parseInt(id) });
      }
      return null;
    }
  },
  
  create: async (data) => {
    const collection = getCollection();
    
    // Generate new _id for the user
    let nextId = await getNextId();
    
    // Check if this _id already exists
    let existingUser = await collection.findOne({ _id: nextId });
    
    // If _id exists, find a new one
    while (existingUser) {
      const maxId = await collection
        .find({ _id: { $type: 'number' } })
        .sort({ _id: -1 })
        .limit(1)
        .toArray();
      
      nextId = maxId.length > 0 ? maxId[0]._id + 1 : 1;
      existingUser = await collection.findOne({ _id: nextId });
    }
    
    const result = await collection.insertOne({
      _id: nextId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await collection.findOne({ _id: nextId });
  },
  
  updateOne: async (filter, update) => {
    const collection = getCollection();
    const result = await collection.updateOne(filter, {
      $set: { ...update, updatedAt: new Date() }
    });
    return result;
  },
  
  updateById: async (id, update) => {
    const collection = getCollection();
    try {
      let query = {};
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        query = { _id: numericId };
      } else {
        const objectId = typeof id === 'string' ? new ObjectId(id) : id;
        query = { _id: objectId };
      }
      const result = await collection.updateOne(query, {
        $set: { ...update, updatedAt: new Date() }
      });
      return result;
    } catch (error) {
      console.error('UpdateById error:', error);
      return null;
    }
  },
  
  deleteById: async (id) => {
    const collection = getCollection();
    try {
      let query = {};
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        query = { _id: numericId };
      } else {
        const objectId = typeof id === 'string' ? new ObjectId(id) : id;
        query = { _id: objectId };
      }
      return await collection.deleteOne(query);
    } catch (error) {
      console.error('DeleteById error:', error);
      return null;
    }
  },
  
  countDocuments: async (filter = {}) => {
    const collection = getCollection();
    return await collection.countDocuments(filter);
  }
};

module.exports = { User, setDB };