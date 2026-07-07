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

// Get next auto-increment ID
const getNextId = async () => {
  const collection = getCollection();
  
  const lastUser = await collection
    .find({ _id: { $type: 'number' } })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  
  if (lastUser.length === 0) {
    const totalUsers = await collection.countDocuments();
    return totalUsers + 1;
  }
  
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
    
    let nextId = await getNextId();
    
    let existingUser = await collection.findOne({ _id: nextId });
    
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
  
  // ✅ FIXED: updateOne method with proper error handling
  updateOne: async (filter, update) => {
    const collection = getCollection();
    try {
      const result = await collection.updateOne(filter, {
        $set: { ...update, updatedAt: new Date() }
      });
      console.log('📊 updateOne result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId
      });
      return result;
    } catch (error) {
      console.error('❌ updateOne error:', error);
      return null;
    }
  },
  
  // ✅ FIXED: updateById with better error handling
  updateById: async (id, update) => {
    const collection = getCollection();
    try {
      let query = {};
      
      // Handle numeric ID
      if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        query = { _id: numericId };
      } 
      // Handle ObjectId string
      else if (typeof id === 'string' && id.length === 24) {
        query = { _id: new ObjectId(id) };
      } 
      // Handle ObjectId instance
      else if (id instanceof ObjectId) {
        query = { _id: id };
      } 
      // Handle string id that might be ObjectId
      else if (typeof id === 'string') {
        try {
          query = { _id: new ObjectId(id) };
        } catch {
          query = { _id: id };
        }
      } else {
        console.error('❌ Invalid ID format for updateById:', id);
        return null;
      }

      console.log('🔍 updateById query:', query);
      
      const result = await collection.updateOne(query, {
        $set: { ...update, updatedAt: new Date() }
      });

      console.log('📊 updateById result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });

      return result;
    } catch (error) {
      console.error('❌ updateById error:', error);
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