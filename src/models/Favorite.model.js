// server/src/models/Favorite.model.js
const { ObjectId } = require('mongodb');

let dbInstance;

const setDB = (db) => {
  dbInstance = db;
};

const getCollection = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setDB first.');
  }
  return dbInstance.collection('favorites');
};

// Get next auto-increment ID
const getNextId = async () => {
  const collection = getCollection();
  const lastItem = await collection.find().sort({ _id: -1 }).limit(1).toArray();
  if (lastItem.length === 0) {
    return 1;
  }
  if (typeof lastItem[0]._id === 'number') {
    return lastItem[0]._id + 1;
  }
  const count = await collection.countDocuments();
  return count + 1;
};

const Favorite = {
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
      if (typeof id === 'string' && id.length === 24) {
        const objectId = new ObjectId(id);
        return await collection.findOne({ _id: objectId });
      }
      if (id instanceof ObjectId) {
        return await collection.findOne({ _id: id });
      }
      return null;
    } catch (error) {
      console.error('FindById error:', error);
      return null;
    }
  },
  
  create: async (data) => {
    const collection = getCollection();
    const nextId = await getNextId();
    
    const result = await collection.insertOne({
      _id: nextId,
      ...data,
      addedAt: new Date()
    });
    return await collection.findOne({ _id: nextId });
  },
  
  deleteOne: async (filter) => {
    const collection = getCollection();
    return await collection.deleteOne(filter);
  },
  
  deleteById: async (id) => {
    const collection = getCollection();
    try {
      let query = {};
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        query = { _id: numericId };
      } else if (typeof id === 'string' && id.length === 24) {
        query = { _id: new ObjectId(id) };
      } else if (id instanceof ObjectId) {
        query = { _id: id };
      } else {
        return null;
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

module.exports = { Favorite, setDB };