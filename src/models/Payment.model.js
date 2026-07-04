// server/src/models/Payment.model.js
const { ObjectId } = require('mongodb');

const getCollection = () => {
  const db = global.getDB();
  return db.collection('payments');
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
    return await collection.findOne({ _id: new ObjectId(id) });
  },
  
  create: async (data) => {
    const collection = getCollection();
    const result = await collection.insertOne({
      ...data,
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return await collection.findOne({ _id: result.insertedId });
  },
  
  updateById: async (id, update) => {
    const collection = getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date() } }
    );
    return result;
  },
  
  countDocuments: async (filter = {}) => {
    const collection = getCollection();
    return await collection.countDocuments(filter);
  }
};

module.exports = Payment;