// server/src/models/Recipe.model.js
const { ObjectId } = require('mongodb');

const getCollection = () => {
  const db = global.getDB();
  return db.collection('recipes');
};

const Recipe = {
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
    const lastRecipe = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    const nextId = lastRecipe.length > 0 ? lastRecipe[0]._id + 1 : 1;
    
    const result = await collection.insertOne({
      _id: nextId,
      ...data,
      likesCount: 0,
      isFeatured: false,
      status: 'active',
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
  },
  
  aggregate: async (pipeline) => {
    const collection = getCollection();
    return await collection.aggregate(pipeline).toArray();
  }
};

module.exports = Recipe;