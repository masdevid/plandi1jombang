#!/usr/bin/env node

// Database migration script
// This script initializes the database and seeds it with initial data
import { initializeDatabase, seedDatabase } from './lib/database.js';

async function runMigration() {
  try {
    console.log('Starting database migration...');

    // Initialize database schema
    await initializeDatabase();
    console.log('✓ Database schema initialized');

    // Seed initial data
    await seedDatabase();
    console.log('✓ Database seeded with initial data');

    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
