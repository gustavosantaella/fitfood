import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { Config } from '@/constants/Config';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  weight_goal: number | null;
  height: number | null;
  birth_date: string | null;
  age: number;
  training_days_per_week: number | null;
  training_duration_per_session: string | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  daily_water_goal?: number | null;
  daily_sugar_limit?: number | null;
  goals_description?: string | null;
  onboarding_completed: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Verify session token with server to check if user still exists
        const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
        if (error || !verifiedUser) {
          console.warn('Session verification failed (user may have been deleted):', error);
          // Clear invalid session locally first so router redirects immediately
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          try {
            await supabase.auth.signOut();
          } catch (signOutErr) {
            console.warn('Error calling signOut during session verification:', signOutErr);
          }
          return;
        }

        setSession(session);
        setUser(verifiedUser);
        await fetchProfile(verifiedUser.id);
      } catch (err) {
        console.error('Error verifying user session:', err);
        setLoading(false);
      }
    };

    checkUserSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Double-check with server on state change
        const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
        if (error || !verifiedUser) {
          console.warn('onAuthStateChange: User verification failed', error);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          try {
            await supabase.auth.signOut();
          } catch (signOutErr) {
            console.warn('Error calling signOut during auth state change verification:', signOutErr);
          }
          return;
        }
        setSession(session);
        setUser(verifiedUser);
        fetchProfile(verifiedUser.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet, we will create it
          const newProfile = {
            id: userId,
            email: user?.email || '',
            full_name: '',
            weight_goal: null,
            height: null,
            birth_date: null,
            age: 0,
            training_days_per_week: null,
            training_duration_per_session: null,
            daily_calorie_goal: Config.nutrition.defaultCalorieGoal,
            daily_protein_goal: Config.nutrition.defaultProteinGoal,
            daily_carbs_goal: Config.nutrition.defaultCarbsGoal,
            daily_fat_goal: Config.nutrition.defaultFatGoal,
            daily_water_goal: 2000,
            daily_sugar_limit: 50,
            goals_description: null,
            onboarding_completed: false,
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);
            
          if (!insertError) {
            setProfile(newProfile);
          } else {
            console.error('Error creating default profile:', insertError);
            // Fallback to local profile state so the app doesn't break
            setProfile(newProfile);
          }
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback local profile in case tables aren't setup
      setProfile({
        id: userId,
        email: user?.email || '',
        full_name: 'Usuario FitFood',
        weight_goal: 70,
        height: 170,
        birth_date: '1995-01-01',
        age: 31,
        training_days_per_week: null,
        training_duration_per_session: null,
        daily_calorie_goal: Config.nutrition.defaultCalorieGoal,
        daily_protein_goal: Config.nutrition.defaultProteinGoal,
        daily_carbs_goal: Config.nutrition.defaultCarbsGoal,
        daily_fat_goal: Config.nutrition.defaultFatGoal,
        daily_water_goal: 2000,
        daily_sugar_limit: 50,
        goals_description: null,
        onboarding_completed: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setLoading(false);
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setLoading(false);
      return { error };
    }

    if (data.user) {
      // Create user profile (client-side fallback in case trigger is not set up)
      const newProfile = {
        id: data.user.id,
        email,
        full_name: fullName,
        weight_goal: null,
        height: null,
        birth_date: null,
        age: 0,
        training_days_per_week: null,
        training_duration_per_session: null,
        daily_calorie_goal: Config.nutrition.defaultCalorieGoal,
        daily_protein_goal: Config.nutrition.defaultProteinGoal,
        daily_carbs_goal: Config.nutrition.defaultCarbsGoal,
        daily_fat_goal: Config.nutrition.defaultFatGoal,
        daily_water_goal: 2000,
        daily_sugar_limit: 50,
        goals_description: null,
        onboarding_completed: false,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([newProfile]);

      if (profileError) {
        console.warn('Profile insert skipped or handled by trigger/RLS:', profileError.message);
      }
      setProfile(newProfile);
    }
    
    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No active user session') };

    const updatedProfile = { ...profile, ...updates } as Profile;
    setProfile(updatedProfile); // Optimistic UI update

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      // Rollback if DB update fails
      if (user.id) fetchProfile(user.id);
    }
    
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
