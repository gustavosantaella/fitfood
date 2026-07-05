import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { Config } from '@/constants/Config';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  weight_goal: number | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
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
    // Check active session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
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
            daily_calorie_goal: Config.nutrition.defaultCalorieGoal,
            daily_protein_goal: Config.nutrition.defaultProteinGoal,
            daily_carbs_goal: Config.nutrition.defaultCarbsGoal,
            daily_fat_goal: Config.nutrition.defaultFatGoal,
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
        daily_calorie_goal: Config.nutrition.defaultCalorieGoal,
        daily_protein_goal: Config.nutrition.defaultProteinGoal,
        daily_carbs_goal: Config.nutrition.defaultCarbsGoal,
        daily_fat_goal: Config.nutrition.defaultFatGoal,
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
        daily_calorie_goal: Config.nutrition.defaultCalorieGoal,
        daily_protein_goal: Config.nutrition.defaultProteinGoal,
        daily_carbs_goal: Config.nutrition.defaultCarbsGoal,
        daily_fat_goal: Config.nutrition.defaultFatGoal,
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
