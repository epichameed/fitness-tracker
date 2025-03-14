export type Goal = 'weight-loss' | 'weight-gain' | 'muscle-gain' | 'maintenance';

export interface PersonalData {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: Goal;
}

export interface BodyCalculations {
  bmi: {
    value: number;
    category: string;
    message: string;
  };
  bmr: number;
  tdee: number;
  recommendations: string[];
}

export interface MacroTarget {
  nutrient: string;
  amount: number;
  details: string;
}

export interface Meal {
  name: string;
  time: string;
  recipe: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface DayPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

export interface MealPlan {
  affordable: {
    [key: string]: DayPlan;
  };
  premium: {
    [key: string]: DayPlan;
  };
}

export interface PriceSource {
  website: string;
  price: number;
  url: string;
  lastUpdated: string;
}

export interface PriceAnalysis {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  priceRange: number;
  isCurrentPriceCompetitive: boolean;
  potentialSavings: number;
}

export interface PriceComparison {
  currentPrice: number;
  alternativePrices: PriceSource[];
  loading: boolean;
  error?: string;
  analysis?: PriceAnalysis;
}

export interface GroceryItem {
  item: string;
  quantity: number;
  unit: string;
  price: number;
  notes?: string;
  priceSearchQuery?: string;
  priceComparison?: PriceComparison;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes?: string;
}

export interface DayWorkout {
  day: string;
  focus: string;
  exercises: WorkoutExercise[];
}