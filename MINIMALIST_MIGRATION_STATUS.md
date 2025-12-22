# Minimalist Design Migration Status

## Completed Steps

### ✅ Step 1: Removed Framer Motion
- Uninstalled `framer-motion` package from dependencies
- Package removed successfully, 3 packages uninstalled

### ✅ Step 2: Updated Global Styles (index.css)
- Removed gradient color palette (secondary color removed)
- Updated color system to minimalist solid colors:
  - Primary: `#5b7fff` (soft blue)
  - Success, Warning, Danger: kept as-is
  - Background colors: simplified
  - Added border colors: `#2a3142` and `#3a4152`

### ✅ Step 3: Updated Auth Components
- **AuthScreen.tsx**: ✅ Complete
  - Removed `motion` and `AnimatePresence` imports
  - Replaced `motion.div` with standard `div`
  - Removed backdrop-blur glassmorphism
  - Changed gradient background (`bg-linear-to-tr from-primary to-secondary`) to solid `bg-primary`
  - Replaced `border-white/10` with `border-border`

- **LoginForm.tsx**: ✅ Complete
  - Removed gradient button (`bg-gradient-to-r from-primary to-secondary`)
  - Now uses solid `bg-primary hover:bg-primary/90`
  - Updated input borders to use `border-border`
  - Added `duration-150` to transitions
  - Removed icon animations (group-hover effects)

- **RegisterForm.tsx**: ✅ Complete
  - Same changes as LoginForm
  - All 3 inputs updated to use `border-border`
  - Button changed to solid primary color

### ✅ Step 4: Updated Header Component
- **Header.tsx**: ✅ Complete
  - Removed gradient text (`bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`)
  - Now uses solid `text-primary`
  - Removed backdrop-blur (`backdrop-blur-md`)
  - Changed to solid `bg-bg-card`
  - Updated borders from `border-bg-card/50` and `border-white/` to `border-border`
  - Removed shadows (`shadow-lg shadow-primary/20`)
  - Updated avatar from `bg-secondary` to `bg-primary`
  - Removed hover animation on logout icon

### ✅ Step 5: Updated Game Components

- **Lobby.tsx**: ✅ Complete
  - Removed `framer-motion` import
  - Replaced all `motion.div` with `div`
  - Removed staggered animations (delay: index * 0.05)
  - Removed backdrop-blur from cards
  - Changed gradient start button (`from-success to-primary`) to solid `bg-success hover:bg-success/90`
  - Updated host avatar badge from gradient (`from-warning to-primary`) to solid `bg-warning`
  - Updated player cards to use `border-border`
  - Removed all animation props (initial, animate, transition)

- **RoleScreen.tsx**: ✅ Complete
  - Removed `framer-motion` import
  - Replaced all `motion.div` and `motion.h3` with standard elements
  - Removed spring animations (`type: 'spring', stiffness: 200`)
  - Changed role card backgrounds from gradients to solid colors with borders:
    - Impostor: `bg-danger/20 border border-danger/40`
    - Citizen: `bg-success/20 border border-success/40`
  - Removed backdrop-blur from secret word display
  - Changed start button from gradient to solid `bg-primary hover:bg-primary/90`
  - Removed all sequential reveal animations

### ⏳ Step 6: Remaining Files to Update

**Game Components:**
1. **CluePhase.tsx** - Partially updated (sed command ran, needs verification)
   - Need to remove: motion import, motion.div elements, animations
   - Need to update: glassmorphism effects, any gradients

2. **VotingPhase.tsx** - Not yet updated
   - Remove: motion import, motion.div elements
   - Update: glassmorphism (`bg-bg-card/50 backdrop-blur-xl`), gradient vote button

3. **ResultsScreen.tsx** - Not yet updated
   - Remove: motion import, spring animations
   - Update: gradient victory badge (`from-success to-success/50`, `from-danger to-danger/50`)
   - Update: glassmorphism effects

4. **MainLayout.tsx** - Not yet updated
   - Remove: motion.main element
   - Replace with standard `main`

**Room Components:**
5. **CreateRoomModal.tsx** - Not yet updated
   - Remove: motion.div scale animation

6. **JoinRoomByCode.tsx** - Not yet updated
   - Remove: motion.div scale animation

7. **RoomDiscovery.tsx** - Not yet updated
   - Remove: motion.div from room cards

**UI Components:**
8. **src/components/ui/button.tsx** - To be checked
   - May have gradient variants to remove

9. **src/components/ui/card.tsx** - To be checked
   - Ensure solid backgrounds

**Documentation:**
10. **CLAUDE.md** - Not yet updated
    - Remove references to "premium glassmorphism"
    - Remove "gradient backgrounds" and Framer Motion from features
    - Update design goals to reflect minimalist approach

## Pattern Replacements Summary

### Gradients → Solid Colors
```tsx
// Buttons
OLD: bg-gradient-to-r from-primary to-secondary
NEW: bg-primary hover:bg-primary/90

// Text
OLD: bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent
NEW: text-primary

// Host Badge
OLD: bg-gradient-to-br from-warning to-primary
NEW: bg-warning

// Role Cards
OLD: bg-gradient-to-br from-danger to-danger/50
NEW: bg-danger/20 border border-danger/40
```

### Glassmorphism → Solid Cards
```tsx
OLD: bg-bg-card/50 backdrop-blur-xl border border-white/5
NEW: bg-bg-card border border-border

OLD: bg-bg-card/50 backdrop-blur-md border-white/10
NEW: bg-bg-card border border-border
```

### Animations → CSS Transitions
```tsx
OLD: <motion.div initial={{...}} animate={{...}} transition={{...}}>
NEW: <div className="transition-colors duration-150">

// Remove all:
- initial props
- animate props
- exit props
- transition props
- AnimatePresence wrappers
- Staggered delays
- Spring physics
```

## Next Steps

1. Complete remaining 7 component files
2. Verify build passes without errors
3. Test visual appearance
4. Update documentation
5. Clean up any remaining gradient or glassmorphism patterns

## Color Reference

```css
--color-primary: #5b7fff       /* Soft blue */
--color-success: #22c55e       /* Green */
--color-warning: #f59e0b       /* Amber */
--color-danger: #ef4444        /* Red */
--color-bg-primary: #0f172a    /* Dark navy */
--color-bg-card: #1a1f2e       /* Slightly lighter */
--color-bg-input: #2a3142      /* Input background */
--color-border: #2a3142        /* Border default */
--color-border-hover: #3a4152  /* Border hover */
```
