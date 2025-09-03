import { TodoService } from './services.js';
import { TodoNotFoundException } from './repositories.js';

/**
 * Controller class for todo API endpoints
 * Equivalent to Python TodoController class
 */
export class TodoController {
  constructor() {
    this.service = new TodoService();
  }

  /**
   * Get all todos
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Array>} Array of all todos
   */
  async getAllTodos(request, reply) {
    try {
      const todos = await this.service.getAllTodos();
      return reply.code(200).send(todos);
    } catch (error) {
      return this.handleError(reply, error, 'Failed to retrieve todos');
    }
  }

  /**
   * Get a specific todo by ID
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Object>} The requested todo
   */
  async getTodo(request, reply) {
    try {
      const { todoId } = request.params;
      const id = parseInt(todoId, 10);
      
      if (isNaN(id)) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Todo ID must be a valid number' 
        });
      }

      const todo = await this.service.getTodoById(id);
      return reply.code(200).send(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        return reply.code(404).send({ 
          error: 'Not Found', 
          message: error.message 
        });
      }
      return this.handleError(reply, error, 'Failed to retrieve todo');
    }
  }

  /**
   * Create a new todo
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Object>} The created todo
   */
  async createTodo(request, reply) {
    try {
      // Validation will be handled by Fastify schema (added later)
      const todoData = request.body;
      
      // Additional business validation
      this.service.validateTodoData(todoData);
      
      const todo = await this.service.createTodo(todoData);
      return reply.code(200).send(todo);
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('must be')) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: error.message 
        });
      }
      return this.handleError(reply, error, 'Failed to create todo');
    }
  }

  /**
   * Update a todo's details
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Object>} The updated todo
   */
  async updateTodo(request, reply) {
    try {
      const { todoId } = request.params;
      const id = parseInt(todoId, 10);
      
      if (isNaN(id)) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Todo ID must be a valid number' 
        });
      }

      const updateData = request.body;
      
      // Additional business validation
      this.service.validateUpdateData(updateData);
      
      const todo = await this.service.updateTodo(id, updateData);
      return reply.code(200).send(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        return reply.code(404).send({ 
          error: 'Not Found', 
          message: error.message 
        });
      }
      if (error.message.includes('must be') || error.message.includes('required')) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: error.message 
        });
      }
      return this.handleError(reply, error, 'Failed to update todo');
    }
  }

  /**
   * Toggle a todo's completion status
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Object>} The updated todo
   */
  async toggleTodoCompletion(request, reply) {
    try {
      const { todoId } = request.params;
      const id = parseInt(todoId, 10);
      
      if (isNaN(id)) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Todo ID must be a valid number' 
        });
      }

      const todo = await this.service.toggleTodoCompletion(id);
      return reply.code(200).send(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        return reply.code(404).send({ 
          error: 'Not Found', 
          message: error.message 
        });
      }
      return this.handleError(reply, error, 'Failed to toggle todo completion');
    }
  }

  /**
   * Delete a todo
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Object>} Success message
   */
  async deleteTodo(request, reply) {
    try {
      const { todoId } = request.params;
      const id = parseInt(todoId, 10);
      
      if (isNaN(id)) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Todo ID must be a valid number' 
        });
      }

      const result = await this.service.deleteTodo(id);
      return reply.code(200).send(result);
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        return reply.code(404).send({ 
          error: 'Not Found', 
          message: error.message 
        });
      }
      return this.handleError(reply, error, 'Failed to delete todo');
    }
  }

  /**
   * Get todo statistics
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Object>} Todo statistics
   */
  async getTodoStats(request, reply) {
    try {
      const stats = await this.service.getTodoStats();
      return reply.code(200).send(stats);
    } catch (error) {
      return this.handleError(reply, error, 'Failed to get todo statistics');
    }
  }

  /**
   * Get todos by completion status
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Array>} Todos filtered by completion status
   */
  async getTodosByStatus(request, reply) {
    try {
      const { completed } = request.query;
      
      // Convert query parameter to boolean
      let completedStatus;
      if (completed === 'true') {
        completedStatus = true;
      } else if (completed === 'false') {
        completedStatus = false;
      } else {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Completed parameter must be "true" or "false"' 
        });
      }

      const todos = await this.service.getTodosByStatus(completedStatus);
      return reply.code(200).send(todos);
    } catch (error) {
      return this.handleError(reply, error, 'Failed to get todos by status');
    }
  }

  /**
   * Handle errors consistently across all endpoints
   * @param {Object} reply - Fastify reply object
   * @param {Error} error - The error to handle
   * @param {string} message - Custom error message
   * @returns {Promise<Object>} Error response
   */
  async handleError(reply, error, message) {
    console.error(`${message}:`, error);
    
    // Return generic internal server error
    return reply.code(500).send({ 
      error: 'Internal Server Error', 
      message: 'An unexpected error occurred' 
    });
  }

  /**
   * Register all routes with Fastify instance
   * @param {Object} fastify - Fastify instance
   */
  registerRoutes(fastify) {
    // Bind controller methods to preserve 'this' context
    const getAllTodos = this.getAllTodos.bind(this);
    const getTodo = this.getTodo.bind(this);
    const createTodo = this.createTodo.bind(this);
    const updateTodo = this.updateTodo.bind(this);
    const toggleTodoCompletion = this.toggleTodoCompletion.bind(this);
    const deleteTodo = this.deleteTodo.bind(this);
    const getTodoStats = this.getTodoStats.bind(this);
    const getTodosByStatus = this.getTodosByStatus.bind(this);

    // Register routes
    fastify.get('/api/todos', getAllTodos);
    fastify.get('/api/todos/:todoId', getTodo);
    fastify.post('/api/todos', createTodo);
    fastify.put('/api/todos/:todoId', updateTodo);
    fastify.post('/api/todos/:todoId/toggle', toggleTodoCompletion);
    fastify.delete('/api/todos/:todoId', deleteTodo);
    
    // Additional routes for enhanced functionality
    fastify.get('/api/todos/stats', getTodoStats);
    fastify.get('/api/todos/filter/status', getTodosByStatus);
  }
}