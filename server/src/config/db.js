import mongoose from 'mongoose';

let memoryServerInstance = null;

// Helper to sanitize connection URI for safe console logging
function sanitizeUri(uri) {
  if (!uri) return '';
  return uri.replace(/:([^:@]+)@/, ':****@');
}

export async function connectDB() {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gympro';
  const displayUri = sanitizeUri(primaryUri);

  try {
    console.log(`Connecting to MongoDB at: ${displayUri}...`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 10000, // 10s for reliable Atlas cloud handshake
    });
    console.log(`✅ Connected to MongoDB successfully: ${displayUri}`);
    return primaryUri;
  } catch (err) {
    console.warn(`⚠️ Could not connect to primary MongoDB instance (${err.message})`);
    console.log('🔄 Initializing in-memory MongoDB instance for local development...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ In-memory MongoDB running and connected at: ${memoryUri}`);
      return memoryUri;
    } catch (memError) {
      console.error('❌ Failed to launch in-memory MongoDB:', memError.message);
      throw memError;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
}
