// server/src/models/User.model.js
const { ObjectId } = require('mongodb');

const getCollection = () => {
  const db = global.getDB();
  return db.collection('users');
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
      // Check if id is a number (from seed data)
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        return await collection.findOne({ _id: numericId });
      }
      // Otherwise try as ObjectId
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      return await collection.findOne({ _id: objectId });
    } catch (error) {
      console.error('FindById error:', error);
      // Try as number if ObjectId fails
      if (typeof id === 'string' && /^\d+$/.test(id)) {
        return await collection.findOne({ _id: parseInt(id) });
      }
      return null;
    }
  },
  
  create: async (data) => {
    const collection = getCollection();
    // Get next available _id
    const lastUser = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    const nextId = lastUser.length > 0 ? lastUser[0]._id + 1 : 1;
    
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

module.exports = User;