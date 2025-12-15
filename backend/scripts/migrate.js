const path = require('path');
const fs = require('fs');

const connectDB = require('../db/connection');

async function run() {
  const arg = process.argv[2];
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.error(`[migrate] No existe el directorio de migraciones: ${migrationsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

  const targets = arg ? files.filter((f) => f === arg || f.startsWith(arg)) : files;

  if (targets.length === 0) {
    console.error(`[migrate] No se encontraron migraciones para: ${arg}`);
    console.error(`[migrate] Disponibles: ${files.join(', ')}`);
    process.exit(1);
  }

  await connectDB();

  for (const file of targets) {
    const fullPath = path.join(migrationsDir, file);
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const migration = require(fullPath);

    if (!migration || typeof migration.up !== 'function') {
      throw new Error(`[migrate] Migración inválida (falta up): ${file}`);
    }

    console.log(`[migrate] Ejecutando ${file}...`);
    // eslint-disable-next-line no-await-in-loop
    await migration.up();
    console.log(`[migrate] OK ${file}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('[migrate] Error:', err);
  process.exit(1);
});
