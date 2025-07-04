import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMigration() {
  try {
    console.log('Checking if default_signature_settings column exists...');
    
    // Try to fetch medications and check if the column is returned
    const { data, error } = await supabase
      .from('medications')
      .select('id, name, default_signature_settings')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('default_signature_settings')) {
        console.log('❌ Column default_signature_settings does not exist yet.');
        console.log('\nPlease run this SQL in your Supabase dashboard:');
        console.log('https://supabase.com/dashboard/project/wazdaloyxlsxnmuhgtms/sql/new');
        console.log('\nSQL to run:');
        console.log('----------------------------------------');
        console.log(`ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS default_signature_settings jsonb;

COMMENT ON COLUMN public.medications.default_signature_settings IS 
'Stores default signature settings for the medication including dosage, route, frequency, and special instructions';`);
        console.log('----------------------------------------');
      } else {
        console.error('Error checking column:', error);
      }
    } else {
      console.log('✅ Column default_signature_settings exists!');
      console.log('Sample data:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyMigration();