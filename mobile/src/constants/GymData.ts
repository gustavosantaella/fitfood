// Gym Data Constants — Exercise library organized by muscle group

export interface MuscleGroup {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export interface ExerciseItem {
  name: string;
  group: string;
  isCompound: boolean; // true = multi-joint movement
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'chest', name: 'Pecho', emoji: '🏋️', color: '#EF4444', description: 'Press, aperturas y fondos' },
  { id: 'back', name: 'Espalda', emoji: '🔙', color: '#3B82F6', description: 'Jalones, remos y dominadas' },
  { id: 'legs', name: 'Piernas', emoji: '🦵', color: '#10B981', description: 'Sentadillas, prensa y peso muerto' },
  { id: 'shoulders', name: 'Hombros', emoji: '🏔️', color: '#F59E0B', description: 'Press militar y elevaciones' },
  { id: 'arms', name: 'Brazos', emoji: '💪', color: '#8B5CF6', description: 'Bíceps, tríceps y antebrazos' },
  { id: 'core', name: 'Core', emoji: '🎯', color: '#EC4899', description: 'Abdominales y oblicuos' },
  { id: 'cardio', name: 'Cardio', emoji: '🫀', color: '#06B6D4', description: 'Correr, nadar y bicicleta' },
  { id: 'fullbody', name: 'Full Body', emoji: '⚡', color: '#F97316', description: 'Entrenamiento completo' },
];

export const EXERCISES_BY_GROUP: Record<string, ExerciseItem[]> = {
  chest: [
    { name: 'Press Banca', group: 'chest', isCompound: true },
    { name: 'Press Inclinado', group: 'chest', isCompound: true },
    { name: 'Press Declinado', group: 'chest', isCompound: true },
    { name: 'Press Mancuernas Plano', group: 'chest', isCompound: true },
    { name: 'Press Mancuernas Inclinado', group: 'chest', isCompound: true },
    { name: 'Aperturas con Mancuernas', group: 'chest', isCompound: false },
    { name: 'Aperturas en Polea', group: 'chest', isCompound: false },
    { name: 'Fondos en Paralelas', group: 'chest', isCompound: true },
    { name: 'Pec Deck (Máquina)', group: 'chest', isCompound: false },
    { name: 'Flexiones de Brazos', group: 'chest', isCompound: true },
  ],
  back: [
    { name: 'Dominadas', group: 'back', isCompound: true },
    { name: 'Jalón al Pecho', group: 'back', isCompound: true },
    { name: 'Remo con Barra', group: 'back', isCompound: true },
    { name: 'Remo con Mancuerna', group: 'back', isCompound: true },
    { name: 'Remo en Polea Baja', group: 'back', isCompound: true },
    { name: 'Remo T-Bar', group: 'back', isCompound: true },
    { name: 'Peso Muerto', group: 'back', isCompound: true },
    { name: 'Pullover', group: 'back', isCompound: false },
    { name: 'Face Pull', group: 'back', isCompound: false },
    { name: 'Hiperextensiones', group: 'back', isCompound: false },
  ],
  legs: [
    { name: 'Sentadilla con Barra', group: 'legs', isCompound: true },
    { name: 'Sentadilla Frontal', group: 'legs', isCompound: true },
    { name: 'Sentadilla Búlgara', group: 'legs', isCompound: true },
    { name: 'Prensa de Piernas', group: 'legs', isCompound: true },
    { name: 'Peso Muerto Rumano', group: 'legs', isCompound: true },
    { name: 'Extensión de Cuádriceps', group: 'legs', isCompound: false },
    { name: 'Curl Femoral', group: 'legs', isCompound: false },
    { name: 'Hip Thrust', group: 'legs', isCompound: true },
    { name: 'Zancadas', group: 'legs', isCompound: true },
    { name: 'Elevación de Talones', group: 'legs', isCompound: false },
    { name: 'Sentadilla Hack', group: 'legs', isCompound: true },
    { name: 'Abductores (Máquina)', group: 'legs', isCompound: false },
    { name: 'Aductores (Máquina)', group: 'legs', isCompound: false },
  ],
  shoulders: [
    { name: 'Press Militar con Barra', group: 'shoulders', isCompound: true },
    { name: 'Press con Mancuernas', group: 'shoulders', isCompound: true },
    { name: 'Elevaciones Laterales', group: 'shoulders', isCompound: false },
    { name: 'Elevaciones Frontales', group: 'shoulders', isCompound: false },
    { name: 'Pájaros (Deltoides Posterior)', group: 'shoulders', isCompound: false },
    { name: 'Press Arnold', group: 'shoulders', isCompound: true },
    { name: 'Remo al Mentón', group: 'shoulders', isCompound: true },
    { name: 'Encogimientos (Trapecios)', group: 'shoulders', isCompound: false },
  ],
  arms: [
    { name: 'Curl con Barra', group: 'arms', isCompound: false },
    { name: 'Curl con Mancuernas', group: 'arms', isCompound: false },
    { name: 'Curl Martillo', group: 'arms', isCompound: false },
    { name: 'Curl en Banco Scott', group: 'arms', isCompound: false },
    { name: 'Curl en Polea', group: 'arms', isCompound: false },
    { name: 'Extensión de Tríceps en Polea', group: 'arms', isCompound: false },
    { name: 'Press Francés', group: 'arms', isCompound: false },
    { name: 'Fondos para Tríceps', group: 'arms', isCompound: true },
    { name: 'Patada de Tríceps', group: 'arms', isCompound: false },
    { name: 'Curl de Muñecas', group: 'arms', isCompound: false },
  ],
  core: [
    { name: 'Crunch Abdominal', group: 'core', isCompound: false },
    { name: 'Plancha', group: 'core', isCompound: false },
    { name: 'Plancha Lateral', group: 'core', isCompound: false },
    { name: 'Russian Twist', group: 'core', isCompound: false },
    { name: 'Elevación de Piernas', group: 'core', isCompound: false },
    { name: 'Ab Wheel (Rueda)', group: 'core', isCompound: false },
    { name: 'Mountain Climbers', group: 'core', isCompound: false },
    { name: 'Cable Crunch', group: 'core', isCompound: false },
    { name: 'Dead Bug', group: 'core', isCompound: false },
    { name: 'Hollow Hold', group: 'core', isCompound: false },
  ],
  cardio: [
    { name: 'Caminadora', group: 'cardio', isCompound: true },
    { name: 'Bicicleta Estática', group: 'cardio', isCompound: true },
    { name: 'Elíptica', group: 'cardio', isCompound: true },
    { name: 'Remo (Máquina)', group: 'cardio', isCompound: true },
    { name: 'Saltar la Cuerda', group: 'cardio', isCompound: true },
    { name: 'HIIT', group: 'cardio', isCompound: true },
    { name: 'Escaladora', group: 'cardio', isCompound: true },
    { name: 'Natación', group: 'cardio', isCompound: true },
    { name: 'Correr al Aire Libre', group: 'cardio', isCompound: true },
  ],
  fullbody: [
    { name: 'Burpees', group: 'fullbody', isCompound: true },
    { name: 'Thrusters', group: 'fullbody', isCompound: true },
    { name: 'Clean & Press', group: 'fullbody', isCompound: true },
    { name: 'Snatch con Mancuerna', group: 'fullbody', isCompound: true },
    { name: 'Kettlebell Swing', group: 'fullbody', isCompound: true },
    { name: 'Turkish Get Up', group: 'fullbody', isCompound: true },
    { name: 'Man Makers', group: 'fullbody', isCompound: true },
    { name: 'Battle Ropes', group: 'fullbody', isCompound: true },
  ],
};

