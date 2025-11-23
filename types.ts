export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  saturatedFats: number;
  sugars: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  timestamp: number;
  macros: MacroNutrients;
  verdict?: string; // The 1-sentence AI analysis
  imageUri?: string;
}

export interface DailyAnalysis {
  verdict: string; // "Good Day" or "Needs Improvement"
  summary: string;
  dos: string[];
  donts: string[];
}

export interface DailyLog {
  date: string; // ISO date string YYYY-MM-DD
  entries: FoodEntry[];
  weight?: number;
  notes?: string;
  analysis?: DailyAnalysis; // Cache the AI analysis
}

export interface UserProfile {
  username: string;
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  currentWeight: number;
  targetWeight: number;
  dailyCalorieLimit: number; // Calculated automatically
  activityLevel: 'sedentary'; // Hardcoded as per rules
}

// AI Response Types
export interface FoodAssessment {
  isSpecific: boolean;
  clarifyingQuestions?: string[];
  estimatedMacros?: MacroNutrients;
  foodName?: string;
}

export interface AdvisorResult {
  recommendation: "Yes" | "No";
  reason: string;
}

export interface HealthyAlternativeResult {
  originalFood: string;
  healthierAlternative: string;
  whyItIsBetter: string;
  calorieDifference: number; // Approximate savings
}

export enum AppView {
  TRACKER = 'TRACKER',
  ADVISOR = 'ADVISOR',
  ALTERNATIVES = 'ALTERNATIVES',
  HISTORY = 'HISTORY',
  REPORTS = 'REPORTS'
}