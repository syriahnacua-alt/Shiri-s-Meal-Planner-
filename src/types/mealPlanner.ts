export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type DietaryTag =
  | 'Vegetarian'
  | 'Vegan'
  | 'Keto'
  | 'Gluten-Free'
  | 'Dairy-Free'
  | 'High-Protein';

export type GroceryAisle =
  | 'Produce'
  | 'Proteins'
  | 'Dairy'
  | 'Pantry'
  | 'Spices';

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: GroceryAisle;
  notes?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  mealTypes: MealType[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: NutritionInfo;
  dietaryTags: DietaryTag[];
  allergens: string[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface MealSlotEntry {
  id: string;
  recipeId: string;
  servingsMultiplier: number;
  notes?: string;
}

export type DayMeals = Record<MealType, MealSlotEntry[]>;

export type MealPlan = Record<DayOfWeek, DayMeals>;

export interface UserPreferences {
  dailyTargets: NutritionInfo;
  dietaryFilters: DietaryTag[];
  allergies: string[];
  defaultServings: number;
}

export interface CustomGroceryItem {
  id: string;
  name: string;
  quantity: string;
  aisle: GroceryAisle;
  checked: boolean;
}

export interface AggregatedGroceryItem {
  key: string;
  name: string;
  totalAmount: number;
  unit: string;
  displayQuantity: string;
  aisle: GroceryAisle;
  sources: string[];
  checked: boolean;
}

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string; shortLabel: string }[] = [
  { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' },
];

export const MEAL_TYPES: { key: MealType; label: string; targetShare: number }[] = [
  { key: 'breakfast', label: 'Breakfast', targetShare: 0.24 },
  { key: 'lunch', label: 'Lunch', targetShare: 0.30 },
  { key: 'dinner', label: 'Dinner', targetShare: 0.34 },
  { key: 'snack', label: 'Snacks', targetShare: 0.12 },
];

export const DIETARY_TAGS: DietaryTag[] = [
  'Vegetarian',
  'Vegan',
  'Keto',
  'Gluten-Free',
  'Dairy-Free',
  'High-Protein',
];

export const GROCERY_AISLES: GroceryAisle[] = [
  'Produce',
  'Proteins',
  'Dairy',
  'Pantry',
  'Spices',
];

export const COMMON_ALLERGENS: string[] = [
  'Dairy',
  'Eggs',
  'Gluten / Wheat',
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
];

export const MEAL_BANNER_IMAGES: Record<MealType, string> = {
  breakfast: '/src/assets/images/meal_breakfast_banner_1795173002909.jpg',
  lunch: '/src/assets/images/meal_lunch_banner_1795173001960.jpg',
  dinner: '/src/assets/images/meal_dinner_banner_1795173002567.jpg',
  snack: '/src/assets/images/meal_snack_banner_1795173003732.jpg',
};
