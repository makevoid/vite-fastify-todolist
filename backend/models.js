import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Database configuration based on environment
 * @returns {Sequelize} Configured Sequelize instance
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
  
  return new Sequelize({
    dialect: 'sqlite',
    storage: storage,
    logging: appEnv === 'development' ? console.log : false,
    define: {
      timestamps: false // Disable timestamps to match Python version
    }
  });
}

// Initialize database connection
export const sequelize = getDatabaseConfig();

/**
 * Todo model - equivalent to Python Peewee Todo model
 * @class Todo
 */
export const Todo = sequelize.define('Todo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'title'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    field: 'description'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'completed'
  }
}, {
  tableName: 'todo',
  timestamps: false
});

/**
 * Initialize database and create tables
 * @returns {Promise<void>}
 */
export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Create tables if they don't exist (equivalent to Python create_tables)
    await sequelize.sync({ force: false });
    console.log('Database tables synchronized.');
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
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database:', error);
    throw error;
  }
}

/**
 * Reset database for testing - equivalent to Python test fixture
 * @returns {Promise<void>}
 */
export async function resetDatabase() {
  try {
    await sequelize.sync({ force: true }); // Drop and recreate tables
    console.log('Database reset completed.');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}