// server/src/cleanup-duplicate.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanup() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // ✅ সব _id দেখুন
    const users = await db.collection('users').find({}).toArray();
    console.log('📊 Current users:', users.map(u => ({ _id: u._id, name: u.name })));
    
    // ✅ ডুপ্লিকেট _id চেক করুন
    const ids = users.map(u => u._id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.log('⚠️ Duplicate _ids found:', duplicateIds);
    }
    
    // ✅ সর্বোচ্চ _id দেখুন
    const maxId = await db.collection('users')
      .find({ _id: { $type: 'number' } })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    console.log('📊 Max _id:', maxId.length > 0 ? maxId[0]._id : 'None');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanup();