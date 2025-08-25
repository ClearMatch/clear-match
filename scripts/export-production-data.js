#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Production Supabase credentials
const SUPABASE_URL = 'https://zkqeoppjgdyzarkhhbqc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_PRODUCTION_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tables to export in the correct order to respect foreign key constraints
const tables = [
  'organizations',  // No foreign keys
  'profiles',       // References organizations
  'candidates',     // References organizations
  'events',         // References organizations
  'job_postings',   // References organizations
  'tags',           // No foreign keys
  'candidate_tags', // References candidates and tags
  'templates',      // References organizations
  'activities'      // References candidates, organizations, events, job_postings
];

// Function to escape SQL values
function escapeSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'object' && value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  if (typeof value === 'object') {
    // For JSON data, use PostgreSQL's json function to ensure proper formatting
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::json`;
  }
  
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Function to generate INSERT statements for a table
async function generateInsertStatementsForTable(tableName) {
  console.log(`Fetching data from ${tableName}...`);
  
  // Fetch all rows from the table
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return '';
  }
  
  if (!data || data.length === 0) {
    console.log(`No data found in ${tableName}`);
    return '';
  }
  
  console.log(`Found ${data.length} rows in ${tableName}`);
  
  // Generate INSERT statements
  let insertStatements = `-- Data for table ${tableName}\n`;
  
  // Add TRUNCATE statement to clear existing data
  insertStatements += `TRUNCATE TABLE ${tableName} CASCADE;\n`;
  
  // Get column names from the first row
  const columns = Object.keys(data[0]);
  
  // Special handling for candidates table
  if (tableName === 'candidates') {
    // Generate INSERT statements for each row with special handling for JSON fields
    data.forEach(row => {
      // Handle JSON fields specifically for candidates table
      const values = columns.map(column => {
        const value = row[column];
        
        // Handle array fields
        if (['past_job_titles', 'past_industries', 'tech_stack', 'past_companies', 'past_company_sizes', 'must_haves', 'motivation_factors'].includes(column)) {
          if (value === null || value === undefined) {
            return 'NULL';
          }
          
          // If it's already an array, format it as a PostgreSQL array
          if (Array.isArray(value)) {
            const escapedValues = value.map(item => {
              if (item === null) return 'NULL';
              // Properly escape strings with single quotes for PostgreSQL arrays
              return `'${String(item).replace(/'/g, "''")}'`;
            });
            return `ARRAY[${escapedValues.join(', ')}]`;
          }
          
          // If it's a string but should be an array, return NULL (we can't reliably convert it)
          return 'NULL';
        }
        
        // Special handling for known JSON fields in candidates table
        if (column === 'current_location' && typeof value === 'string') {
          return value ? `'{"location": "${value.replace(/'/g, "''")}"}'::json` : 'NULL';
        }
        
        // Handle other JSON fields
        if (['other_social_urls', 'compensation_expectations', 'workplace_preferences', 'visa_requirements', 'nurturing_info', 'schools'].includes(column)) {
          if (value === null || value === undefined) {
            return 'NULL';
          }
          
          if (typeof value === 'string') {
            try {
              // Try to parse it as JSON
              JSON.parse(value);
              return `'${value.replace(/'/g, "''")}'::json`;
            } catch (e) {
              // If it's not valid JSON, wrap it in a JSON object
              return `'{"value": "${value.replace(/'/g, "''")}"}'::json`;
            }
          }
          
          return `'${JSON.stringify(value).replace(/'/g, "''")}'::json`;
        }
        
        return escapeSqlValue(value);
      });
      
      insertStatements += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    });
  } else {
    // Generate INSERT statements for each row
    data.forEach(row => {
      const values = columns.map(column => escapeSqlValue(row[column]));
      insertStatements += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    });
  }
  
  return insertStatements + '\n';
}

// Main function to export data from all tables
async function exportData() {
  console.log('Starting data export from production...');
  
  // Start with commands to disable foreign key constraints
  let seedSql = '-- Seed data exported from production\n\n';
  seedSql += '-- Temporarily disable foreign key constraints\n';
  seedSql += 'SET session_replication_role = replica;\n\n';
  
  // Process each table
  for (const table of tables) {
    const insertStatements = await generateInsertStatementsForTable(table);
    seedSql += insertStatements;
  }
  
  // Re-enable foreign key constraints
  seedSql += '-- Re-enable foreign key constraints\n';
  seedSql += 'SET session_replication_role = default;\n';
  
  // Write to seed.sql file
  const seedFilePath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  fs.writeFileSync(seedFilePath, seedSql);
  
  console.log(`Data export complete. Seed file written to ${seedFilePath}`);
}

// Run the export
exportData().catch(error => {
  console.error('Error exporting data:', error);
  process.exit(1);
});
