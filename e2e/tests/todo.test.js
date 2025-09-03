import { test, expect } from '@playwright/test';

// Test environment URLs
const API_URL = 'http://localhost:3001';
const APP_URL = 'http://localhost:5174';

/**
 * Helper function to safely extract todo ID and build selectors
 */
async function extractTodoIdAndSelectors(page, todoLocator) {
  const todoDataTestId = await todoLocator.getAttribute('data-testid');
  console.log('DEBUG: Raw todoDataTestId:', todoDataTestId);
  
  if (!todoDataTestId || !todoDataTestId.startsWith('todo-')) {
    throw new Error(`Invalid todo data-testid: ${todoDataTestId}`);
  }
  
  const todoId = todoDataTestId.replace('todo-', '');
  console.log('DEBUG: Extracted todoId:', todoId);
  
  if (!todoId) {
    throw new Error('todoId is empty after extraction');
  }
  
  const selectors = {
    todo: 'todo-' + todoId,
    toggle: 'toggle-' + todoId,
    title: 'title-' + todoId,
    description: 'description-' + todoId,
    edit: 'edit-' + todoId,
    delete: 'delete-' + todoId,
    editTitle: 'edit-title-' + todoId,
    editDescription: 'edit-description-' + todoId,
    saveEdit: 'save-edit-' + todoId,
    cancelEdit: 'cancel-edit-' + todoId
  };
  
  console.log('DEBUG: Built selectors:', selectors);
  
  return { todoId, selectors };
}

