import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupabaseData() {
  console.log('🔍 Checking Supabase data...\n');

  try {
    // 1. Check if medications table exists and get count
    const { count, error: countError } = await supabase
      .from('medications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error accessing medications table:', countError.message);
      return;
    }

    console.log(`✅ Medications table exists with ${count} records\n`);

    // 2. Fetch all medications
    const { data: medications, error: fetchError } = await supabase
      .from('medications')
      .select('*')
      .order('name');

    if (fetchError) {
      console.error('❌ Error fetching medications:', fetchError.message);
      return;
    }

    // 3. Display sample data
    console.log('📊 Sample medications (first 5):');
    medications.slice(0, 5).forEach((med, index) => {
      console.log(`\n${index + 1}. ${med.name}`);
      console.log(`   ID: ${med.id}`);
      console.log(`   Type: ${med.type}`);
      console.log(`   Active: ${med.is_active}`);
      console.log(`   Dose Form: ${med.dose_form}`);
    });

    // 4. Check data integrity
    console.log('\n🔧 Data Integrity Check:');
    
    const missingNames = medications.filter(m => !m.name).length;
    const missingTypes = medications.filter(m => !m.type).length;
    const missingDoseForms = medications.filter(m => !m.dose_form).length;
    
    console.log(`   Missing names: ${missingNames}`);
    console.log(`   Missing types: ${missingTypes}`);
    console.log(`   Missing dose forms: ${missingDoseForms}`);

    // 5. Check for unique medication types
    const types = [...new Set(medications.map(m => m.type))];
    console.log(`\n📋 Medication types found: ${types.join(', ')}`);

    // 6. Check for dose forms
    const doseForms = [...new Set(medications.map(m => m.dose_form).filter(Boolean))];
    console.log(`\n💊 Dose forms found (first 10):`);
    doseForms.slice(0, 10).forEach(form => console.log(`   - ${form}`));

    console.log('\n✅ Supabase data check complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSupabaseData();