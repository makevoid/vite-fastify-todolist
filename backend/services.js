import { TodoRepository } from './repositories.js';

/**
 * Service class for todo business logic - uses repository for data access
 * Equivalent to Python TodoService class
 */
export class TodoService {
  constructor() {
    this.repository = TodoRepository;
  }

  /**
   * Get all todos and convert to response format
   * @returns {Promise<Array>} Array of all todos in response format
   */
  async getAllTodos() {
    try {
      const todos = await this.repository.findAll();
      return todos.map(todo => this.toResponseFormat(todo));
    } catch (error) {
      throw new Error(`Failed to get all todos: ${error.message}`);
    }
  }

  /**
   * Get a specific todo by ID and convert to response format
   * @param {number} todoId - The todo ID to retrieve
   * @returns {Promise<Object>} Todo in response format
   * @throws {TodoNotFoundException} When todo is not found
   */
  async getTodoById(todoId) {
    try {
      const todo = await this.repository.findById(todoId);
      return this.toResponseFormat(todo);
    } catch (error) {
      // Re-throw repository exceptions (like TodoNotFoundException) as-is
      throw error;
    }
  }

  /**
   * Create a new todo from request data
   * @param {Object} todoData - The todo creation data
   * @param {string} todoData.title - Todo title
   * @param {string} [todoData.description=''] - Todo description
   * @returns {Promise<Object>} Created todo in response format
   */
  async createTodo(todoData) {
    try {
      // Validate required fields
      if (!todoData.title || typeof todoData.title !== 'string') {
        throw new Error('Title is required and must be a string');
      }

      const description = todoData.description || '';
      const todo = await this.repository.create(todoData.title, description);
      return this.toResponseFormat(todo);
    } catch (error) {
      throw new Error(`Failed to create todo: ${error.message}`);
    }
  }

  /**
   * Update a todo's details with business logic
   * @param {number} todoId - The todo ID to update
   * @param {Object} updateData - The update data
   * @param {string} [updateData.title] - New title
   * @param {string} [updateData.description] - New description
   * @param {boolean} [updateData.completed] - New completion status
   * @returns {Promise<Object>} Updated todo in response format
   * @throws {TodoNotFoundException} When todo is not found
   */
  async updateTodo(todoId, updateData) {
    try {
      // Validate input data types if provided
      if (updateData.title !== undefined && typeof updateData.title !== 'string') {
        throw new Error('Title must be a string');
      }
      if (updateData.description !== undefined && typeof updateData.description !== 'string') {
        throw new Error('Description must be a string');
      }
      if (updateData.completed !== undefined && typeof updateData.completed !== 'boolean') {
        throw new Error('Completed must be a boolean');
      }

      const updatedTodo = await this.repository.updateById(todoId, updateData);
      return this.toResponseFormat(updatedTodo);
    } catch (error) {
      // Re-throw repository exceptions as-is, wrap validation errors
      throw error;
    }
  }

  /**
   * Toggle a todo's completion status (business logic)
   * @param {number} todoId - The todo ID to toggle
   * @returns {Promise<Object>} Updated todo in response format
   * @throws {TodoNotFoundException} When todo is not found
   */
  async toggleTodoCompletion(todoId) {
    try {
      const updatedTodo = await this.repository.toggleCompletion(todoId);
      return this.toResponseFormat(updatedTodo);
    } catch (error) {
      // Re-throw repository exceptions as-is
      throw error;
    }
  }

  /**
   * Delete a todo and return success message
   * @param {number} todoId - The todo ID to delete
   * @returns {Promise<Object>} Success message object
   * @throws {TodoNotFoundException} When todo is not found
   */
  async deleteTodo(todoId) {
    try {
      await this.repository.deleteById(todoId);
      return { message: `Todo with id '${todoId}' deleted` };
    } catch (error) {
      // Re-throw repository exceptions as-is
      throw error;
    }
  }

  /**
   * Get todo statistics
   * @returns {Promise<Object>} Object containing todo statistics
   */
  async getTodoStats() {
    try {
      const allTodos = await this.repository.findAll();
      const completed = allTodos.filter(todo => todo.completed).length;
      const pending = allTodos.length - completed;

      return {
        total: allTodos.length,
        completed,
        pending
      };
    } catch (error) {
      throw new Error(`Failed to get todo statistics: ${error.message}`);
    }
  }

  /**
   * Get todos by completion status
   * @param {boolean} completed - Filter by completion status
   * @returns {Promise<Array>} Array of todos with specified completion status
   */
  async getTodosByStatus(completed) {
    try {
      const todos = await this.repository.findByStatus(completed);
      return todos.map(todo => this.toResponseFormat(todo));
    } catch (error) {
      throw new Error(`Failed to get todos by status: ${error.message}`);
    }
  }

  /**
   * Convert Sequelize model instance to response format
   * Equivalent to Python's TodoResponse.model_validate()
   * @param {Object} todo - Sequelize model instance
   * @returns {Object} Todo in response format
   */
  toResponseFormat(todo) {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed
    };
  }

  /**
   * Validate todo creation data
   * @param {Object} todoData - Data to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validateTodoData(todoData) {
    if (!todoData) {
      throw new Error('Todo data is required');
    }

    if (!todoData.title || typeof todoData.title !== 'string' || todoData.title.trim() === '') {
      throw new Error('Title is required and must be a non-empty string');
    }

    if (todoData.description !== undefined && typeof todoData.description !== 'string') {
      throw new Error('Description must be a string');
    }

    if (todoData.completed !== undefined && typeof todoData.completed !== 'boolean') {
      throw new Error('Completed must be a boolean');
    }

    return true;
  }

  /**
   * Validate todo update data
   * @param {Object} updateData - Data to validate
   * @returns {boolean} True if valid
   * @throws {Error} If validation fails
   */
  validateUpdateData(updateData) {
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required and must contain at least one field');
    }

    if (updateData.title !== undefined) {
      if (typeof updateData.title !== 'string' || updateData.title.trim() === '') {
        throw new Error('Title must be a non-empty string');
      }
    }

    if (updateData.description !== undefined && typeof updateData.description !== 'string') {
      throw new Error('Description must be a string');
    }

    if (updateData.completed !== undefined && typeof updateData.completed !== 'boolean') {
      throw new Error('Completed must be a boolean');
    }

    return true;
  }
}