/**
 * End-to-end tests for Todo App
 * Fixed version with proper string concatenation instead of template literals
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
      throw new Error(`Console errors detected:\\n${consoleErrors.join('\\n')}`);
    }
    
    // Log warnings for informational purposes (don't fail the test)
    if (consoleWarnings.length > 0) {
      console.log(`Console warnings detected (non-fatal):\\n${consoleWarnings.join('\\n')}`);
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
    
    // Wait for todo to appear (dynamic selector - exclude form inputs)
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    
    // Get the actual todo ID and selectors
    const todoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors } = await extractTodoIdAndSelectors(page, todoCard);
    
    // Perform various todo operations using proper selectors
    await expect(page.locator(`[data-testid="${selectors.toggle}"]`)).toBeVisible();
    await page.click(`[data-testid="${selectors.toggle}"]`);  // Toggle completion
    
    await expect(page.locator(`[data-testid="${selectors.edit}"]`)).toBeVisible();
    await page.click(`[data-testid="${selectors.edit}"]`);    // Start edit
    
    await page.click(`[data-testid="${selectors.cancelEdit}"]`);  // Cancel edit
    await page.click(`[data-testid="${selectors.toggle}"]`);  // Toggle back
    
    // Wait for all operations to complete
    await page.waitForTimeout(300);
    
    // Delete the todo
    await expect(page.locator(`[data-testid="${selectors.delete}"]`)).toBeVisible();
    await page.click(`[data-testid="${selectors.delete}"]`);
    
    // Wait briefly for any async errors
    await page.waitForTimeout(300);
    
    // Assert no console errors occurred during interactions
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected during interactions:\\n${consoleErrors.join('\\n')}`);
    }
    
    // Log warnings for informational purposes
    if (consoleWarnings.length > 0) {
      console.log(`Console warnings detected during interactions (non-fatal):\\n${consoleWarnings.join('\\n')}`);
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
    
    // Wait for the todo to appear (use dynamic selector - exclude form inputs)
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    
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
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    await expect(page.locator('[data-testid^="title-"]').first()).toContainText('Simple task');
  });

  test('should toggle todo completion status', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo first
    await page.fill('[data-testid="todo-title-input"]', 'Complete me');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for todo to appear and get its selectors
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors } = await extractTodoIdAndSelectors(page, todoCard);
    
    // Check initial state (not completed)
    const checkbox = page.locator(`[data-testid="${selectors.toggle}"]`);
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    
    // Toggle to completed
    await page.click(`[data-testid="${selectors.toggle}"]`);
    await expect(checkbox).toBeChecked();
    
    // Toggle back to incomplete
    await page.click(`[data-testid="${selectors.toggle}"]`);
    await expect(checkbox).not.toBeChecked();
  });

  test('should edit a todo', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Original Title');
    await page.fill('[data-testid="todo-description-input"]', 'Original Description');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for todo and get selectors
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors } = await extractTodoIdAndSelectors(page, todoCard);
    
    // Start editing
    await expect(page.locator(`[data-testid="${selectors.edit}"]`)).toBeVisible();
    await page.click(`[data-testid="${selectors.edit}"]`);
    
    // Edit fields should be visible
    await expect(page.locator(`[data-testid="${selectors.editTitle}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${selectors.editDescription}"]`)).toBeVisible();
    
    // Update values
    await page.fill(`[data-testid="${selectors.editTitle}"]`, 'Updated Title');
    await page.fill(`[data-testid="${selectors.editDescription}"]`, 'Updated Description');
    
    // Save changes
    await page.click(`[data-testid="${selectors.saveEdit}"]`);
    
    // Check updated content
    await expect(page.locator(`[data-testid="${selectors.title}"]`)).toContainText('Updated Title');
    await expect(page.locator(`[data-testid="${selectors.description}"]`)).toContainText('Updated Description');
  });

  test('should cancel todo edit', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Original Title');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Get todo selectors
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors } = await extractTodoIdAndSelectors(page, todoCard);
    
    // Start editing
    await expect(page.locator(`[data-testid="${selectors.edit}"]`)).toBeVisible();
    await page.click(`[data-testid="${selectors.edit}"]`);
    
    // Make changes
    await page.fill(`[data-testid="${selectors.editTitle}"]`, 'Changed Title');
    
    // Cancel edit
    await page.click(`[data-testid="${selectors.cancelEdit}"]`);
    
    // Original content should remain
    await expect(page.locator(`[data-testid="${selectors.title}"]`)).toContainText('Original Title');
  });

  test('should delete a todo', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create a todo
    await page.fill('[data-testid="todo-title-input"]', 'Delete me');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Get todo selectors
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors } = await extractTodoIdAndSelectors(page, todoCard);
    
    // Delete the todo
    await expect(page.locator(`[data-testid="${selectors.delete}"]`)).toBeVisible();
    await page.click(`[data-testid="${selectors.delete}"]`);
    
    // Check the todo is gone
    await expect(page.locator(`[data-testid="${selectors.todo}"]`)).not.toBeVisible();
    await expect(page.locator('text=No todos yet')).toBeVisible();
  });

  test('should handle multiple todos', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create first todo
    await page.fill('[data-testid="todo-title-input"]', 'First Todo');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for first todo and get its selectors
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const firstTodoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors: firstSelectors } = await extractTodoIdAndSelectors(page, firstTodoCard);
    
    // Create second todo
    await page.fill('[data-testid="todo-title-input"]', 'Second Todo');
    await page.click('[data-testid="create-todo-btn"]');
    
    // Wait for second todo
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').nth(1)).toBeVisible();
    const secondTodoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').nth(1);
    const { selectors: secondSelectors } = await extractTodoIdAndSelectors(page, secondTodoCard);
    
    // Check titles
    await expect(page.locator(`[data-testid="${firstSelectors.title}"]`)).toContainText('First Todo');
    await expect(page.locator(`[data-testid="${secondSelectors.title}"]`)).toContainText('Second Todo');
    
    // Toggle completion for first todo
    await expect(page.locator(`[data-testid="${firstSelectors.toggle}"]`)).toBeVisible();
    await page.click(`[data-testid="${firstSelectors.toggle}"]`);
    
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
    
    // Get todo selectors and toggle completion
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first()).toBeVisible();
    const todoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors } = await extractTodoIdAndSelectors(page, todoCard);
    
    await expect(page.locator(`[data-testid="${selectors.toggle}"]`)).toBeVisible();
    await page.click(`[data-testid="${selectors.toggle}"]`);
    
    // Refresh the page
    await page.reload();
    
    // Check todo is still there with correct state
    await expect(page.locator(`[data-testid="${selectors.todo}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${selectors.title}"]`)).toContainText('Persistent Todo');
    await expect(page.locator(`[data-testid="${selectors.description}"]`)).toContainText('Should survive refresh');
    await expect(page.locator(`[data-testid="${selectors.toggle}"]`)).toBeChecked();
  });

  test('should handle complex workflow with multiple operations', async ({ page }) => {
    await page.goto(APP_URL);
    
    // Create first todo
    await page.fill('[data-testid="todo-title-input"]', 'Task 1');
    await page.fill('[data-testid="todo-description-input"]', 'First task');
    await page.click('[data-testid="create-todo-btn"]');
    
    await expect(page.locator('[data-testid^="todo-"]').first()).toBeVisible();
    const firstTodoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').first();
    const { selectors: firstSelectors } = await extractTodoIdAndSelectors(page, firstTodoCard);
    
    // Create second todo
    await page.fill('[data-testid="todo-title-input"]', 'Task 2');
    await page.fill('[data-testid="todo-description-input"]', 'Second task');
    await page.click('[data-testid="create-todo-btn"]');
    
    await expect(page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').nth(1)).toBeVisible();
    const secondTodoCard = page.locator('[data-testid^="todo-"]:not([data-testid*="input"])').nth(1);
    const { selectors: secondSelectors } = await extractTodoIdAndSelectors(page, secondTodoCard);
    
    // Mark first todo as completed
    await expect(page.locator(`[data-testid="${firstSelectors.toggle}"]`)).toBeVisible();
    await page.click(`[data-testid="${firstSelectors.toggle}"]`);
    
    // Edit second todo
    await expect(page.locator(`[data-testid="${secondSelectors.edit}"]`)).toBeVisible();
    await page.click(`[data-testid="${secondSelectors.edit}"]`);
    await page.fill(`[data-testid="${secondSelectors.editTitle}"]`, 'Updated Task 2');
    await page.click(`[data-testid="${secondSelectors.saveEdit}"]`);
    
    // Check states
    await expect(page.locator(`[data-testid="${firstSelectors.toggle}"]`)).toBeChecked();
    await expect(page.locator(`[data-testid="${secondSelectors.title}"]`)).toContainText('Updated Task 2');
    
    // Check badge counts
    await expect(page.locator('text=1 Pending')).toBeVisible();
    await expect(page.locator('text=1 Done')).toBeVisible();
    
    // Delete completed todo
    await expect(page.locator(`[data-testid="${firstSelectors.delete}"]`)).toBeVisible();
    await page.click(`[data-testid="${firstSelectors.delete}"]`);
    
    // Only second todo should remain
    await expect(page.locator(`[data-testid="${firstSelectors.todo}"]`)).not.toBeVisible();
    await expect(page.locator(`[data-testid="${secondSelectors.todo}"]`)).toBeVisible();
    await expect(page.locator('text=1 Pending')).toBeVisible();
    await expect(page.locator('text=0 Done')).toBeVisible();
  });
});