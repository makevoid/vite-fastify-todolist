import { test, expect } from '@playwright/test';

// Test environment URLs
const API_URL = 'http://localhost:8001';
const APP_URL = 'http://localhost:5174';

/**
 * End-to-end tests for Todo App
 * Converted from Python Playwright tests
 */
test.describe('Todo App E2E Tests', () => {
  
  // Setup and cleanup for each test
  test.beforeEach(async ({ page }) => {
    // Clean up todos before each test - optimized for speed
    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        const todos = await response.json();
        // Delete each todo with shorter timeout
        await Promise.all(
          todos.map(todo => 
            fetch(`${API_URL}/api/todos/${todo.id}`, {
              method: 'DELETE',
              signal: AbortSignal.timeout(1000)
            }).catch(() => {}) // Ignore errors during cleanup
          )
        );
      }
    } catch (error) {
      // Backend might not be running or slow - continue with test
    }
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
    
    // Wait for todo to appear
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    
    // Perform various todo operations
    await page.click('[data-testid="toggle-1"]');  // Toggle completion
    await page.click('[data-testid="edit-1"]');    // Start edit
    await page.click('[data-testid="cancel-edit-1"]');  // Cancel edit
    await page.click('[data-testid="toggle-1"]');  // Toggle back
    
    // Wait for all operations to complete
    await page.waitForTimeout(300);
    
    // Delete the todo
    await page.click('[data-testid="delete-1"]');
    
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
    
    // Wait for the todo to appear
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    
    // Check the todo content
    await expect(page.locator('[data-testid="title-1"]')).toContainText('Buy groceries');
    await expect(page.locator('[data-testid="description-1"]')).toContainText('Milk, bread, eggs');
  });

  test('should create a todo with only title', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Fill only title
    await page.fill('[data-testid="todo-title-input"]', 'Simple task');
    
    // Submit the form
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for the todo to appear
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-1"]')).toContainText('Simple task');
  });

  test('should toggle todo completion status', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo first
    await page.fill('[data-testid="todo-title-input"]', 'Complete me');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for todo to appear
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    
    // Check initial state (not completed)
    const checkbox = page.locator('[data-testid="toggle-1"]');
    await expect(checkbox).not.toBeChecked();
    
    // Toggle to completed
    await page.click('[data-testid="toggle-1"]');
    await expect(checkbox).toBeChecked();
    
    // Toggle back to incomplete
    await page.click('[data-testid="toggle-1"]');
    await expect(checkbox).not.toBeChecked();
  });

  test('should edit a todo', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Original Title');
    await page.fill('[data-testid="todo-description-input"]', 'Original Description');
    await page.click('[data-testid="create-todo-btn"]');
    
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    
    // Start editing
    await page.click('[data-testid="edit-1"]');
    
    // Edit fields should be visible
    await expect(page.locator('[data-testid="edit-title-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="edit-description-1"]')).toBeVisible();
    
    // Update values
    await page.fill('[data-testid="edit-title-1"]', 'Updated Title');
    await page.fill('[data-testid="edit-description-1"]', 'Updated Description');
    
    // Save changes
    await page.click('[data-testid="save-edit-1"]');
    
    // Check updated content
    await expect(page.locator('[data-testid="title-1"]')).toContainText('Updated Title');
    await expect(page.locator('[data-testid="description-1"]')).toContainText('Updated Description');
  });

  test('should cancel todo edit', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Original Title');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Start editing
    await page.click('[data-testid="edit-1"]');
    
    // Make changes
    await page.fill('[data-testid="edit-title-1"]', 'Changed Title');
    
    // Cancel edit
    await page.click('[data-testid="cancel-edit-1"]');
    
    // Original content should remain
    await expect(page.locator('[data-testid="title-1"]')).toContainText('Original Title');
  });

  test('should delete a todo', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Delete me');
    await page.click('[data-testid="create-todo-btn"]');
    
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    
    // Delete the todo
    await page.click('[data-testid="delete-1"]');
    
    // Check the todo is gone
    await expect(page.locator('[data-testid="todo-1"]')).not.toBeVisible();
    await expect(page.locator('text=No todos yet')).toBeVisible();
  });

  test('should handle multiple todos', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create first todo
    await page.fill('[data-testid="todo-title-input"]', 'First Todo');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Create second todo
    await page.fill('[data-testid="todo-title-input"]', 'Second Todo');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Check both todos are visible
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="todo-2"]')).toBeVisible();
    
    // Check titles
    await expect(page.locator('[data-testid="title-1"]')).toContainText('First Todo');
    await expect(page.locator('[data-testid="title-2"]')).toContainText('Second Todo');
    
    // Toggle completion for first todo
    await page.click('[data-testid="toggle-1"]');
    
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
    
    // Toggle completion
    await page.click('[data-testid="toggle-1"]');
    
    // Refresh the page
    await page.reload();
    
    // Check todo is still there with correct state
    await expect(page.locator('[data-testid="todo-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-1"]')).toContainText('Persistent Todo');
    await expect(page.locator('[data-testid="description-1"]')).toContainText('Should survive refresh');
    await expect(page.locator('[data-testid="toggle-1"]')).toBeChecked();
  });

  test('should handle complex workflow with multiple operations', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create multiple todos
    await page.fill('[data-testid="todo-title-input"]', 'Task 1');
    await page.fill('[data-testid="todo-description-input"]', 'First task');
    await page.click('[data-testid="create-todo-btn"]');
    
    await page.fill('[data-testid="todo-title-input"]', 'Task 2');
    await page.fill('[data-testid="todo-description-input"]', 'Second task');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Mark first todo as completed
    await page.click('[data-testid="toggle-1"]');
    
    // Edit second todo
    await page.click('[data-testid="edit-2"]');
    await page.fill('[data-testid="edit-title-2"]', 'Updated Task 2');
    await page.click('[data-testid="save-edit-2"]');
    
    // Check states
    await expect(page.locator('[data-testid="toggle-1"]')).toBeChecked();
    await expect(page.locator('[data-testid="title-2"]')).toContainText('Updated Task 2');
    
    // Check badge counts
    await expect(page.locator('text=1 Pending')).toBeVisible();
    await expect(page.locator('text=1 Done')).toBeVisible();
    
    // Delete completed todo
    await page.click('[data-testid="delete-1"]');
    
    // Only second todo should remain
    await expect(page.locator('[data-testid="todo-1"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="todo-2"]')).toBeVisible();
    await expect(page.locator('text=1 Pending')).toBeVisible();
    await expect(page.locator('text=0 Done')).toBeVisible();
  });
});