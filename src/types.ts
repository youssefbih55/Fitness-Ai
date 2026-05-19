export interface UserData {
  age: number;
  gender: string;
  height: number;
  weight: number;
  bodyFat?: string;
  goal: string;
  experience: string;
  trainingDays: number;
  sessionDuration: number;
  location: string;
  equipment: string;
  injuries: string;
  bodyType: string;
  allergies: string;
  preferences: string;
  budget: string;
  mealsPerDay: number;
  sleepHours: number;
  activityLevel: string;
}

export interface Analysis {
  bmi: number;
  tdee: number;
  proteinNeeds: number;
  bodyTypeAnalysis: string;
  strengthsWeaknesses: string;
  estimatedTime?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscleGroup?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  title: string;
  exercises: Exercise[];
  cardio?: string;
  tips?: string;
}

export interface Meal {
  name: string;
  description: string;
  calories: number;
  alternatives?: string;
}

export interface NutritionPlan {
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: Meal[];
  generalTips?: string;
}

export interface FullPlan {
  analysis: Analysis;
  workoutPlan: {
    summary: string;
    days: WorkoutDay[];
  };
  nutritionPlan: NutritionPlan;
}
