const { ObjectId } = require('mongodb');

let dbInstance;

const setDB = (db) => {
  dbInstance = db;
};

const getCollection = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setDB first.');
  }
  return dbInstance.collection('payments');
};

// Get next auto-increment ID
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
  // ✅ FIXED: find method with proper filter handling
  find: async (filter = {}) => {
    const collection = getCollection();
    console.log('🔍 Payment.find filter:', JSON.stringify(filter, null, 2));
    
    // ✅ Handle userId type mismatch
    let query = { ...filter };
    
    // If userId is provided, try both string and number
    if (filter.userId !== undefined) {
      const userId = filter.userId;
      
      // Remove the original userId from query
      delete query.userId;
      
      // Create OR condition for both string and number
      query = {
        $or: [
          { userId: userId },
          { userId: parseInt(userId) },
          { userId: userId.toString() }
        ],
        ...query
      };
    }
    
    console.log('🔍 Final query:', JSON.stringify(query, null, 2));
    
    const results = await collection.find(query).toArray();
    console.log(`📊 Found ${results.length} payments`);
    return results;
  },
  
  findOne: async (filter) => {
    const collection = getCollection();
    console.log('🔍 Payment.findOne filter:', JSON.stringify(filter, null, 2));
    const result = await collection.findOne(filter);
    console.log('📊 Result:', result ? 'Found' : 'Not found');
    return result;
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
  
  create: async (data) => {
    const collection = getCollection();
    const nextId = await getNextId();
    
    console.log('📝 Creating payment record:', {
      id: nextId,
      userId: data.userId,
      userEmail: data.userEmail,
      type: data.paymentType,
      status: data.paymentStatus
    });
    
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
      console.log('📊 updateById result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
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

module.exports = { Payment, setDB };