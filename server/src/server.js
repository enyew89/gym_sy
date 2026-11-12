import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of whether command is run from root, server, or server/src
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';

import { connectDB } from './config/db.js';
import { configurePassport } from './config/passport.js';
import { seedDatabase } from './seeds/seed.js';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import plansRoutes from './routes/plans.routes.js';
import memberRoutes from './routes/member.routes.js';
import classesRoutes from './routes/classes.routes.js';
import equipmentRoutes from './routes/equipment.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import progressRoutes from './routes/progress.routes.js';
import aiRoutes from './routes/ai.routes.js';
import trainerRoutes from './routes/trainer.routes.js';
import messageRoutes from './routes/message.routes.js';
import receptionistRoutes from './routes/receptionist.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Connect to Database (Local MongoDB or Atlas, with In-Memory fallback)
    const dbUri = await connectDB();

    // 2. Configure Passport Local Mongoose Strategy
    configurePassport();

    // 3. Seed Default Accounts, Members, Plans & Gym Data
    await seedDatabase();

    // 4. Middlewares & Security Headers
    app.set('trust proxy', 1);

    // Standard security headers
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });

    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    app.use(
      cors({
        origin: (origin, callback) => {
          // Allow same-origin requests (origin is undefined) or recognized domains
          if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
          } else {
            callback(null, true);
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 5. Session Configuration
    let sessionStore;
    try {
      sessionStore = MongoStore.create({
        client: mongoose.connection.getClient(),
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60, // 14 days
      });
    } catch (storeErr) {
      console.warn('⚠️ Could not initialize MongoStore, using MemoryStore:', storeErr.message);
    }

    app.use(
      session({
        secret: process.env.SESSION_SECRET || 'gympro_secure_session_secret_2026',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Ideal and reliable for unified single-service deployments on Render
          maxAge: 14 * 24 * 60 * 60 * 1000,
        },
      })
    );

    // 6. Passport Middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // 7. Request Logger (clean dev output)
    app.use((req, res, next) => {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
      next();
    });

    // 8. Health Check
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'online',
        service: 'GymPro Full Management API',
        timestamp: new Date().toISOString(),
        authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      });
    });

    // 9. API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/plans', plansRoutes);
    app.use('/api/member', memberRoutes);
    app.use('/api/classes', classesRoutes);
    app.use('/api/equipment', equipmentRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/attendance', attendanceRoutes);
    app.use('/api/workouts', workoutRoutes);
    app.use('/api/progress', progressRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/trainer', trainerRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/receptionist', receptionistRoutes);

    // 10. Serve Static Client (Vite React Build) for Unified Render Deployment
    const clientDistPath = path.resolve(__dirname, '../../client/dist');
    if (fs.existsSync(clientDistPath)) {
      console.log(`📦 Serving compiled client frontend from: ${clientDistPath}`);
      app.use(express.static(clientDistPath));

      // For any non-API route, serve index.html to support React Router client-side history
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    } else {
      console.warn(`⚠️ Client dist build not found at ${clientDistPath}. Run 'npm run build' to generate static assets.`);
      app.get('/', (req, res) => {
        res.send('GymPro API server is running. Frontend build not found; please run npm run build.');
      });
    }

    // 11. Global Error Handler
    app.use((err, req, res, next) => {
      console.error('Unhandled Server Error:', err);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
      });
    });

    // 12. Start HTTP Server
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 GymPro Server running on http://localhost:${PORT}`);
      console.log(`🔒 Authentication: express-session + passport + passport-local-mongoose`);
      console.log(`📡 Full REST APIs mounted: Auth, Admin, Plans, Members, Classes, Equipment, Payments, Attendance, Workouts, Progress, AI`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
