import { GamePlayer } from '../../types/game.types';

// Base de datos de palabras secretas
const WORDS_DATABASE = [
  // Animales
  'vaca',
  'perro',
  'gato',
  'león',
  'tigre',
  'elefante',
  'jirafa',
  'zebra',
  'oso',
  'lobo',
  'conejo',
  'ardilla',
  'pájaro',
  'águila',
  'pez',
  'delfín',
  'ballena',
  'tiburón',
  'caballo',
  'cerdo',
  'oveja',
  'gallina',
  'pato',

  // Comida
  'pizza',
  'hamburguesa',
  'pasta',
  'ensalada',
  'sopa',
  'sandwich',
  'taco',
  'sushi',
  'helado',
  'pastel',
  'chocolate',
  'manzana',
  'plátano',
  'naranja',
  'fresa',
  'uva',
  'pan',
  'queso',
  'leche',
  'huevo',
  'arroz',
  'pollo',

  // Deportes
  'fútbol',
  'baloncesto',
  'tenis',
  'natación',
  'ciclismo',
  'correr',
  'voleibol',
  'béisbol',
  'golf',
  'boxeo',
  'karate',
  'yoga',
  'gimnasia',

  // Profesiones
  'médico',
  'profesor',
  'bombero',
  'policía',
  'cocinero',
  'ingeniero',
  'arquitecto',
  'músico',
  'artista',
  'escritor',
  'periodista',
  'abogado',
  'piloto',
  'enfermero',
  'dentista',
  'veterinario',

  // Lugares
  'hospital',
  'escuela',
  'parque',
  'playa',
  'montaña',
  'ciudad',
  'pueblo',
  'biblioteca',
  'museo',
  'cine',
  'restaurante',
  'hotel',
  'aeropuerto',
  'estación',
  'supermercado',
  'iglesia',
  'estadio',

  // Transporte
  'coche',
  'autobús',
  'tren',
  'avión',
  'barco',
  'bicicleta',
  'motocicleta',
  'helicóptero',
  'submarino',
  'metro',
  'taxi',

  // Tecnología
  'computadora',
  'teléfono',
  'tablet',
  'televisión',
  'radio',
  'cámara',
  'auriculares',
  'ratón',
  'teclado',
  'impresora',
  'internet',
  'wifi',

  // Naturaleza
  'árbol',
  'flor',
  'hoja',
  'agua',
  'fuego',
  'tierra',
  'aire',
  'sol',
  'luna',
  'estrella',
  'nube',
  'lluvia',
  'nieve',
  'viento',
  'mar',
  'río',
  'lago',
  'bosque',
  'desierto',
  'volcán',

  // Objetos del hogar
  'mesa',
  'silla',
  'cama',
  'sofá',
  'ventana',
  'puerta',
  'espejo',
  'lámpara',
  'reloj',
  'libro',
  'pluma',
  'cuaderno',
  'maleta',

  // Ropa
  'camisa',
  'pantalón',
  'vestido',
  'zapatos',
  'sombrero',
  'guantes',
  'bufanda',
  'chaqueta',
  'abrigo',
  'calcetines',
  'cinturón',

  // Instrumentos musicales
  'guitarra',
  'piano',
  'violín',
  'trompeta',
  'batería',
  'flauta',
  'saxofón',
  'arpa',
  'tambor',
  'acordeón',

  // Colores
  'rojo',
  'azul',
  'verde',
  'amarillo',
  'naranja',
  'morado',
  'rosa',
  'negro',
  'blanco',
  'gris',
  'marrón',
  'dorado',
  'plateado',

  // Emociones
  'felicidad',
  'tristeza',
  'alegría',
  'miedo',
  'sorpresa',
  'enojo',
  'amor',
  'odio',
  'esperanza',
  'calma',
  'ansiedad',

  // Acciones
  'caminar',
  'saltar',
  'nadar',
  'volar',
  'bailar',
  'cantar',
  'dormir',
  'comer',
  'beber',
  'leer',
  'escribir',
  'dibujar',
  'pintar',

  // Tiempo
  'mañana',
  'tarde',
  'noche',
  'día',
  'semana',
  'mes',
  'año',
  'hora',
  'minuto',
  'segundo',
  'ayer',
  'hoy',
  'pasado',
  'futuro',

  // Cuerpo humano
  'cabeza',
  'brazo',
  'pierna',
  'mano',
  'pie',
  'ojo',
  'oreja',
  'nariz',
  'boca',
  'diente',
  'cabello',
  'corazón',
  'pulmón',
  'hueso',

  // Materiales
  'madera',
  'metal',
  'plástico',
  'vidrio',
  'papel',
  'tela',
  'piedra',
  'arena',
  'barro',
  'hierro',
  'oro',
  'plata',
  'diamante',

  // Formas
  'círculo',
  'cuadrado',
  'triángulo',
  'rectángulo',
  'óvalo',
  'hexágono',
  'pentágono',

  // Estaciones
  'primavera',
  'verano',
  'otoño',
  'invierno',

  // Días de la semana
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',

  // Meses
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

export interface VotingResults {
  mostVotedId: string | null;
  voteCounts: Record<string, number>;
  tiedPlayers: string[];
  isTie: boolean;
  maxVotes: number;
}

export interface VictoryResult {
  winner: 'citizens' | 'impostor' | null;
  message: string;
}

export function getRandomWord(): string {
  const randomIndex = Math.floor(Math.random() * WORDS_DATABASE.length);
  return WORDS_DATABASE[randomIndex];
}

export function checkWordGuess(clue: string, secretWord: string): boolean {
  const normalizedClue = clue.trim().toLowerCase();
  const normalizedSecretWord = secretWord.toLowerCase();
  return normalizedClue === normalizedSecretWord;
}

export function validateClueNotRepeated(
  clue: string,
  existingClues: Array<{ playerId: string; playerName: string; clue: string }>,
): ValidationResult {
  const normalizedClue = clue.trim().toLowerCase();

  if (!existingClues || existingClues.length === 0) {
    return { isValid: true, errorMessage: '' };
  }

  const normalizedExistingClues = existingClues.map((c) => c.clue.trim().toLowerCase());

  if (normalizedExistingClues.includes(normalizedClue)) {
    return {
      isValid: false,
      errorMessage: 'Esta pista ya fue usada por otro jugador. Por favor, ingresa otra palabra.',
    };
  }

  return { isValid: true, errorMessage: '' };
}

export function validateClue(
  clue: string,
  existingClues: Array<{ playerId: string; playerName: string; clue: string }>,
  secretWord: string,
): ValidationResult {
  if (!clue || !clue.trim()) {
    return {
      isValid: false,
      errorMessage: 'Por favor, ingresa una pista',
    };
  }

  if (clue.trim().length < 2) {
    return {
      isValid: false,
      errorMessage: 'La pista debe tener al menos 2 caracteres',
    };
  }

  const repeatValidation = validateClueNotRepeated(clue, existingClues);
  if (!repeatValidation.isValid) {
    return repeatValidation;
  }

  if (checkWordGuess(clue, secretWord)) {
    return {
      isValid: false,
      errorMessage: 'No puedes usar la palabra secreta como pista',
    };
  }

  return { isValid: true, errorMessage: '' };
}

export function validateVote(
  voterId: string,
  votedPlayerId: string,
  activePlayers: GamePlayer[],
): ValidationResult {
  const voter = activePlayers.find((p) => p.userId === voterId);
  if (!voter || voter.isEliminated) {
    return {
      isValid: false,
      errorMessage: 'El votante no es válido o ha sido eliminado',
    };
  }

  const voted = activePlayers.find((p) => p.userId === votedPlayerId);
  if (!voted || voted.isEliminated) {
    return {
      isValid: false,
      errorMessage: 'El jugador votado no es válido o ha sido eliminado',
    };
  }

  if (voterId === votedPlayerId) {
    return {
      isValid: false,
      errorMessage: 'No puedes votar por ti mismo',
    };
  }

  return { isValid: true, errorMessage: '' };
}

export function calculateVotingResults(
  votes: Record<string, string>,
  _players: GamePlayer[],
): VotingResults {
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach((votedId) => {
    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
  });

  let maxVotes = 0;
  let mostVotedId: string | null = null;
  let isTie = false;

  if (Object.keys(voteCounts).length > 0) {
    maxVotes = Math.max(...Object.values(voteCounts));
  }

  const tiedPlayers = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([playerId, _]) => playerId);

  if (tiedPlayers.length > 1) {
    isTie = true;
  } else if (tiedPlayers.length === 1) {
    mostVotedId = tiedPlayers[0];
  }

  return {
    mostVotedId,
    voteCounts,
    tiedPlayers,
    isTie,
    maxVotes,
  };
}

