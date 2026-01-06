import 'dotenv/config';
import { initializeDatabase, seedDatabase } from './lib/database.js';

async function runMigration() {
  try {
    console.log('Starting database migration...');

    await initializeDatabase();
    console.log('✓ Database schema initialized');

    await seedDatabase();
    console.log('✓ Database seeded with initial data');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
