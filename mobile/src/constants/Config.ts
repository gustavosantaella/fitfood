export const Config = {
  appName: 'FitFood',

  // Supabase Credentials
  supabase: {
    url: 'https://xzgurflxrnnviijiswib.supabase.co',
    anonKey: 'sb_publishable_qwbJtBR3kw5SBAMzjdT-Lg_QtWfn5AB',
  },

  // Premium Minimalist Palette (Dark Mode First)
  theme: {
    colors: {
      primary: '#10B981',       // Emerald Green (freshness, health, goals)
      primaryLight: '#34D399',  // Light Emerald
      primaryDark: '#059669',   // Deep Emerald

      secondary: '#F59E0B',     // Amber/Orange (energy, workouts, progress)
      secondaryLight: '#FBBF24',

      background: '#090D16',    // Slate Black
      cardBackground: '#131C2E',// Dark Slate Charcoal (for glassmorphism)
      cardBorder: '#1E293B',    // Subtly lighter border

      text: '#FFFFFF',          // Clean White
      textSecondary: '#9CA3AF', // Muted Gray
      textMuted: '#6B7280',     // Darker Muted Gray

      error: '#EF4444',         // Soft Red
      success: '#10B981',       // Success indicator
      info: '#3B82F6',          // Soft Blue

      overlay: 'rgba(9, 13, 22, 0.8)', // Semitransparent background
      glass: 'rgba(255, 255, 255, 0.03)', // Thin white glass layer
    },

    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },

    borderRadius: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
  },

  // Default nutrition values
  nutrition: {
    defaultCalorieGoal: 2000,
    defaultProteinGoal: 140, // in g
    defaultCarbsGoal: 220,   // in g
    defaultFatGoal: 65,      // in g
  },

  // AI Analyzer configuration
  ai: {
    // If they want to integrate Gemini directly later
    geminiApiKey: '',
    // Mock response options to make the scanning demo look super professional
    mockFoods: [
      {
        food_name: 'Pechuga de Pollo con Arroz y Brócoli',
        calories: 520,
        protein: 42,
        carbs: 45,
        fat: 12,
      },
      {
        food_name: 'Ensalada César con Pollo Grill',
        calories: 380,
        protein: 28,
        carbs: 12,
        fat: 24,
      },
      {
        food_name: 'Tostadas de Aguacate con Huevo Pochado',
        calories: 350,
        protein: 14,
        carbs: 28,
        fat: 18,
      },
      {
        food_name: 'Batido de Proteína con Plátano y Avena',
        calories: 410,
        protein: 32,
        carbs: 52,
        fat: 8,
      },
      {
        food_name: 'Filete de Salmón con Espárragos',
        calories: 450,
        protein: 36,
        carbs: 8,
        fat: 28,
      }
    ]
  }
};
