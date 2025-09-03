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
 * Repository pattern for todo data access - handles database operations
 * Equivalent to Python TodoRepository class
 */
export class TodoRepository {
  /**
   * Find all todos from the database
   * @returns {Promise<Array>} Array of all todos
   */
  static async findAll() {
    try {
      return await Todo.findAll({
        order: [['id', 'ASC']] // Consistent ordering
      });
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
      const todo = await Todo.findByPk(todoId);
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
   * Save a todo to the database (update existing)
   * @param {Object} todo - The todo object to save
   * @returns {Promise<Object>} The saved todo object
   */
  static async save(todo) {
    try {
      await todo.save();
      return todo;
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
      const todo = await this.findById(todoId); // This will throw if not found
      await todo.destroy();
      return true;
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete todo: ${error.message}`);
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
      const todo = await this.findById(todoId); // This will throw if not found
      
      // Update only provided fields
      if (updateData.title !== undefined) {
        todo.title = updateData.title;
      }
      if (updateData.description !== undefined) {
        todo.description = updateData.description;
      }
      if (updateData.completed !== undefined) {
        todo.completed = updateData.completed;
      }

      return await this.save(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update todo: ${error.message}`);
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
      todo.completed = !todo.completed;
      return await this.save(todo);
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
      return await Todo.count();
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
      return await Todo.findAll({
        where: { completed },
        order: [['id', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch todos by status: ${error.message}`);
    }
  }
}