export function resolveVoteTie(tiedPlayerIds: string[]): string | null {
  if (!tiedPlayerIds || tiedPlayerIds.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * tiedPlayerIds.length);
  return tiedPlayerIds[randomIndex];
}

export function checkVictoryConditions(players: GamePlayer[]): VictoryResult {
  const activePlayers = players.filter((p) => !p.isEliminated);
  const activeImpostors = activePlayers.filter((p) => p.isImpostor);
  const activeCitizens = activePlayers.filter((p) => !p.isImpostor);

  if (activeImpostors.length === 0) {
    return {
      winner: 'citizens',
      message: 'Todos los impostores han sido eliminados. Los ciudadanos ganan.',
    };
  }

  if (activeImpostors.length >= activeCitizens.length) {
    return {
      winner: 'impostor',
      message: 'El impostor ha sobrevivido hasta el final. Los impostores ganan.',
    };
  }

  return {
    winner: null,
    message: 'El juego continúa...',
  };
}

export function validateGameRules(numPlayers: number, numImpostors: number): ValidationResult {
  if (numPlayers < 4) {
    return {
      isValid: false,
      errorMessage: 'Se requieren al menos 4 jugadores',
    };
  }

  if (numImpostors < 1) {
    return {
      isValid: false,
      errorMessage: 'Debe haber al menos 1 impostor',
    };
  }

  if (numImpostors > 3) {
    return {
      isValid: false,
      errorMessage: 'Máximo 3 impostores permitidos',
    };
  }

  if (numImpostors >= numPlayers) {
    return {
      isValid: false,
      errorMessage: 'No puede haber más impostores que jugadores',
    };
  }

  return { isValid: true, errorMessage: '' };
}

export { WORDS_DATABASE };
