import knex from 'knex';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Database configuration based on environment
 * @returns {knex.Knex} Configured Knex instance
 */
function getDatabaseConfig() {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  
  // Define environment-specific database files
  const databaseFiles = {
    development: join(__dirname, 'todolist_development.sqlite'),
    test: join(__dirname, 'todolist_test.sqlite'),
    production: join(__dirname, 'todolist_production.sqlite')
  };
  
  const storage = databaseFiles[appEnv] || databaseFiles.development;
  
  return knex({
    client: 'sqlite3',
    connection: {
      filename: storage
    },
    useNullAsDefault: true,
    debug: appEnv === 'development'
  });
}

// Initialize database connection
export const db = getDatabaseConfig();

/**
 * Todo table schema definition
 */
export const TODO_TABLE = 'todo';

/**
 * Initialize database and create tables
 * @returns {Promise<void>}
 */
export async function initDatabase() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('Database connection established successfully.');
    
    // Create todo table if it doesn't exist
    const hasTable = await db.schema.hasTable(TODO_TABLE);
    if (!hasTable) {
      await db.schema.createTable(TODO_TABLE, (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.text('description').notNullable().defaultTo('');
        table.boolean('completed').notNullable().defaultTo(false);
      });
      console.log('Database tables created.');
    } else {
      console.log('Database tables already exist.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

/**
 * Close database connection
 * @returns {Promise<void>}
 */
export async function closeDatabase() {
  try {
    await db.destroy();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database:', error);
    throw error;
  }
}

/**
 * Reset database for testing
 * @returns {Promise<void>}
 */
export async function resetDatabase() {
  try {
    // Drop table if exists and recreate
    await db.schema.dropTableIfExists(TODO_TABLE);
    await db.schema.createTable(TODO_TABLE, (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('description').notNullable().defaultTo('');
      table.boolean('completed').notNullable().defaultTo(false);
    });
    console.log('Database reset completed.');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Todo class for data operations
 */
export class Todo {
  /**
   * Create a new todo
   * @param {Object} data - Todo data
   * @returns {Promise<Object>} Created todo
   */
  static async create(data) {
    const [id] = await db(TODO_TABLE).insert({
      title: data.title,
      description: data.description || '',
      completed: data.completed || false
    });
    
    return await Todo.findById(id);
  }

  /**
   * Find todo by ID
   * @param {number} id - Todo ID
   * @returns {Promise<Object|null>} Todo or null
   */
  static async findById(id) {
    const todo = await db(TODO_TABLE).where({ id }).first();
    return todo || null;
  }

  /**
   * Find all todos
   * @returns {Promise<Array>} Array of todos
   */
  static async findAll() {
    return await db(TODO_TABLE).select('*');
  }

  /**
   * Update todo by ID
   * @param {number} id - Todo ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated todo or null
   */
  static async update(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.completed !== undefined) updateData.completed = data.completed;

    const updated = await db(TODO_TABLE).where({ id }).update(updateData);
    if (updated === 0) return null;
    
    return await Todo.findById(id);
  }

  /**
   * Delete todo by ID
   * @param {number} id - Todo ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const deleted = await db(TODO_TABLE).where({ id }).del();
    return deleted > 0;
  }

  /**
   * Count todos by status
   * @returns {Promise<Object>} Count object with total, completed, pending
   */
  static async getStats() {
    const total = await db(TODO_TABLE).count('* as count').first();
    const completed = await db(TODO_TABLE).where({ completed: true }).count('* as count').first();
    
    return {
      total: total.count,
      completed: completed.count,
      pending: total.count - completed.count
    };
  }

  /**
   * Find todos by completion status
   * @param {boolean} completed - Completion status
   * @returns {Promise<Array>} Array of todos
   */
  static async findByStatus(completed) {
    return await db(TODO_TABLE).where({ completed }).select('*');
  }
}