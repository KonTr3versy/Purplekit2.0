import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { connectDatabase } from './lib/database';
import { connectRedis } from './lib/redis';

async function main() {
  try {
    // Connect to services
    await connectDatabase();
    await connectRedis();

    // Create and start server
    const app = createApp();
    
    const server = app.listen(config.port, () => {
      logger.info(`🚀 PurpleKit API running on port ${config.port}`);
      logger.info(`📚 Environment: ${config.env}`);
      logger.info(`🔗 Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after timeout
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

main();
