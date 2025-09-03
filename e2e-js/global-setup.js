import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Test environment URLs
const API_URL = 'http://localhost:8001';
const APP_URL = 'http://localhost:5174';

/**
 * Global setup for Playwright tests
 * Starts backend and frontend services for the test session
 */
async function globalSetup() {
  console.log('🚀 Starting test services...');
  
  // Store process references globally for teardown
  global.testProcesses = {
    backend: null,
    frontend: null
  };

  try {
    // Start test backend on port 8001
    console.log('📦 Starting test backend service...');
    await startBackend();
    
    // Wait for backend to be ready
    await waitForService(API_URL, 'Backend');
    
    // Start test frontend on port 5174
    console.log('🌐 Starting test frontend service...');
    await startFrontend();
    
    // Wait for frontend to be ready
    await waitForService(APP_URL, 'Frontend');
    
    console.log('✅ All test services started successfully');
    console.log(`   Backend: ${API_URL}`);
    console.log(`   Frontend: ${APP_URL}`);
    
  } catch (error) {
    console.error('❌ Failed to start test services:', error);
    
    // Cleanup on failure
    await cleanupProcesses();
    throw error;
  }
}

/**
 * Start the Node.js backend in test mode
 */
async function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = join(__dirname, '../backend-js');
    
    const backendProcess = spawn('node', ['main.js'], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        APP_ENV: 'test',
        NODE_ENV: 'test'
      }
    });

    global.testProcesses.backend = backendProcess;

    let resolved = false;

    // Handle process output
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('server listening') && !resolved) {
        resolved = true;
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('Backend stderr:', data.toString());
    });

    backendProcess.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Failed to start backend: ${error.message}`));
      }
    });

    backendProcess.on('exit', (code) => {
      if (code !== 0 && !resolved) {
        resolved = true;
        reject(new Error(`Backend process exited with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
}

/**
 * Start the frontend in test mode
 */
async function startFrontend() {
  return new Promise((resolve, reject) => {
    const frontendPath = join(__dirname, '../frontend');
    
    const frontendProcess = spawn('npm', ['run', 'dev', '--', '--port', '5174'], {
      cwd: frontendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        VITE_API_URL: API_URL,
        PORT: '5174'
      }
    });

    global.testProcesses.frontend = frontendProcess;

    let resolved = false;

    // Handle process output
    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if ((output.includes('Local:') || output.includes('localhost:5174')) && !resolved) {
        resolved = true;
        resolve();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      // Vite often logs to stderr, so check for success indicators there too
      if ((output.includes('Local:') || output.includes('localhost:5174')) && !resolved) {
        resolved = true;
        resolve();
      } else {
        console.error('Frontend stderr:', output);
      }
    });

    frontendProcess.on('error', (error) => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Failed to start frontend: ${error.message}`));
      }
    });

    frontendProcess.on('exit', (code) => {
      if (code !== 0 && !resolved) {
        resolved = true;
        reject(new Error(`Frontend process exited with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Frontend startup timeout'));
      }
    }, 30000);
  });
}

/**
 * Wait for a service to be available
 */
async function waitForService(url, serviceName, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout per request
      });
      
      if (response.ok) {
        console.log(`✅ ${serviceName} is ready at ${url}`);
        return;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }
    
    // Wait 1 second before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`${serviceName} failed to start within ${timeout}ms at ${url}`);
}

/**
 * Cleanup spawned processes
 */
async function cleanupProcesses() {
  const processes = global.testProcesses || {};
  
  for (const [name, process] of Object.entries(processes)) {
    if (process && !process.killed) {
      console.log(`🧹 Cleaning up ${name} process...`);
      process.kill('SIGTERM');
      
      // Force kill after 5 seconds if it doesn't shut down gracefully
      setTimeout(() => {
        if (!process.killed) {
          console.log(`💀 Force killing ${name} process...`);
          process.kill('SIGKILL');
        }
      }, 5000);
    }
  }
  
  // Clear the references
  global.testProcesses = {};
}

export default globalSetup;