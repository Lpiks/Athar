/**
 * Athar (أَثَر) - Sovereign Islamic Luxury Design System Theme
 * 
 * Inspired by world-class Islamic typography and sacred architectural aesthetics:
 * - Velvet Obsidian / Deep Night: #0A0E13, #111720, #19222E
 * - Imperial Ottoman Gold: #C5A059, #D4AF37, #E8CA82
 * - Sacred Medina Emerald: #0D5C46, #059669, #10B981
 * - Warm Parchment Paper: #FAF6ED, #F3ECE0, ink: #241D15
 */

export const THEME = {
  colors: {
    // Canvas & Surfaces
    canvas: '#0A0E13',
    surface: '#111720',
    surfaceElevated: '#17202C',
    surfaceGlass: 'rgba(17, 23, 32, 0.85)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',

    // Accents
    gold: '#C5A059',
    goldLight: '#E8CA82',
    goldDark: '#8C7034',
    goldGlass: 'rgba(197, 160, 89, 0.15)',
    goldBorder: 'rgba(197, 160, 89, 0.3)',

    emerald: '#059669',
    emeraldDeep: '#064E3B',
    emeraldLight: '#34D399',
    emeraldGlass: 'rgba(5, 150, 105, 0.15)',
    emeraldBorder: 'rgba(16, 185, 129, 0.3)',

    // Parchment Mode for Mushaf
    parchment: '#FAF6ED',
    parchmentSurface: '#F3ECE0',
    parchmentBorder: '#E2D7C3',
    parchmentInk: '#221B13',
    parchmentGold: '#A07C36',

    // Text & Accents
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textSubtle: '#475569',
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    glowGold: {
      shadowColor: '#C5A059',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    glowEmerald: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
