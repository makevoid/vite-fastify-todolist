import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { createApp } from './main.js';
import { resetDatabase, closeDatabase } from './models.js';
import { Todo } from './models.js';

describe('Todo API Tests', () => {
  let app;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.APP_ENV = 'test';
    
    // Create test app instance
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    // Close app and database connections
    if (app) {
      await app.close();
    }
    await closeDatabase();
  });

  beforeEach(async () => {
    // Reset database before each test - equivalent to Python test_db fixture
    await resetDatabase();
  });

  describe('Root endpoint', () => {
    test('should return API info', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.message).toBe('Todo API - Test');
      expect(data.version).toBe('1.0.0');
    });
  });

  describe('GET /api/todos', () => {
    test('should return empty array when no todos exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/todos'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toEqual([]);
    });

    test('should return all todos', async () => {
      // Setup test data - equivalent to Python setup_todos fixture
      await Todo.create({ title: 'Buy groceries', description: 'Milk, bread, eggs', completed: false });
      await Todo.create({ title: 'Write tests', description: 'Unit tests for todo API', completed: true });

      const response = await app.inject({
        method: 'GET',
        url: '/api/todos'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data).toHaveLength(2);

      // Verify todo titles
      const todoTitles = data.map(t => t.title);
      expect(todoTitles).toContain('Buy groceries');
      expect(todoTitles).toContain('Write tests');
    });
  });

  describe('POST /api/todos', () => {
    test('should create a new todo', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: {
          title: 'Learn Fastify',
          description: 'Build a todo app'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.title).toBe('Learn Fastify');
      expect(data.description).toBe('Build a todo app');
      expect(data.completed).toBe(false);
      expect(typeof data.id).toBe('number');
    });

    test('should create a todo with minimal data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: {
          title: 'Minimal todo'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.title).toBe('Minimal todo');
      expect(data.description).toBe(''); // Should default to empty string
      expect(data.completed).toBe(false); // Should default to false
    });

    test('should reject todo without title', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: {
          description: 'Missing title'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/todos/:todoId', () => {
    test('should get a specific todo', async () => {
      // Create a todo to get its ID
      const todo = await Todo.create({ 
        title: 'Test todo', 
        description: 'For testing', 
        completed: false 
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/todos/${todo.id}`
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.title).toBe('Test todo');
      expect(data.description).toBe('For testing');
      expect(data.completed).toBe(false);
    });

    test('should return 404 for non-existent todo', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/todos/999'
      });

      expect(response.statusCode).toBe(404);
    });

    test('should return 400 for invalid todo ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/todos/invalid'
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/todos/:todoId', () => {
    test('should update a todo', async () => {
      // Create a todo to update
      const todo = await Todo.create({ 
        title: 'Original title', 
        description: 'Original desc', 
        completed: false 
      });

      const response = await app.inject({
        method: 'PUT',
        url: `/api/todos/${todo.id}`,
        payload: {
          title: 'Updated title',
          description: 'Updated desc',
          completed: true
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.title).toBe('Updated title');
      expect(data.description).toBe('Updated desc');
      expect(data.completed).toBe(true);
    });

    test('should partially update a todo', async () => {
      // Create a todo first
      const todo = await Todo.create({ 
        title: 'Original title', 
        description: 'Original desc', 
        completed: false 
      });

      // Update only the completed status
      const response = await app.inject({
        method: 'PUT',
        url: `/api/todos/${todo.id}`,
        payload: {
          completed: true
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.title).toBe('Original title'); // Should remain unchanged
      expect(data.description).toBe('Original desc'); // Should remain unchanged
      expect(data.completed).toBe(true); // Should be updated
    });

    test('should return 404 for non-existent todo', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/todos/999',
        payload: { title: 'Updated' }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/todos/:todoId/toggle', () => {
    test('should toggle todo completion status', async () => {
      // Create a todo first
      const todo = await Todo.create({ 
        title: 'Toggle test', 
        description: 'Test toggle', 
        completed: false 
      });

      // Toggle to completed
      let response = await app.inject({
        method: 'POST',
        url: `/api/todos/${todo.id}/toggle`
      });

      expect(response.statusCode).toBe(200);
      let data = JSON.parse(response.payload);
      expect(data.completed).toBe(true);

      // Toggle back to not completed
      response = await app.inject({
        method: 'POST',
        url: `/api/todos/${todo.id}/toggle`
      });

      expect(response.statusCode).toBe(200);
      data = JSON.parse(response.payload);
      expect(data.completed).toBe(false);
    });

    test('should return 404 for non-existent todo', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/todos/999/toggle'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/todos/:todoId', () => {
    test('should delete a todo', async () => {
      // Create a todo to delete
      const todo = await Todo.create({ 
        title: 'To be deleted', 
        description: 'Will be removed', 
        completed: false 
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/todos/${todo.id}`
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.message).toContain('deleted');

      // Verify todo is deleted
      const verifyResponse = await app.inject({
        method: 'GET',
        url: `/api/todos/${todo.id}`
      });

      expect(verifyResponse.statusCode).toBe(404);
    });

    test('should return 404 for non-existent todo', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/todos/999'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Complex workflow', () => {
    test('should handle complex workflow with multiple operations', async () => {
      // Create todo
      let response = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: {
          title: 'Workflow todo',
          description: 'Testing workflow'
        }
      });

      expect(response.statusCode).toBe(200);
      const todoId = JSON.parse(response.payload).id;

      // Update description
      response = await app.inject({
        method: 'PUT',
        url: `/api/todos/${todoId}`,
        payload: {
          description: 'Updated description'
        }
      });

      let data = JSON.parse(response.payload);
      expect(data.description).toBe('Updated description');
      expect(data.title).toBe('Workflow todo'); // Should remain unchanged

      // Toggle completion
      response = await app.inject({
        method: 'POST',
        url: `/api/todos/${todoId}/toggle`
      });

      data = JSON.parse(response.payload);
      expect(data.completed).toBe(true);

      // Update title while keeping completion status
      response = await app.inject({
        method: 'PUT',
        url: `/api/todos/${todoId}`,
        payload: {
          title: 'Final title'
        }
      });

      data = JSON.parse(response.payload);
      expect(data.title).toBe('Final title');
      expect(data.completed).toBe(true); // Should remain True

      // Delete
      response = await app.inject({
        method: 'DELETE',
        url: `/api/todos/${todoId}`
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Error handling', () => {
    test('should handle all operations on non-existent todo', async () => {
      const nonExistentId = 999;

      // GET
      let response = await app.inject({
        method: 'GET',
        url: `/api/todos/${nonExistentId}`
      });
      expect(response.statusCode).toBe(404);

      // PUT
      response = await app.inject({
        method: 'PUT',
        url: `/api/todos/${nonExistentId}`,
        payload: { title: 'Updated' }
      });
      expect(response.statusCode).toBe(404);

      // POST (toggle)
      response = await app.inject({
        method: 'POST',
        url: `/api/todos/${nonExistentId}/toggle`
      });
      expect(response.statusCode).toBe(404);

      // DELETE
      response = await app.inject({
        method: 'DELETE',
        url: `/api/todos/${nonExistentId}`
      });
      expect(response.statusCode).toBe(404);
    });
  });
});