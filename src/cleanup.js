// server/src/cleanup.js (একবার চালান)
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanup() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Delete users with string _id
    const result = await db.collection('users').deleteMany({
      _id: { $type: 'string' }
    });
    console.log(`✅ Deleted ${result.deletedCount} users with string _id`);
    
    // Delete recipes with string _id
    const result2 = await db.collection('recipes').deleteMany({
      _id: { $type: 'string' }
    });
    console.log(`✅ Deleted ${result2.deletedCount} recipes with string _id`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanup();