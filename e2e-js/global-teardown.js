import { unlink } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Global teardown for Playwright tests
 * Cleans up backend and frontend services after the test session
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up test services...');
  
  try {
    // Cleanup spawned processes
    await cleanupProcesses();
    
    // Clean up test database file
    await cleanupTestDatabase();
    
    console.log('✅ Test cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
    // Don't throw - we want tests to complete even if cleanup fails
  }
}

/**
 * Cleanup spawned test processes
 */
async function cleanupProcesses() {
  const processes = global.testProcesses || {};
  
  const cleanupPromises = Object.entries(processes).map(async ([name, process]) => {
    if (process && !process.killed) {
      console.log(`🔄 Shutting down ${name} service...`);
      
      return new Promise((resolve) => {
        // Set up exit handler
        process.on('exit', () => {
          console.log(`✅ ${name} service shut down`);
          resolve();
        });
        
        // Send termination signal
        process.kill('SIGTERM');
        
        // Force kill after 5 seconds if graceful shutdown fails
        setTimeout(() => {
          if (!process.killed) {
            console.log(`💀 Force killing ${name} service...`);
            process.kill('SIGKILL');
            resolve();
          }
        }, 5000);
        
        // Resolve after maximum wait time even if process doesn't respond
        setTimeout(() => {
          resolve();
        }, 10000);
      });
    }
  });
  
  // Wait for all processes to be cleaned up
  await Promise.all(cleanupPromises);
  
  // Clear the global references
  global.testProcesses = {};
}

/**
 * Clean up test database file
 */
async function cleanupTestDatabase() {
  try {
    const testDbPath = join(__dirname, '../backend-js/test_todo.db');
    await unlink(testDbPath);
    console.log('🗑️  Test database file removed');
  } catch (error) {
    // File might not exist or already be cleaned up - that's okay
    if (error.code !== 'ENOENT') {
      console.log('ℹ️  Test database cleanup note:', error.message);
    }
  }
}

/**
 * Additional cleanup for any hanging Node.js processes
 */
async function killHangingProcesses() {
  try {
    // Kill any processes using our test ports
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Kill processes on test ports (8001 for backend, 5174 for frontend)
    const ports = [8001, 5174];
    
    for (const port of ports) {
      try {
        // Find processes using the port
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        const pids = stdout.trim().split('\n').filter(pid => pid);
        
        // Kill each process
        for (const pid of pids) {
          try {
            await execAsync(`kill -TERM ${pid}`);
            console.log(`🔄 Killed hanging process ${pid} on port ${port}`);
          } catch (error) {
            // Process might have already exited
          }
        }
      } catch (error) {
        // No processes found on this port - that's good
      }
    }
  } catch (error) {
    // lsof or kill commands might not be available on all systems
    console.log('ℹ️  Could not check for hanging processes:', error.message);
  }
}

export default globalTeardown;