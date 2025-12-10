# Plan de Implementación - Juego "Impostor"

## Estructura de Archivos

- [x] `index.html` - Archivo principal HTML
- [x] `styles.css` - Estilos CSS organizados y responsivos
- [x] `game.js` - Lógica principal del juego (modularizado)
- [x] `words.js` - Base de datos de palabras secretas
- [x] `game_impostor_implementation.md` - Archivo de seguimiento del plan (checklist)

## Fase 1: Configuración Inicial y Estructura HTML

- [x] Crear estructura base HTML5 con meta tags y viewport
- [x] Definir contenedores para todas las pantallas (inicio, roles, pistas, votación, resultados, victoria)
- [x] Implementar sistema de navegación entre pantallas (mostrar/ocultar)
- [x] Agregar estructura semántica con secciones y elementos accesibles

## Fase 2: Estilos CSS y Diseño Responsivo

- [x] Crear variables CSS para colores, fuentes y espaciado
- [x] Diseñar layout responsivo para todas las pantallas
- [x] Implementar estilos base (reset, tipografía, contenedores)
- [x] Crear componentes reutilizables (botones, inputs, tarjetas)
- [x] Aplicar diseño minimalista estilo "Among Us" (opcional pero recomendado)
- [x] Implementar modo oscuro (opcional)

## Fase 3: Lógica del Juego - Estado y Datos

- [x] Crear objeto de estado del juego (`gameState`)
- [x] Implementar base de datos de palabras secretas (`words.js`)
- [x] Crear función de selección aleatoria de palabras
- [x] Implementar función de selección aleatoria de impostores
- [x] Crear sistema de gestión de jugadores (activos, eliminados)
- [x] Implementar validación de reglas (mínimo 4 jugadores, máximo 3 impostores, al menos 1 impostor)

## Fase 4: Pantalla de Inicio

- [x] Crear formulario para ingresar número de jugadores
- [x] Crear selector para número de impostores
- [x] Implementar validación de inputs (4-? jugadores, 1-3 impostores)
- [x] Agregar botón de inicio de juego
- [x] Conectar formulario con lógica de inicialización del juego

## Fase 5: Pantalla de Asignación de Roles

- [x] Mostrar lista de jugadores con sus nombres
- [x] Asignar roles (impostor vs no-impostor) aleatoriamente
- [x] Mostrar palabra secreta solo a jugadores no-impostores
- [x] Ocultar palabra a impostores
- [x] Implementar botón "Continuar" para avanzar a fase de pistas
- [x] Agregar instrucciones claras para cada tipo de jugador

## Fase 6: Pantalla de Pistas (Turnos)

- [x] Mostrar orden de turnos de jugadores
- [x] Implementar input para capturar pistas de cada jugador
- [x] Validar que no se repitan pistas entre jugadores
  - [x] Función dedicada `validateClueNotRepeated()` para validar pistas repetidas
  - [x] Comparación insensible a mayúsculas/minúsculas y espacios
  - [x] Si un jugador repite una pista de otro jugador, se muestra mensaje de error y se le pide ingresar otra palabra
  - [x] El jugador permanece en el mismo turno hasta ingresar una pista única
- [x] Mostrar pistas ya ingresadas (para referencia)
- [x] Gestionar turnos secuenciales
- [x] Implementar botón "Siguiente" para avanzar turno
- [x] Agregar botón "Finalizar Ronda" cuando todos hayan dado pista

## Fase 7: Pantalla de Votación

- [x] Mostrar lista de jugadores activos para votar
- [x] Implementar sistema de votación (un voto por jugador)
- [x] Mostrar pistas de la ronda para referencia
- [x] Calcular resultados de votación
- [x] Determinar jugador más votado
- [x] Verificar si el votado es impostor o no
- [x] Implementar lógica de eliminación

## Fase 8: Pantalla de Resultados y Victoria

- [x] Mostrar resultados de la votación
- [x] Indicar si se eliminó un impostor o un inocente
- [x] Actualizar lista de jugadores activos
- [x] Verificar condiciones de victoria:
- [x] Impostor gana si queda solo con 1 persona
- [x] Jugadores ganan si todos los impostores son eliminados
- [x] Mostrar pantalla de victoria con ganador
- [x] Implementar opción de jugar de nuevo o volver al inicio

## Fase 9: Integración y Flujo Completo

