import { PrismaClient } from '@prisma/client';
import { MongoClient, Db } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

// ============================================
// PRISMA (PostgreSQL)
// ============================================

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// ============================================
// MONGODB
// ============================================

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function connectMongoDB(): Promise<Db> {
  if (mongoDb) return mongoDb;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_platform';
  
  try {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    mongoDb = mongoClient.db();
    
    // Create indexes for performance
    await mongoDb.collection('usage_metrics').createIndex({ tenantId: 1, timestamp: -1 });
    await mongoDb.collection('usage_metrics').createIndex({ timestamp: -1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL
    await mongoDb.collection('activity_logs').createIndex({ tenantId: 1, timestamp: -1 });
    await mongoDb.collection('activity_logs').createIndex({ timestamp: -1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL
    await mongoDb.collection('ai_insights').createIndex({ tenantId: 1, createdAt: -1 });
    
    logger.info('✅ MongoDB connected successfully');
    return mongoDb;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

function getMongoDb(): Db {
  if (!mongoDb) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return mongoDb;
}

// ============================================
// REDIS
// ============================================

let redisClient: RedisClientType | null = null;

async function connectRedis(): Promise<RedisClientType> {
  if (redisClient?.isOpen) return redisClient;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = createClient({ url });
    
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Redis is optional, so we don't throw
    return null as any;
  }
}

function getRedisClient(): RedisClientType | null {
  return redisClient;
}

// ============================================
// CONNECTION MANAGEMENT
// ============================================

async function connectDatabases() {
  try {
    logger.info('📦 Connecting to databases...');
    
    // Test PostgreSQL connection
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected successfully');
    
    // Connect MongoDB
    await connectMongoDB();
    
    // Connect Redis (optional)
    try {
      await connectRedis();
    } catch (error) {
      logger.warn('⚠️  Redis connection failed, continuing without cache');
    }
    
    logger.info('✅ All databases connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

async function disconnectDatabases() {
  logger.info('📦 Disconnecting from databases...');
  
  try {
    await prisma.$disconnect();
    logger.info('✅ PostgreSQL disconnected');
  } catch (error) {
    logger.error('❌ PostgreSQL disconnect error:', error);
  }
  
  try {
    if (mongoClient) {
      await mongoClient.close();
      logger.info('✅ MongoDB disconnected');
    }
  } catch (error) {
    logger.error('❌ MongoDB disconnect error:', error);
  }
  
  try {
    if (redisClient?.isOpen) {
      await redisClient.quit();
      logger.info('✅ Redis disconnected');
    }
  } catch (error) {
    logger.error('❌ Redis disconnect error:', error);
  }
}

export {
  prisma,
  getMongoDb,
  connectMongoDB,
  getRedisClient,
  connectRedis,
  connectDatabases,
  disconnectDatabases,
};
