
export type Set = {
  reps: number;
  weight: number;
};

export type Exercise = {
  id: string;
  name: string;
  sets: Set[];
};

export type WorkoutType = 'A' | 'B';

export type Workout = {
  id: string;
  date: string;
  type: WorkoutType;
  exercises: Exercise[];
  userWeight?: number;
};

export type Tab = 'dashboard' | 'history' | 'analytics' | 'add' | 'settings';
