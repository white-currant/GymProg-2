
export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export type WorkoutType = 'A' | 'B';

export interface Workout {
  id: string;
  date: string;
  type: WorkoutType;
  exercises: Exercise[];
  userWeight?: number;
  duration?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export type Tab = 'dashboard' | 'history' | 'analytics' | 'add' | 'settings';
