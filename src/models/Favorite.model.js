// server/src/models/Favorite.model.js
const { ObjectId } = require('mongodb');

const getCollection = () => {
  const db = global.getDB();
  return db.collection('favorites');
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
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      return await collection.findOne({ _id: objectId });
    } catch (error) {
      return null;
    }
  },
  
  create: async (data) => {
    const collection = getCollection();
    const lastItem = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    const nextId = lastItem.length > 0 ? lastItem[0]._id + 1 : 1;
    
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
      } else {
        const objectId = typeof id === 'string' ? new ObjectId(id) : id;
        query = { _id: objectId };
      }
      return await collection.deleteOne(query);
    } catch (error) {
      return null;
    }
  },
  
  countDocuments: async (filter = {}) => {
    const collection = getCollection();
    return await collection.countDocuments(filter);
  }
};

module.exports = Favorite;