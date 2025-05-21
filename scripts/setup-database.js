#!/usr/bin/env node

/**
 * Medication Signature Builder - Supabase Database Setup Script
 * 
 * This script initializes the Supabase database with the required tables
 * for the Medication Signature Builder application.
 * 
 * Usage:
 *   npm run setup-db
 * 
 * Make sure you have a .env file with:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file.');
  console.error('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY defined.');
  process.exit(1);
}

// For admin operations, service role key is preferred
// but we can use anon key with limited functionality
const key = serviceRoleKey || supabaseKey;
const supabase = createClient(supabaseUrl, key);

// Path to schema SQL file
const schemaFilePath = path.join(__dirname, '..', 'supabase', 'medications-schema.sql');

// Main function
async function setupDatabase() {
  console.log('Starting Supabase database setup...');
  
  try {
    // Read schema file
    console.log('Reading schema file...');
    if (!fs.existsSync(schemaFilePath)) {
      throw new Error(`Schema file not found at: ${schemaFilePath}`);
    }
    
    const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');
    
    // If using service role key, we can execute SQL directly
    if (serviceRoleKey) {
      console.log('Executing schema SQL with service role key...');
      const { error } = await supabase.rpc('pg_execute', { query: schemaSql });
      
      if (error) {
        throw new Error(`Error executing SQL: ${error.message}`);
      }
    } else {
      // With anon key, we need to use public API
      // We'll check if table exists, and if not, guide the user
      console.log('Checking if medications table exists...');
      const { error } = await supabase.from('medications').select('id').limit(1);
      
      if (error && error.code === '42P01') { // "relation does not exist"
        console.log('\nThe medications table does not exist yet.');
        console.log('\nSince you\'re using the anon key, you need to create the table');
        console.log('using the Supabase dashboard or CLI.');
        console.log('\nTo create it via the dashboard:');
        console.log('1. Log in to https://app.supabase.com/');
        console.log('2. Select your project');
        console.log('3. Go to the SQL Editor');
        console.log('4. Create a new query');
        console.log('5. Copy and paste the contents of supabase/medications-schema.sql');
        console.log('6. Click "Run" to execute the query');
        console.log('\nAlternatively, to use the CLI:');
        console.log('1. Install the Supabase CLI');
        console.log('2. Run: supabase login');
        console.log('3. Run: supabase link --project-ref <your-project-ref>');
        console.log('4. Run: supabase db push --schema-only');
        
        process.exit(1);
      } else if (error) {
        throw new Error(`Error checking medications table: ${error.message}`);
      } else {
        console.log('Medications table exists!');
      }
    }
    
    console.log('Database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

// Execute main function
setupDatabase();
