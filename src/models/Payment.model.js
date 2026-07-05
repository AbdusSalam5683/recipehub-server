// server/src/models/Payment.model.js
const { ObjectId } = require('mongodb');

const getCollection = () => {
  const db = global.getDB();
  return db.collection('payments');
};

// ✅ Get next auto-increment ID
const getNextId = async () => {
  const collection = getCollection();
  const lastPayment = await collection.find().sort({ _id: -1 }).limit(1).toArray();
  if (lastPayment.length === 0) {
    return 1;
  }
  if (typeof lastPayment[0]._id === 'number') {
    return lastPayment[0]._id + 1;
  }
  const count = await collection.countDocuments();
  return count + 1;
};

const Payment = {
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
      console.warn('⚠️ Invalid ID format:', id);
      return null;
    } catch (error) {
      console.error('FindById error:', error);
      return null;
    }
  },
  
  // ✅ Fixed create method
  create: async (data) => {
    const collection = getCollection();
    const nextId = await getNextId();
    
    const result = await collection.insertOne({
      _id: nextId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await collection.findOne({ _id: nextId });
  },
  
  updateById: async (id, update) => {
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
        console.warn('⚠️ Invalid ID format for update:', id);
        return null;
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
      } else if (typeof id === 'string' && id.length === 24) {
        query = { _id: new ObjectId(id) };
      } else if (id instanceof ObjectId) {
        query = { _id: id };
      } else {
        console.warn('⚠️ Invalid ID format for delete:', id);
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

module.exports = Payment;