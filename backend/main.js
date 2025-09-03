import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDatabase, closeDatabase } from './models.js';
import { TodoController } from './controllers.js';
import { routeSchemas } from './schemas.js';

/**
 * Get environment-specific configuration
 */
function getConfig() {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  
  // Port configuration for different environments
  let port;
  if (process.env.PORT) {
    port = parseInt(process.env.PORT);
  } else if (appEnv === 'test') {
    port = 3001;
  } else {
    port = 3000;
  }
  
  return {
    environment: appEnv,
    port: port,
    host: '0.0.0.0',
    logger: appEnv === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : appEnv === 'test' ? false : true,
    title: appEnv === 'test' ? 'Todo API - Test' : 'Todo API'
  };
}

/**
 * Get CORS origins based on environment
 */
function getCorsOrigins() {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  
  if (appEnv === 'test') {
    return ['http://localhost:5174']; // Different port for test frontend
  } else {
    return ['http://localhost:5173', 'http://localhost:5174']; // Support both dev and test frontend ports
  }
}

/**
 * Create and configure Fastify app
 */
async function createApp() {
  const config = getConfig();
  
  // Create Fastify instance
  const fastify = Fastify({
    logger: config.logger
  });

  // Register CORS plugin
  await fastify.register(cors, {
    origin: getCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Initialize database
  await initDatabase();

  // Register routes
  await registerRoutes(fastify);

  // Graceful shutdown handlers
  const gracefulShutdown = async () => {
    console.log('Received shutdown signal, closing server...');
    try {
      await closeDatabase();
      await fastify.close();
      console.log('Server closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  return fastify;
}

/**
 * Register all application routes
 */
async function registerRoutes(fastify) {
  // Root endpoint
  fastify.get('/', async (request, reply) => {
    const config = getConfig();
    return {
      message: config.title,
      version: '1.0.0',
      environment: config.environment
    };
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  // Initialize controller
  const todoController = new TodoController();

  // Register todo routes with schemas
  fastify.get('/api/todos', {
    schema: routeSchemas.getAllTodos
  }, todoController.getAllTodos.bind(todoController));

  fastify.get('/api/todos/:todoId', {
    schema: routeSchemas.getTodo
  }, todoController.getTodo.bind(todoController));

  fastify.post('/api/todos', {
    schema: routeSchemas.createTodo
  }, todoController.createTodo.bind(todoController));

  fastify.put('/api/todos/:todoId', {
    schema: routeSchemas.updateTodo
  }, todoController.updateTodo.bind(todoController));

  fastify.post('/api/todos/:todoId/toggle', {
    schema: routeSchemas.toggleTodo
  }, todoController.toggleTodoCompletion.bind(todoController));

  fastify.delete('/api/todos/:todoId', {
    schema: routeSchemas.deleteTodo
  }, todoController.deleteTodo.bind(todoController));

  // Additional endpoints
  fastify.get('/api/stats', {
    schema: routeSchemas.getTodoStats
  }, todoController.getTodoStats.bind(todoController));

  fastify.get('/api/todos/filter/status', {
    schema: routeSchemas.getTodosByStatus
  }, todoController.getTodosByStatus.bind(todoController));

  // 404 handler
  fastify.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`
    });
  });

  // Error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);

    // Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.validation
      });
    }

    // Default error response
    reply.code(error.statusCode || 500).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred'
    });
  });
}

/**
 * Start the server
 */
async function start() {
  try {
    const app = await createApp();
    const config = getConfig();
    
    const address = await app.listen({
      port: config.port,
      host: config.host
    });
    
    console.log(`🚀 ${config.title} server listening at ${address}`);
    console.log(`📚 Environment: ${config.environment}`);
    
    return app;
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Export for testing
export { createApp };

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}