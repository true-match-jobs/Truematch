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

httpServer.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});

const shutdown = (): void => {
  webSocketServer.close();
  httpServer.close(() => process.exit(0));

  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
