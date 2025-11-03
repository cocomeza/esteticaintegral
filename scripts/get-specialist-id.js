// Script para obtener el ID del especialista activo desde Supabase
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY no encontradas');
  console.error('   Asegúrate de tener un archivo .env.local con estas variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getSpecialistId() {
  try {
    console.log(`🔍 Obteniendo especialistas desde Supabase...`);
    
    const { data: specialists, error } = await supabase
      .from('specialists')
      .select('id, name, email')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(1);

    if (error) {
      throw new Error(`Error de Supabase: ${error.message}`);
    }

    if (!specialists || specialists.length === 0) {
      throw new Error('No se encontraron especialistas activos en la base de datos');
    }

    const specialist = specialists[0];
    console.log(`✅ Especialista encontrado:`);
    console.log(`   ID: ${specialist.id}`);
    console.log(`   Nombre: ${specialist.name || 'N/A'}`);
    console.log(`   Email: ${specialist.email || 'N/A'}`);
    
    return specialist.id;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  getSpecialistId()
    .then(id => {
      console.log(`\n✅ Specialist ID: ${id}`);
      console.log(`\n📝 Para usar en tests:`);
      console.log(`$env:TEST_SPECIALIST_ID="${id}"; node scripts/test-schedule-management.js`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { getSpecialistId };

