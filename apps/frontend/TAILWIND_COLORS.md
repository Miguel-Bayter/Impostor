# Guía de Colores Tailwind CSS v4

Esta guía explica cómo sobreescribir y usar los colores del design system en Tailwind CSS v4.

## Configuración en `@theme`

En Tailwind CSS v4, los colores se definen en el bloque `@theme` del archivo `index.css`. Cada variable `--color-{name}` se mapea automáticamente a las utilidades de Tailwind como `bg-{name}`, `text-{name}`, `border-{name}`, etc.

### Ejemplo de Configuración

```css
@theme {
  /* Colores Semánticos */
  --color-primary: #a855f7; /* bg-primary, text-primary, border-primary */
  --color-success: #34d399; /* bg-success, text-success, border-success */
  --color-warning: #fbbf24; /* bg-warning, text-warning, border-warning */
  --color-danger: #f43f5e; /* bg-danger, text-danger, border-danger */
  --color-destructive: #f43f5e; /* bg-destructive (compatibilidad shadcn/ui) */

  /* Colores de Fondo */
  --color-background: #120a1f; /* bg-background */
  --color-card: #1e1433; /* bg-card */
  --color-muted: #2a1f42; /* bg-muted */
  --color-input: #2a1f42; /* bg-input */
  --color-hover: #332952; /* bg-hover */

  /* Colores de Texto */
  --color-foreground: #f5f3ff; /* text-foreground */
  --color-muted-foreground: #a78bce; /* text-muted-foreground */
  --color-card-foreground: #f5f3ff; /* text-card-foreground */
  --color-primary-foreground: #f5f3ff; /* text-primary-foreground */

  /* Colores de Borde */
  --color-border: #2a1f42; /* border-border */
  --color-ring: #a855f7; /* ring-ring (focus ring) */

  /* Border Radius */
  --radius-sm: 12px; /* rounded-sm */
  --radius-md: 16px; /* rounded-md */
  --radius-lg: 20px; /* rounded-lg */
  --radius-xl: 24px; /* rounded-xl */
  --radius-2xl: 32px; /* rounded-2xl */
  --radius-full: 9999px; /* rounded-full */

  /* Sombras */
  --shadow-sm: 0 2px 8px rgba(168, 85, 247, 0.08); /* shadow-sm */
  --shadow-md: 0 4px 16px rgba(168, 85, 247, 0.12); /* shadow-md */
  --shadow-lg: 0 8px 24px rgba(168, 85, 247, 0.16); /* shadow-lg */
  --shadow-xl: 0 12px 32px rgba(168, 85, 247, 0.2); /* shadow-xl */
}
```

## Cómo Sobreescribir Colores

### 1. Sobreescribir un Color Existente

Para cambiar un color existente, simplemente actualiza su valor en el bloque `@theme`:

```css
@theme {
  /* Cambiar el color primary de violeta a azul */
  --color-primary: #3b82f6; /* Azul en lugar de violeta */
}
```

### 2. Agregar un Nuevo Color

Para agregar un nuevo color semántico (por ejemplo, `info`):

```css
@theme {
  /* Agregar color info */
  --color-info: #06b6d4; /* Ahora puedes usar bg-info, text-info, etc. */
}
```

### 3. Crear Variantes de un Color

Puedes crear variantes usando la sintaxis de Tailwind con opacidad:

```css
@theme {
  --color-primary: #a855f7;
  --color-primary-hover: #9333ea; /* Variante para hover */
  --color-primary-light: #c084fc; /* Variante clara */
}
```

## Uso de Clases Estándar

### Colores de Fondo

```tsx
// ❌ Antes (usando var())
<div className="bg-[var(--color-primary)]">
<div className="bg-[var(--color-bg-card)]">
<div className="bg-[var(--color-success)]/20">

// ✅ Ahora (usando clases estándar)
<div className="bg-primary">
<div className="bg-card">
<div className="bg-success/20">
```

### Colores de Texto

```tsx
// ❌ Antes
<p className="text-[var(--color-text-primary)]">
<p className="text-[var(--color-text-secondary)]">

// ✅ Ahora
<p className="text-foreground">
<p className="text-muted-foreground">
```

### Colores de Borde

```tsx
// ❌ Antes
<div className="border-[var(--color-border)]">
<div className="border-[var(--color-success)]/30">

// ✅ Ahora
<div className="border-border">
<div className="border-success/30">
```

### Border Radius

```tsx
// ❌ Antes
<button className="rounded-[var(--radius-md)]">
<div className="rounded-[var(--radius-xl)]">

// ✅ Ahora
<button className="rounded-md">
<div className="rounded-xl">
```

### Sombras

```tsx
// ❌ Antes
<div className="shadow-[var(--shadow-sm)]">
<div className="shadow-[var(--shadow-md)]">

// ✅ Ahora
<div className="shadow-sm">
<div className="shadow-md">
```

## Mapeo Completo de Colores

### Colores Semánticos

| Variable CSS          | Clase Tailwind                                 | Uso                      |
| --------------------- | ---------------------------------------------- | ------------------------ |
| `--color-primary`     | `bg-primary`, `text-primary`, `border-primary` | Color principal del tema |
| `--color-success`     | `bg-success`, `text-success`, `border-success` | Estados de éxito         |
| `--color-warning`     | `bg-warning`, `text-warning`, `border-warning` | Advertencias             |
| `--color-danger`      | `bg-danger`, `text-danger`, `border-danger`    | Errores/peligro          |
| `--color-destructive` | `bg-destructive`, `text-destructive`           | Compatibilidad shadcn/ui |

