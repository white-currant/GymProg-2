
export type WorkoutSet = {
  reps: number;
  weight: number;
};

export type Exercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
};

export type WorkoutType = 'A' | 'B';

export type Workout = {
  id: string;
  date: string;
  type: WorkoutType;
  exercises: Exercise[];
  userWeight?: number;
  duration?: number;
};

export type UserProfile = {
  name: string;
  email: string;
  picture: string;
};

export type Tab = 'dashboard' | 'history' | 'analytics' | 'add' | 'settings';