// Get all exercises flattened
export const getAllExercises = (): ExerciseItem[] => {
  return Object.values(EXERCISES_BY_GROUP).flat();
};

// Search exercises by name
export const searchExercises = (query: string, groupFilter?: string): ExerciseItem[] => {
  let exercises = groupFilter
    ? EXERCISES_BY_GROUP[groupFilter] || []
    : getAllExercises();

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    exercises = exercises.filter(e => e.name.toLowerCase().includes(q));
  }

  return exercises;
};

// Motivational phrases
export const GYM_MOTIVATIONAL_PHRASES = [
  '¡Hoy es día de conquistar! 🔥',
  '¡No pain, no gain! 💪',
  '¡Un set más, una versión mejor! ⚡',
  '¡Tu único límite eres tú! 🚀',
  '¡Dale con todo hoy! 🏆',
  '¡Cada rep cuenta! 💯',
  '¡Supera tu récord personal! 🎯',
  '¡El hierro no se levanta solo! 🏋️',
];

export const getRandomMotivation = (): string => {
  return GYM_MOTIVATIONAL_PHRASES[Math.floor(Math.random() * GYM_MOTIVATIONAL_PHRASES.length)];
};

// Interfaces for Gym Workout data
export interface GymSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface GymExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: GymSet[];
  notes?: string;
}

export interface GymWorkout {
  id: string;
  userId: string;
  muscleGroup: string;
  routineName?: string;
  exercises: GymExercise[];
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  totalVolume: number; // kg × reps
  createdAt: string;
}

export interface GymRoutine {
  id: string;
  userId: string;
  name: string;
  muscleGroups: string[];
  exercises: { name: string; muscleGroup: string }[];
  estimatedMinutes: number;
  createdAt: string;
}
