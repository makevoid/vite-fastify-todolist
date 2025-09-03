import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Todo App E2E tests
 */
export default defineConfig({
  testDir: './tests',
  
  // Global test timeout (30 seconds per test)
  timeout: 30 * 1000,
  
  // Expect timeout for assertions (10 seconds)
  expect: {
    timeout: 10 * 1000,
  },
  
  // Run tests in parallel
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['line'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  // Global setup and teardown
  globalSetup: './global-setup.js',
  globalTeardown: './global-teardown.js',
  
  // Shared settings for all projects
  use: {
    // Browser settings
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Timeouts
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
    
    // Screenshots and traces
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    
    // Base URLs for testing
    baseURL: process.env.APP_URL || 'http://localhost:5174',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome']
      },
    },
    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Comment out webServer since we use global setup instead
  // webServer: {
  //   command: 'echo "Services should be started externally"',
  //   port: 5174,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000, // 2 minutes
  // },

  // Output directory for test artifacts
  outputDir: 'test-results/',
});

