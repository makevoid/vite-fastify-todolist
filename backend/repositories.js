import { Todo } from './models.js';

/**
 * Custom exception for when a todo is not found - equivalent to Python TodoNotFoundException
 */
export class TodoNotFoundException extends Error {
  constructor(message) {
    super(message);
    this.name = 'TodoNotFoundException';
  }
}

/**
 * Repository pattern for todo data access - handles database operations with Knex
 * Equivalent to Python TodoRepository class
 */
export class TodoRepository {
  /**
   * Find all todos from the database
   * @returns {Promise<Array>} Array of all todos
   */
  static async findAll() {
    try {
      const todos = await Todo.findAll();
      return todos.sort((a, b) => a.id - b.id); // Consistent ordering
    } catch (error) {
      throw new Error(`Failed to fetch todos: ${error.message}`);
    }
  }

  /**
   * Find a todo by ID
   * @param {number} todoId - The todo ID to search for
   * @returns {Promise<Object>} The todo object
   * @throws {TodoNotFoundException} When todo is not found
   */
  static async findById(todoId) {
    try {
      const todo = await Todo.findById(todoId);
      if (!todo) {
        throw new TodoNotFoundException(`Todo with id '${todoId}' not found`);
      }
      return todo;
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch todo by ID: ${error.message}`);
    }
  }

  /**
   * Create a new todo in the database
   * @param {string} title - Todo title
   * @param {string} description - Todo description (optional, defaults to empty string)
   * @returns {Promise<Object>} The created todo object
   */
  static async create(title, description = '') {
    try {
      return await Todo.create({
        title,
        description,
        completed: false
      });
    } catch (error) {
      throw new Error(`Failed to create todo: ${error.message}`);
    }
  }

  /**
   * Update a todo by ID with partial data
   * @param {number} todoId - The ID of the todo to update
   * @param {Object} updateData - Object containing fields to update
   * @returns {Promise<Object>} The updated todo object
   * @throws {TodoNotFoundException} When todo is not found
   */
  static async updateById(todoId, updateData) {
    try {
      // Check if todo exists first
      const existingTodo = await this.findById(todoId); // This will throw if not found
      
      const updatedTodo = await Todo.update(todoId, updateData);
      if (!updatedTodo) {
        throw new TodoNotFoundException(`Todo with id '${todoId}' not found`);
      }
      
      return updatedTodo;
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update todo: ${error.message}`);
    }
  }

  /**
   * Save a todo to the database (for compatibility with existing service layer)
   * @param {Object} todo - The todo object with updates
   * @returns {Promise<Object>} The saved todo object
   */
  static async save(todo) {
    try {
      return await Todo.update(todo.id, {
        title: todo.title,
        description: todo.description,
        completed: todo.completed
      });
    } catch (error) {
      throw new Error(`Failed to save todo: ${error.message}`);
    }
  }

  /**
   * Delete a todo by ID
   * @param {number} todoId - The ID of the todo to delete
   * @returns {Promise<boolean>} True if deletion was successful
   * @throws {TodoNotFoundException} When todo is not found
   */
  static async deleteById(todoId) {
    try {
      // Check if todo exists first
      await this.findById(todoId); // This will throw if not found
      
      const deleted = await Todo.delete(todoId);
      return deleted;
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete todo: ${error.message}`);
    }
  }

  /**
   * Toggle the completion status of a todo
   * @param {number} todoId - The ID of the todo to toggle
   * @returns {Promise<Object>} The updated todo object
   * @throws {TodoNotFoundException} When todo is not found
   */
  static async toggleCompletion(todoId) {
    try {
      const todo = await this.findById(todoId); // This will throw if not found
      const updatedTodo = await Todo.update(todoId, {
        completed: !todo.completed
      });
      return updatedTodo;
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to toggle todo completion: ${error.message}`);
    }
  }

  /**
   * Count total number of todos
   * @returns {Promise<number>} Total count of todos
   */
  static async count() {
    try {
      const stats = await Todo.getStats();
      return stats.total;
    } catch (error) {
      throw new Error(`Failed to count todos: ${error.message}`);
    }
  }

  /**
   * Find todos by completion status
   * @param {boolean} completed - The completion status to filter by
   * @returns {Promise<Array>} Array of todos with specified completion status
   */
  static async findByStatus(completed) {
    try {
      const todos = await Todo.findByStatus(completed);
      return todos.sort((a, b) => a.id - b.id); // Consistent ordering
    } catch (error) {
      throw new Error(`Failed to fetch todos by status: ${error.message}`);
    }
  }
}