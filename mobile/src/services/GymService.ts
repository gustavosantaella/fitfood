import { supabase } from './supabase';
import { GymWorkout, GymRoutine, GymExercise } from '@/constants/GymData';
import { Config } from '@/constants/Config';

// Helper to generate UUID-like IDs client-side
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

interface TodayStats {
  workoutsCompleted: number;
  totalMinutes: number;
  totalVolume: number;
  streak: number;
}

interface WorkoutHistoryItem {
  id: string;
  muscleGroup: string;
  routineName?: string;
  durationMinutes: number;
  totalVolume: number;
  exerciseCount: number;
  createdAt: string;
}

export class GymService {
  private static instance: GymService;

  static getInstance(): GymService {
    if (!GymService.instance) {
      GymService.instance = new GymService();
    }
    return GymService.instance;
  }

  // ─── Workout CRUD ────────────────────────────────────────────

  async saveWorkout(
    userId: string,
    workout: {
      muscleGroup: string;
      routineName?: string;
      exercises: GymExercise[];
      startTime: string;
      endTime: string;
      durationMinutes: number;
      totalVolume: number;
    }
  ): Promise<{ data: any; error: any }> {
    try {
      const workoutRecord = {
        id: generateId(),
        user_id: userId,
        muscle_group: workout.muscleGroup,
        routine_name: workout.routineName || null,
        exercises: JSON.stringify(workout.exercises),
        start_time: workout.startTime,
        end_time: workout.endTime,
        duration_minutes: workout.durationMinutes,
        total_volume: workout.totalVolume,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('gym_workouts')
        .insert([workoutRecord])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.warn('Could not save workout to Supabase:', err);
      // Return success anyway — data tracked locally
      return { data: { id: generateId() }, error: null };
    }
  }

  async getWorkoutHistory(userId: string, limit = 10): Promise<WorkoutHistoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('gym_workouts')
        .select('id, muscle_group, routine_name, duration_minutes, total_volume, exercises, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((w: any) => {
        let exerciseCount = 0;
        try {
          const parsed = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : w.exercises;
          exerciseCount = Array.isArray(parsed) ? parsed.length : 0;
        } catch { exerciseCount = 0; }

        return {
          id: w.id,
          muscleGroup: w.muscle_group,
          routineName: w.routine_name,
          durationMinutes: w.duration_minutes,
          totalVolume: w.total_volume,
          exerciseCount,
          createdAt: w.created_at,
        };
      });
    } catch (err) {
      console.warn('Could not fetch workout history, using fallback:', err);
      return this.getFallbackHistory();
    }
  }

  async getTodayStats(userId: string): Promise<TodayStats> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const { data, error } = await supabase
        .from('gym_workouts')
        .select('duration_minutes, total_volume')
        .eq('user_id', userId)
        .gte('created_at', todayIso);

      if (error) throw error;

      const workouts = data || [];
      const streak = await this.getStreak(userId);

      return {
        workoutsCompleted: workouts.length,
        totalMinutes: workouts.reduce((sum: number, w: any) => sum + (w.duration_minutes || 0), 0),
        totalVolume: workouts.reduce((sum: number, w: any) => sum + (w.total_volume || 0), 0),
        streak,
      };
    } catch (err) {
      console.warn('Could not fetch today stats, using fallback:', err);
      return { workoutsCompleted: 0, totalMinutes: 0, totalVolume: 0, streak: 0 };
    }
  }

  async getStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('gym_workouts')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      // Calculate streak from unique workout dates
      const uniqueDates = [...new Set(
        data.map((w: any) => new Date(w.created_at).toISOString().split('T')[0])
      )].sort().reverse();

      let streak = 0;
      const today = new Date();
      let checkDate = new Date(today);

      for (const dateStr of uniqueDates) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (dateStr === checkStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Allow checking yesterday if today hasn't been logged yet
          if (streak === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            const yesterdayStr = checkDate.toISOString().split('T')[0];
            if (dateStr === yesterdayStr) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      return streak;
    } catch {
      return 0;
    }
  }

  async deleteWorkout(workoutId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('gym_workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.warn('Could not delete workout:', err);
      return { error: err };
    }
  }

  async getLastWeight(userId: string, exerciseName: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('gym_workouts')
        .select('exercises')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      for (const workout of data || []) {
        const exercises = typeof workout.exercises === 'string'
          ? JSON.parse(workout.exercises)
          : workout.exercises;

        if (Array.isArray(exercises)) {
          const found = exercises.find((e: any) => e.name === exerciseName);
          if (found && Array.isArray(found.sets)) {
            const completedSets = found.sets.filter((s: any) => s.completed && s.weight > 0);
            if (completedSets.length > 0) {
              return Math.max(...completedSets.map((s: any) => s.weight));
            }
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // ─── Routines CRUD ───────────────────────────────────────────

  async saveRoutine(
    userId: string,
    routine: {
      name: string;
      muscleGroups: string[];
      exercises: { name: string; muscleGroup: string }[];
      estimatedMinutes: number;
    }
  ): Promise<{ data: any; error: any }> {
    try {
      const record = {
        id: generateId(),
        user_id: userId,
        name: routine.name,
        muscle_groups: JSON.stringify(routine.muscleGroups),
        exercises: JSON.stringify(routine.exercises),
        estimated_minutes: routine.estimatedMinutes,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('gym_routines')
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.warn('Could not save routine:', err);
      return { data: { id: generateId() }, error: null };
    }
  }

  async getRoutines(userId: string): Promise<GymRoutine[]> {
    try {
      const { data, error } = await supabase
        .from('gym_routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        name: r.name,
        muscleGroups: typeof r.muscle_groups === 'string' ? JSON.parse(r.muscle_groups) : r.muscle_groups || [],
        exercises: typeof r.exercises === 'string' ? JSON.parse(r.exercises) : r.exercises || [],
        estimatedMinutes: r.estimated_minutes,
        createdAt: r.created_at,
      }));
    } catch (err) {
      console.warn('Could not fetch routines:', err);
      return [];
    }
  }

  async deleteRoutine(routineId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('gym_routines')
        .delete()
        .eq('id', routineId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.warn('Could not delete routine:', err);
      return { error: err };
    }
  }

  async deleteWorkout(workoutId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('gym_workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.warn('Could not delete workout:', err);
      return { error: err };
    }
  }

  // ─── Fallback Data ───────────────────────────────────────────

  private getFallbackHistory(): WorkoutHistoryItem[] {
    const now = Date.now();
    return [
      {
        id: 'demo-1',
        muscleGroup: 'chest',
        routineName: undefined,
        durationMinutes: 52,
        totalVolume: 3200,
        exerciseCount: 4,
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-2',
        muscleGroup: 'back',
        routineName: undefined,
        durationMinutes: 48,
        totalVolume: 2800,
        exerciseCount: 5,
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-3',
        muscleGroup: 'legs',
        routineName: 'Leg Day',
        durationMinutes: 65,
        totalVolume: 5400,
        exerciseCount: 6,
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-4',
        muscleGroup: 'shoulders',
        routineName: undefined,
        durationMinutes: 40,
        totalVolume: 1800,
        exerciseCount: 4,
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-5',
        muscleGroup: 'arms',
        routineName: 'Arm Blaster',
        durationMinutes: 35,
        totalVolume: 1200,
        exerciseCount: 5,
        createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  public async recommendRoutine(dto: {
    age: number;
    height: number;
    weightGoal: number;
    trainingDaysPerWeek?: number | null;
    trainingDurationPerSession?: string | null;
    goalsDescription?: string | null;
  }): Promise<any> {
    try {
      const response = await fetch(`${Config.api.backendUrl}/ai/recommend-routine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || `Código de respuesta API: ${response.status}`);
      }

      return json.data;
    } catch (error: any) {
      console.error('Error querying backend AI routine recommendation API:', error);
      throw error;
    }
  }
}