### Colores de Fondo

| Variable CSS         | Clase Tailwind  | Uso                              |
| -------------------- | --------------- | -------------------------------- |
| `--color-background` | `bg-background` | Fondo principal de la aplicación |
| `--color-card`       | `bg-card`       | Fondo de tarjetas                |
| `--color-muted`      | `bg-muted`      | Fondo para elementos secundarios |
| `--color-input`      | `bg-input`      | Fondo de inputs                  |
| `--color-hover`      | `bg-hover`      | Fondo en estados hover           |

### Colores de Texto

| Variable CSS                 | Clase Tailwind            | Uso                       |
| ---------------------------- | ------------------------- | ------------------------- |
| `--color-foreground`         | `text-foreground`         | Texto principal           |
| `--color-muted-foreground`   | `text-muted-foreground`   | Texto secundario          |
| `--color-card-foreground`    | `text-card-foreground`    | Texto en tarjetas         |
| `--color-primary-foreground` | `text-primary-foreground` | Texto sobre fondo primary |

### Border Radius

| Variable CSS    | Clase Tailwind | Uso                         |
| --------------- | -------------- | --------------------------- |
| `--radius-sm`   | `rounded-sm`   | Elementos pequeños (badges) |
| `--radius-md`   | `rounded-md`   | Botones, inputs             |
| `--radius-lg`   | `rounded-lg`   | Tarjetas pequeñas           |
| `--radius-xl`   | `rounded-xl`   | Tarjetas grandes            |
| `--radius-2xl`  | `rounded-2xl`  | Modales, diálogos           |
| `--radius-full` | `rounded-full` | Elementos circulares        |

### Sombras

| Variable CSS  | Clase Tailwind | Uso                   |
| ------------- | -------------- | --------------------- |
| `--shadow-sm` | `shadow-sm`    | Sombras pequeñas      |
| `--shadow-md` | `shadow-md`    | Sombras medianas      |
| `--shadow-lg` | `shadow-lg`    | Sombras grandes       |
| `--shadow-xl` | `shadow-xl`    | Sombras extra grandes |

## Ejemplos de Uso en Componentes

### Botón con Color Primary

```tsx
// ✅ Usando clases estándar
<button className="bg-primary text-primary-foreground hover:bg-primary-hover rounded-md shadow-sm">Click me</button>
```

### Badge con Color Success

```tsx
// ✅ Usando clases estándar
<span className="bg-success/20 text-success border-success/30 rounded-sm">Success</span>
```

### Card con Estilos

```tsx
// ✅ Usando clases estándar
<div className="bg-card text-card-foreground border-border rounded-xl shadow-md p-6">Card content</div>
```

### Input con Focus

```tsx
// ✅ Usando clases estándar
<input className="bg-input text-foreground border-border rounded-md focus:ring-ring focus:ring-2" />
```

## Opacidad con Colores

Tailwind permite usar opacidad directamente con los colores:

```tsx
// Opacidad del 20%
<div className="bg-primary/20">
<div className="bg-success/20">
<div className="border-warning/30">

// Opacidad del 50%
<div className="bg-danger/50">
<div className="text-primary/50">
```

## Migración de `var(--color-*)` a Clases Estándar

### Patrones Comunes de Reemplazo

| Antes (var)                          | Después (clase estándar)                   |
| ------------------------------------ | ------------------------------------------ |
| `bg-[var(--color-primary)]`          | `bg-primary`                               |
| `bg-[var(--color-primary-hover)]`    | `bg-primary-hover` o `hover:bg-primary/90` |
| `text-[var(--color-text-primary)]`   | `text-foreground`                          |
| `text-[var(--color-text-secondary)]` | `text-muted-foreground`                    |
| `border-[var(--color-border)]`       | `border-border`                            |
| `border-[var(--color-success)]/30`   | `border-success/30`                        |
| `rounded-[var(--radius-md)]`         | `rounded-md`                               |
| `shadow-[var(--shadow-sm)]`          | `shadow-sm`                                |
| `bg-[var(--color-bg-card)]`          | `bg-card`                                  |
| `bg-[var(--color-bg-input)]`         | `bg-input` o `bg-muted`                    |
| `bg-[var(--color-success)]/20`       | `bg-success/20`                            |

## Notas Importantes

1. **Compatibilidad shadcn/ui**: Las variables CSS estándar (`--primary`, `--foreground`, etc.) se mantienen en `:root` para compatibilidad con componentes de shadcn/ui.

2. **Opacidad**: Los colores con opacidad (ej: `/20`, `/30`) funcionan directamente con las clases de Tailwind sin necesidad de `var()`.

3. **Hover States**: Para estados hover, puedes usar `hover:bg-primary/90` o definir variantes específicas como `--color-primary-hover`.

4. **Focus Ring**: El color del ring de focus se controla con `--color-ring` y se usa con `focus:ring-ring`.

5. **Consistencia**: Siempre usa las clases estándar de Tailwind en lugar de `var()` para mejor rendimiento y mantenibilidad.
