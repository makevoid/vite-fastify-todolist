import { test, expect } from '@playwright/test';

// Test environment URLs
const API_URL = 'http://localhost:3001';
const APP_URL = 'http://localhost:5174';

/**
 * End-to-end tests for Todo App
 * Fixed version with dynamic ID handling
 */
test.describe('Todo App E2E Tests', () => {
  
  // Setup and cleanup for each test
  test.beforeEach(async ({ page }) => {
    // Clean up todos before each test - more robust cleanup
    try {
      // First, get all todos
      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const todos = await response.json();
        
        // Delete each todo sequentially to avoid race conditions
        for (const todo of todos) {
          try {
            await fetch(`${API_URL}/api/todos/${todo.id}`, {
              method: 'DELETE',
              signal: AbortSignal.timeout(3000)
            });
          } catch (error) {
            console.log(`Failed to delete todo ${todo.id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.log('Cleanup failed:', error.message);
      // Continue with test even if cleanup fails
    }
    
    // Small delay to ensure database operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('should display the correct app title', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.locator('h1')).toContainText('Todo List App');
  });

  test('should not have console errors when rendering the main SPA screen', async ({ page }) => {
    const consoleErrors = [];
    const consoleWarnings = [];
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(`Console Warning: ${msg.text()}`);
      }
    });
    
    // Navigate to the app
    await page.goto(APP_URL);
    
    // Wait for the app to fully load
    await expect(page.locator('h1')).toContainText('Todo List App');
    
    // Wait briefly for any async errors
    await page.waitForTimeout(500);
    
    // Assert no console errors occurred
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected:\n${consoleErrors.join('\n')}`);
    }
    
    // Log warnings for informational purposes (don't fail the test)
    if (consoleWarnings.length > 0) {
      console.log(`Console warnings detected (non-fatal):\n${consoleWarnings.join('\n')}`);
    }
  });

  test('should not have console errors during typical user interactions', async ({ page }) => {
    const consoleErrors = [];
    const consoleWarnings = [];
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(`Console Warning: ${msg.text()}`);
      }
    });
    
    // Navigate to the app
    await page.goto(APP_URL);
    
    // Wait for the app to fully load
    await expect(page.locator('h1')).toContainText('Todo List App');
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Test Todo');
    await page.fill('[data-testid="todo-description-input"]', 'Test description');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for todo to appear (dynamic selector)
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    
    // Get the actual todo ID from the page
    const todoCard = page.locator('[data-testid^="todo-"]').first();
    const todoId = await todoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Perform various todo operations using the actual ID
    await page.click(`[data-testid="toggle-${todoId}"]`);  // Toggle completion
    await page.click(`[data-testid="edit-${todoId}"]`);    // Start edit
    await page.click(`[data-testid="cancel-edit-${todoId}"]`);  // Cancel edit
    await page.click(`[data-testid="toggle-${todoId}"]`);  // Toggle back
    
    // Wait for all operations to complete
    await page.waitForTimeout(300);
    
    // Delete the todo
    await page.click(`[data-testid="delete-${todoId}"]`);
    
    // Wait briefly for any async errors
    await page.waitForTimeout(300);
    
    // Assert no console errors occurred during interactions
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected during interactions:\n${consoleErrors.join('\n')}`);
    }
    
    // Log warnings for informational purposes
    if (consoleWarnings.length > 0) {
      console.log(`Console warnings detected during interactions (non-fatal):\n${consoleWarnings.join('\n')}`);
    }
  });

  test('should show empty state when no todos exist', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page.locator('text=No todos yet')).toBeVisible();
  });

  test('should create a new todo', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Fill in the form
    await page.fill('[data-testid="todo-title-input"]', 'Buy groceries');
    await page.fill('[data-testid="todo-description-input"]', 'Milk, bread, eggs');
    
    // Submit the form
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for the todo to appear (use dynamic selector)
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    
    // Check the todo content (use dynamic selectors)
    await expect(page.locator('[data-testid^="title-"]').first()).toContainText('Buy groceries');
    await expect(page.locator('[data-testid^="description-"]').first()).toContainText('Milk, bread, eggs');
  });

  test('should create a todo with only title', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Fill only title
    await page.fill('[data-testid="todo-title-input"]', 'Simple task');
    
    // Submit the form
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for the todo to appear
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    await expect(page.locator('[data-testid^="title-"]').first()).toContainText('Simple task');
  });

  test('should toggle todo completion status', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo first
    await page.fill('[data-testid="todo-title-input"]', 'Complete me');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for todo to appear and get its ID
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]').first();
    const todoId = await todoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Check initial state (not completed)
    const checkbox = page.locator(`[data-testid="toggle-${todoId}"]`);
    await expect(checkbox).not.toBeChecked();
    
    // Toggle to completed
    await page.click(`[data-testid="toggle-${todoId}"]`);
    await expect(checkbox).toBeChecked();
    
    // Toggle back to incomplete
    await page.click(`[data-testid="toggle-${todoId}"]`);
    await expect(checkbox).not.toBeChecked();
  });

  test('should edit a todo', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Original Title');
    await page.fill('[data-testid="todo-description-input"]', 'Original Description');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for todo and get ID
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]').first();
    const todoId = await todoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Start editing
    await page.click(`[data-testid="edit-${todoId}"]`);
    
    // Edit fields should be visible
    await expect(page.locator(`[data-testid="edit-title-${todoId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="edit-description-${todoId}"]`)).toBeVisible();
    
    // Update values
    await page.fill(`[data-testid="edit-title-${todoId}"]`, 'Updated Title');
    await page.fill(`[data-testid="edit-description-${todoId}"]`, 'Updated Description');
    
    // Save changes
    await page.click(`[data-testid="save-edit-${todoId}"]`);
    
    // Check updated content
    await expect(page.locator(`[data-testid="title-${todoId}"]`)).toContainText('Updated Title');
    await expect(page.locator(`[data-testid="description-${todoId}"]`)).toContainText('Updated Description');
  });

  test('should cancel todo edit', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Original Title');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Get todo ID
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]').first();
    const todoId = await todoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Start editing
    await page.click(`[data-testid="edit-${todoId}"]`);
    
    // Make changes
    await page.fill(`[data-testid="edit-title-${todoId}"]`, 'Changed Title');
    
    // Cancel edit
    await page.click(`[data-testid="cancel-edit-${todoId}"]`);
    
    // Original content should remain
    await expect(page.locator(`[data-testid="title-${todoId}"]`)).toContainText('Original Title');
  });

  test('should delete a todo', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Delete me');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Get todo ID
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]').first();
    const todoId = await todoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Delete the todo
    await page.click(`[data-testid="delete-${todoId}"]`);
    
    // Check the todo is gone
    await expect(page.locator(`[data-testid="todo-${todoId}"]`)).not.toBeVisible();
    await expect(page.locator('text=No todos yet')).toBeVisible();
  });

  test('should handle multiple todos', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create first todo
    await page.fill('[data-testid="todo-title-input"]', 'First Todo');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for first todo and get its ID
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const firstTodoCard = page.locator('[data-testid^="todo-"]').first();
    const firstTodoId = await firstTodoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Create second todo
    await page.fill('[data-testid="todo-title-input"]', 'Second Todo');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for second todo
    await expect(page.locator('[data-testid^="todo-"]').nth(1)).toBeVisible();
    const secondTodoCard = page.locator('[data-testid^="todo-"]').nth(1);
    const secondTodoId = await secondTodoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Check titles
    await expect(page.locator(`[data-testid="title-${firstTodoId}"]`)).toContainText('First Todo');
    await expect(page.locator(`[data-testid="title-${secondTodoId}"]`)).toContainText('Second Todo');
    
    // Toggle completion for first todo
    await page.click(`[data-testid="toggle-${firstTodoId}"]`);
    
    // Check badge counts
    await expect(page.locator('text=1 Pending')).toBeVisible();
    await expect(page.locator('text=1 Done')).toBeVisible();
  });

  test('should persist todos after page refresh', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create todo
    await page.fill('[data-testid="todo-title-input"]', 'Persistent Todo');
    await page.fill('[data-testid="todo-description-input"]', 'Should survive refresh');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Get todo ID and toggle completion
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]').first();
    const todoId = await todoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    await page.click(`[data-testid="toggle-${todoId}"]`);
    
    // Refresh the page
    await page.reload();
    
    // Check todo is still there with correct state
    await expect(page.locator(`[data-testid="todo-${todoId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="title-${todoId}"]`)).toContainText('Persistent Todo');
    await expect(page.locator(`[data-testid="description-${todoId}"]`)).toContainText('Should survive refresh');
    await expect(page.locator(`[data-testid="toggle-${todoId}"]`)).toBeChecked();
  });

  test('should handle complex workflow with multiple operations', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create first todo
    await page.fill('[data-testid="todo-title-input"]', 'Task 1');
    await page.fill('[data-testid="todo-description-input"]', 'First task');
    await page.click('[data-testid="create-todo-btn"]');
    
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const firstTodoCard = page.locator('[data-testid^="todo-"]').first();
    const firstTodoId = await firstTodoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Create second todo
    await page.fill('[data-testid="todo-title-input"]', 'Task 2');
    await page.fill('[data-testid="todo-description-input"]', 'Second task');
    await page.click('[data-testid="create-todo-btn"]');
    
    await expect(page.locator('[data-testid^="todo-"]').nth(1)).toBeVisible();
    const secondTodoCard = page.locator('[data-testid^="todo-"]').nth(1);
    const secondTodoId = await secondTodoCard.getAttribute('data-testid').then(id => id.replace('todo-', ''));
    
    // Mark first todo as completed
    await page.click(`[data-testid="toggle-${firstTodoId}"]`);
    
    // Edit second todo
    await page.click(`[data-testid="edit-${secondTodoId}"]`);
    await page.fill(`[data-testid="edit-title-${secondTodoId}"]`, 'Updated Task 2');
    await page.click(`[data-testid="save-edit-${secondTodoId}"]`);
    
    // Check states
    await expect(page.locator(`[data-testid="toggle-${firstTodoId}"]`)).toBeChecked();
    await expect(page.locator(`[data-testid="title-${secondTodoId}"]`)).toContainText('Updated Task 2');
    
    // Check badge counts
    await expect(page.locator('text=1 Pending')).toBeVisible();
    await expect(page.locator('text=1 Done')).toBeVisible();
    
    // Delete completed todo
    await page.click(`[data-testid="delete-${firstTodoId}"]`);
    
    // Only second todo should remain
    await expect(page.locator(`[data-testid="todo-${firstTodoId}"]`)).not.toBeVisible();
    await expect(page.locator(`[data-testid="todo-${secondTodoId}"]`)).toBeVisible();
    await expect(page.locator('text=1 Pending')).toBeVisible();
    await expect(page.locator('text=0 Done')).toBeVisible();
  });
});