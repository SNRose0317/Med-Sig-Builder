import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'add-default-signature-settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Applying migration: add-default-signature-settings.sql');
    console.log('SQL:', migrationSQL);
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // If RPC doesn't exist, try direct approach
      console.log('RPC method not available, trying direct SQL...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        console.log('\nExecuting:', statement.substring(0, 50) + '...');
        
        // For ALTER TABLE, we can check if column exists first
        if (statement.includes('ALTER TABLE')) {
          const { data: columns, error: colError } = await supabase
            .rpc('get_table_columns', { 
              table_name: 'medications',
              schema_name: 'public' 
            })
            .catch(() => ({ data: null, error: 'RPC not available' }));
          
          if (!colError && columns) {
            const hasColumn = columns.some(col => col.column_name === 'default_signature_settings');
            if (hasColumn) {
              console.log('Column default_signature_settings already exists, skipping ALTER TABLE');
              continue;
            }
          }
        }
        
        // Since we can't execute arbitrary SQL directly, we'll need to use the dashboard
        console.log('Direct SQL execution not available through Supabase client.');
        console.log('\nPlease run the following SQL in your Supabase dashboard:');
        console.log('https://supabase.com/dashboard/project/wazdaloyxlsxnmuhgtms/sql/new');
        console.log('\n' + migrationSQL);
        return;
      }
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (error) {
    console.error('Error applying migration:', error);
    console.log('\nPlease run the migration manually in your Supabase dashboard:');
    console.log('https://supabase.com/dashboard/project/wazdaloyxlsxnmuhgtms/sql/new');
  }
}

applyMigration();