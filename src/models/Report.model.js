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
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      return await collection.findOne({ _id: objectId });
    } catch (error) {
      console.error('FindById error:', error);
      return null;
    }
  },
  
  create: async (data) => {
    const collection = getCollection();
    const result = await collection.insertOne({
      ...data,
      likesCount: 0,
      isFeatured: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await collection.findOne({ _id: result.insertedId });
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
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      const result = await collection.updateOne(
        { _id: objectId },
        { $set: { ...update, updatedAt: new Date() } }
      );
      return result;
    } catch (error) {
      console.error('UpdateById error:', error);
      return null;
    }
  },
  
  deleteById: async (id) => {
    const collection = getCollection();
    try {
      const objectId = typeof id === 'string' ? new ObjectId(id) : id;
      return await collection.deleteOne({ _id: objectId });
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