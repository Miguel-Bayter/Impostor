/**
 * Base de datos de palabras secretas para el juego Impostor
 * Contiene una variedad de palabras en español organizadas por categorías
 */

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
  'tren',
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
  'correr',
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
  'mañana',
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
  'estrella',
  'corazón',
  'diamante',
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

/**
 * Obtiene una palabra aleatoria de la base de datos
 * @returns {string} Una palabra secreta aleatoria
 */
function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * WORDS_DATABASE.length);
  return WORDS_DATABASE[randomIndex];
}

/**
 * Obtiene múltiples palabras aleatorias únicas
 * @param {number} count - Número de palabras a obtener
 * @returns {string[]} Array de palabras únicas
 */
function getRandomWords(count) {
  const words = [...WORDS_DATABASE];
  const selected = [];

  for (let i = 0; i < count && words.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    selected.push(words.splice(randomIndex, 1)[0]);
  }

  return selected;
}
