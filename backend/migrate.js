#!/usr/bin/env node

/**
 * Database migration script
 * This script initializes the database and creates all necessary tables
 */

import { initDatabase } from './models.js';

async function migrate() {
  console.log('Starting database migration...');
  
  try {
    await initDatabase();
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export { migrate };