- [x] Conectar todas las pantallas en flujo secuencial
- [x] Implementar sistema de rondas múltiples (si aplica)
- [x] Gestionar transiciones entre pantallas
- [x] Validar flujo completo de inicio a fin
- [x] Manejar casos edge (empates en votación, etc.)
- [x] Agregar comentarios completos en todo el código JavaScript

## Fase 10: Mejoras y Pulido

- [x] Agregar animaciones CSS simples para transiciones
- [x] Implementar historial de rondas (opcional)
- [x] Mejorar UX con mensajes informativos
- [x] Agregar efectos visuales para eliminaciones
- [x] Optimizar código y eliminar redundancias
- [x] Probar en diferentes tamaños de pantalla
- [x] Verificar accesibilidad básica

## Fase 11: Documentación y Finalización

- [x] Revisar que todas las reglas del juego estén implementadas
- [x] Verificar que no se usen frameworks ni librerías externas
- [x] Asegurar que el código esté completamente comentado
- [x] Probar todos los escenarios posibles
- [x] Crear README con instrucciones de uso (si es necesario)

## Notas de Implementación

### Características Implementadas

1. ✅ **Sistema completo de pantallas**: Todas las pantallas están implementadas y conectadas
2. ✅ **Validación de reglas**: Se valida correctamente el número de jugadores e impostores
3. ✅ **Asignación aleatoria**: Los roles se asignan aleatoriamente
4. ✅ **Sistema de pistas**: Validación robusta de pistas repetidas mediante función dedicada `validateClueNotRepeated()`, turnos secuenciales, y detección de adivinanza de palabra secreta
5. ✅ **Sistema de votación**: Votación funcional por turnos con cálculo de resultados
6. ✅ **Condiciones de victoria**: Detección automática de condiciones de victoria
7. ✅ **Diseño responsivo**: Funciona en diferentes tamaños de pantalla
8. ✅ **Animaciones**: Transiciones suaves entre pantallas (fadeIn, slideIn, scaleIn, pulse, bounce)
9. ✅ **Modo oscuro**: Tema oscuro por defecto estilo "Among Us"
10. ✅ **Código comentado**: Todo el código JavaScript está completamente documentado
11. ✅ **Manejo de empates**: Sistema para manejar empates en votación
12. ✅ **Base de datos extensa**: Más de 200 palabras en español organizadas por categorías
13. ✅ **Validación de pistas repetidas**: Sistema dedicado que previene que los jugadores usen pistas ya ingresadas por otros, forzando a ingresar una palabra única
14. ✅ **Detección de adivinanza**: Si un jugador o impostor adivina la palabra secreta exacta, la ronda finaliza y el juego se reinicia automáticamente

### Validaciones de Pistas Implementadas

1. **Validación de formato básico**:
   - La pista no puede estar vacía
   - Debe tener al menos 2 caracteres

2. **Validación de pistas repetidas** (`validateClueNotRepeated()`):
   - Compara la pista ingresada con todas las pistas ya dadas por otros jugadores
   - Comparación insensible a mayúsculas/minúsculas y espacios al inicio/final
   - Si se detecta repetición, muestra mensaje de error: "Esta pista ya fue usada por otro jugador. Por favor, ingresa otra palabra."
   - El jugador permanece en el mismo turno hasta ingresar una pista única

3. **Detección de adivinanza de palabra secreta** (`checkWordGuess()`):
   - Compara la pista con la palabra secreta de la ronda
   - Si coincide exactamente (ignorando mayúsculas/minúsculas y espacios), finaliza la ronda inmediatamente
   - Muestra mensaje indicando qué jugador adivinó y reinicia el juego automáticamente

### Estado del Proyecto

**✅ PROYECTO COMPLETADO**

Todas las fases han sido implementadas exitosamente:
- ✅ Fase 1: Estructura HTML
- ✅ Fase 2: Estilos CSS
- ✅ Fase 3: Lógica del juego
- ✅ Fase 4: Pantalla de inicio
- ✅ Fase 5: Pantalla de roles
- ✅ Fase 6: Pantalla de pistas
- ✅ Fase 7: Pantalla de votación
- ✅ Fase 8: Pantalla de resultados
- ✅ Fase 9: Integración completa
- ✅ Fase 10: Mejoras y pulido
- ✅ Fase 11: Documentación

### Mejoras Futuras Opcionales

- Sistema de nombres personalizados para jugadores
- Historial de rondas más detallado
- Sistema de puntuación
- Modo multijugador en línea
- Más palabras en la base de datos
- Sistema de pistas más sofisticado
- Modo de dificultad (fácil, medio, difícil)
- Estadísticas de juego

