import { createServer } from 'http';
import { env } from './config/env';
import { app } from './app';
import { setupWebSocketServer } from './modules/chat/websocket';

const httpServer = createServer(app);
const webSocketServer = setupWebSocketServer(httpServer);

webSocketServer.on('error', (error) => {
  console.error('WebSocket server error:', error.message);
});

httpServer.once('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use. Stop the existing backend process, then restart.`);
    process.exit(1);
  }

  console.error('HTTP server error:', error.message);
  process.exit(1);
});

const PORT = env.PORT;

httpServer.listen(PORT, () => {
  const protocol = env.NODE_ENV === 'production' ? 'https' : 'http';
  const message = {
    timestamp: new Date().toISOString(),
    level: 'info',
    msg: 'Server started',
    env: env.NODE_ENV,
    port: PORT,
    protocol
  };
  console.log(JSON.stringify(message));
});

let isShuttingDown = false;

const shutdown = (): void => {
  if (isShuttingDown) {
    console.log('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    msg: 'Graceful shutdown initiated'
  }));

  // Close WebSocket connections
  webSocketServer.close(() => {
    console.log('WebSocket server closed');
  });

  // Close HTTP server
  httpServer.close(() => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      msg: 'Server shutdown complete'
    }));
    process.exit(0);
  });

  // Force exit after 10 seconds
  const forceExitTimeout = setTimeout(() => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      msg: 'Forced shutdown due to timeout'
    }));
    process.exit(1);
  }, 10000);

  forceExitTimeout.unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    msg: 'Uncaught exception',
    error: {
      name: error.name,
      message: error.message,
      stack: env.NODE_ENV === 'production' ? undefined : error.stack
    }
  }));
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    msg: 'Unhandled rejection',
    reason: reason instanceof Error ? {
      name: reason.name,
      message: reason.message,
      stack: env.NODE_ENV === 'production' ? undefined : reason.stack
    } : reason
  }));
});
