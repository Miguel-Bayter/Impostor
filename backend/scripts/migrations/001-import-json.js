const fs = require('fs');
const path = require('path');

const User = require('../../models/User');
const Room = require('../../models/Room');

async function up() {
  const fileArg = process.env.MIGRATION_FILE;
  if (!fileArg) {
    console.log('[001-import-json] MIGRATION_FILE no definido. No se importa nada.');
    console.log('[001-import-json] Tip: MIGRATION_FILE=./data/backup.json npm run migrate');
    return;
  }

  const jsonPath = path.isAbsolute(fileArg)
    ? fileArg
    : path.join(process.cwd(), fileArg);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`[001-import-json] No existe el archivo: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const payload = JSON.parse(raw);

  const users = Array.isArray(payload.users) ? payload.users : [];
  const rooms = Array.isArray(payload.rooms) ? payload.rooms : [];

  if (users.length === 0 && rooms.length === 0) {
    console.log('[001-import-json] No hay users/rooms en el JSON.');
    return;
  }

  // Importar usuarios (si ya existen, se ignoran)
  for (const u of users) {
    if (!u?.email || !u?.username) continue;

    const existing = await User.findByEmail(u.email);
    if (existing) continue;

    // No tenemos forma segura de importar hashes preexistentes manteniendo API.
    // Se crea un password temporal (debe resetearse en producción).
    const tempPassword = process.env.MIGRATION_DEFAULT_PASSWORD || 'ChangeMe123!';
    // eslint-disable-next-line no-await-in-loop
    await User.create(u.username, u.email, tempPassword);
  }

  // Importar rooms (solo si no existen)
  for (const r of rooms) {
    if (!r?.id || !r?.hostId || !r?.name) continue;

    const existing = await Room.findById(r.id);
    if (existing) continue;

    // eslint-disable-next-line no-await-in-loop
    await Room.create(r.hostId, r.hostUsername || 'host', {
      name: r.name,
      minPlayers: r.settings?.minPlayers,
      maxPlayers: r.maxPlayers,
      numImpostors: r.settings?.numImpostors,
    });
  }
}

module.exports = { up };
