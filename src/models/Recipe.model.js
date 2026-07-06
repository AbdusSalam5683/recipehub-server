// server/src/models/Recipe.model.js
const { ObjectId } = require('mongodb');

let dbInstance;

const setDB = (db) => {
  dbInstance = db;
};

const getCollection = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setDB first.');
  }
  return dbInstance.collection('recipes');
};

const Recipe = {
  create: async (data) => {
    const collection = getCollection();
    const result = await collection.insertOne({
      ...data,
      likesCount: 0,
      viewsCount: 0,
      isFeatured: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await collection.findOne({ _id: result.insertedId });
  },

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
      return await collection.updateOne(query, {
        $set: { status: 'deleted', updatedAt: new Date() }
      });
    } catch (error) {
      console.error('DeleteById error:', error);
      return null;
    }
  },

  countDocuments: async (filter = {}) => {
    const collection = getCollection();
    return await collection.countDocuments(filter);
  },

  incrementViews: async (id) => {
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
      return await collection.updateOne(query, {
        $inc: { viewsCount: 1 }
      });
    } catch (error) {
      console.error('Increment views error:', error);
      return null;
    }
  }
};

module.exports = { Recipe, setDB };