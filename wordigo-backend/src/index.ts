/**
 * Wordigo Backend Server
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import routes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Response logging
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`Response sent for ${req.method} ${req.path}: ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server - listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Wordigo Backend Server`);
  console.log(`📡 Listening on http://0.0.0.0:${PORT}`);
  console.log(`🌐 Network access: http://192.168.50.17:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/word - Get random word`);
  console.log(`   POST /api/game/answer - Submit answer`);
  console.log(`   GET  /api/history - Get game history`);
  console.log(`   GET  /api/stats/summary - Get statistics\n`);
});

export default app;
