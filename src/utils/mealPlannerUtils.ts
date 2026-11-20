import {
  DAYS_OF_WEEK,
  DayMeals,
  DayOfWeek,
  MEAL_TYPES,
  MealPlan,
  MealSlotEntry,
  MealType,
  NutritionInfo,
  Recipe,
  UserPreferences,
} from '../types/mealPlanner';

export const DEFAULT_PREFERENCES: UserPreferences = {
  dailyTargets: {
    calories: 2050,
    protein: 145,
    carbs: 205,
    fats: 72,
  },
  dietaryFilters: [],
  allergies: [],
  defaultServings: 1,
};

export function createEmptyDayMeals(): DayMeals {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
}

export function createEmptyMealPlan(): MealPlan {
  return {
    monday: createEmptyDayMeals(),
    tuesday: createEmptyDayMeals(),
    wednesday: createEmptyDayMeals(),
    thursday: createEmptyDayMeals(),
    friday: createEmptyDayMeals(),
    saturday: createEmptyDayMeals(),
    sunday: createEmptyDayMeals(),
  };
}

export function createStarterMealPlan(): MealPlan {
  const plan = createEmptyMealPlan();
  plan.monday = {
    breakfast: [{ id: 'mon-b-1', recipeId: 'rec-avocado-poached-eggs', servingsMultiplier: 1 }],
    lunch: [{ id: 'mon-l-1', recipeId: 'rec-mediterranean-chicken-bowl', servingsMultiplier: 1 }],
    dinner: [{ id: 'mon-d-1', recipeId: 'rec-garlic-herb-salmon-asparagus', servingsMultiplier: 1 }],
    snack: [{ id: 'mon-s-1', recipeId: 'rec-greek-yogurt-berry-parfait', servingsMultiplier: 1 }],
  };
  plan.tuesday = {
    breakfast: [{ id: 'tue-b-1', recipeId: 'rec-overnight-protein-oats', servingsMultiplier: 1 }],
    lunch: [{ id: 'tue-l-1', recipeId: 'rec-turkey-pesto-zucchini-bowl', servingsMultiplier: 1 }],
    dinner: [{ id: 'tue-d-1', recipeId: 'rec-coconut-chickpea-spinach-curry', servingsMultiplier: 1 }],
    snack: [{ id: 'tue-s-1', recipeId: 'rec-apple-almond-butter-cinnamon', servingsMultiplier: 1 }],
  };
  plan.wednesday = {
    breakfast: [{ id: 'wed-b-1', recipeId: 'rec-spinach-feta-frittata', servingsMultiplier: 1 }],
    lunch: [{ id: 'wed-l-1', recipeId: 'rec-edamame-soba-sesame-salad', servingsMultiplier: 1 }],
    dinner: [{ id: 'wed-d-1', recipeId: 'rec-garlic-steak-chimichurri-broccoli', servingsMultiplier: 1 }],
    snack: [{ id: 'wed-s-1', recipeId: 'rec-hummus-crunchy-crudites', servingsMultiplier: 1 }],
  };
  return plan;
}

export function isRecipeCompatible(recipe: Recipe, preferences: UserPreferences): boolean {
  // Check dietary filters (recipe must satisfy all active dietary filters)
  for (const tag of preferences.dietaryFilters) {
    if (!recipe.dietaryTags.includes(tag)) {
      return false;
    }
  }

  // Check allergies against recipe allergens and ingredient names
  if (preferences.allergies.length > 0) {
    const normalizedAllergies = preferences.allergies.map((a) => a.trim().toLowerCase()).filter(Boolean);
    for (const allergy of normalizedAllergies) {
      const keywords = allergy.split('/').map((k) => k.trim());
      const matchesTag = recipe.allergens.some((ra) => {
        const raLower = ra.toLowerCase();
        return keywords.some((kw) => raLower.includes(kw) || kw.includes(raLower));
      });
      if (matchesTag) return false;

      const matchesIngredient = recipe.ingredients.some((ing) => {
        const ingLower = ing.name.toLowerCase();
        return keywords.some((kw) => ingLower.includes(kw));
      });
      if (matchesIngredient) return false;
    }
  }

  return true;
}

export function calculateEntryNutrition(entry: MealSlotEntry, recipeMap: Map<string, Recipe>): NutritionInfo {
  const recipe = recipeMap.get(entry.recipeId);
  if (!recipe) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }
  const factor = entry.servingsMultiplier / (recipe.servings || 1);
  return {
    calories: Math.round(recipe.nutrition.calories * factor),
    protein: Math.round(recipe.nutrition.protein * factor),
    carbs: Math.round(recipe.nutrition.carbs * factor),
    fats: Math.round(recipe.nutrition.fats * factor),
  };
}

export function calculateDayNutrition(dayMeals: DayMeals, recipeMap: Map<string, Recipe>): NutritionInfo {
  const total: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  for (const mealType of MEAL_TYPES) {
    for (const entry of dayMeals[mealType.key]) {
      const n = calculateEntryNutrition(entry, recipeMap);
      total.calories += n.calories;
      total.protein += n.protein;
      total.carbs += n.carbs;
      total.fats += n.fats;
    }
  }
  return total;
}

export function countPlannedMeals(mealPlan: MealPlan): number {
  let count = 0;
  for (const day of DAYS_OF_WEEK) {
    for (const mealType of MEAL_TYPES) {
      count += mealPlan[day.key][mealType.key].length;
    }
  }
  return count;
}

export function autoFillMealPlan(
  currentPlan: MealPlan,
  recipes: Recipe[],
  preferences: UserPreferences,
  mode: 'fill-empty' | 'regenerate-all'
): { nextPlan: MealPlan; warning?: string } {
  const compatible = recipes.filter((r) => isRecipeCompatible(r, preferences));
  if (compatible.length === 0) {
    return {
      nextPlan: currentPlan,
      warning: 'No recipes match your current dietary filters and allergy exclusions. Relax a filter or add a custom recipe.',
    };
  }

  const nextPlan: MealPlan = createEmptyMealPlan();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  // Copy existing meals if fill-empty
  for (const day of DAYS_OF_WEEK) {
    for (const meal of MEAL_TYPES) {
      if (mode === 'fill-empty') {
        nextPlan[day.key][meal.key] = [...currentPlan[day.key][meal.key]];
      }
    }
  }

  const lastUsedByMealType: Record<MealType, string | null> = {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  };

  for (const day of DAYS_OF_WEEK) {
    const dayMeals = nextPlan[day.key];
    let currentDayCalories = calculateDayNutrition(dayMeals, recipeMap).calories;
    const emptySlots = MEAL_TYPES.filter((m) => dayMeals[m.key].length === 0);

    for (let i = 0; i < emptySlots.length; i++) {
      const slot = emptySlots[i];
      const remainingSlotsCount = emptySlots.length - i;
      const remainingCalories = Math.max(200, preferences.dailyTargets.calories - currentDayCalories);
      const targetForSlot =
        remainingSlotsCount === 1
          ? remainingCalories
          : Math.round(preferences.dailyTargets.calories * slot.targetShare);

      // Candidates for this meal type, falling back to any compatible recipe if none tagged specifically
      let pool = compatible.filter((r) => r.mealTypes.includes(slot.key));
      if (pool.length === 0) {
        pool = compatible;
      }

      // Avoid repeating the previous day's choice when alternatives exist
      const nonRepeating = pool.filter((r) => r.id !== lastUsedByMealType[slot.key]);
      const candidates = nonRepeating.length > 0 ? nonRepeating : pool;

      // Score candidates by calorie proximity + slight randomness for variety
      const scored = candidates
        .map((recipe) => {
          const perServingCal = recipe.nutrition.calories / (recipe.servings || 1);
          const calDiff = Math.abs(perServingCal - targetForSlot);
          const jitter = Math.random() * 95;
          return { recipe, score: calDiff + jitter };
        })
        .sort((a, b) => a.score - b.score);

      const chosen = scored[0].recipe;
      lastUsedByMealType[slot.key] = chosen.id;

      const entry: MealSlotEntry = {
        id: `${day.key}-${slot.key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        recipeId: chosen.id,
        servingsMultiplier: preferences.defaultServings || 1,
      };

      dayMeals[slot.key].push(entry);
      currentDayCalories += calculateEntryNutrition(entry, recipeMap).calories;
    }
  }

  return { nextPlan };
}

export function swapMealSlots(
  plan: MealPlan,
  source: { day: DayOfWeek; mealType: MealType; entryId: string },
  target: { day: DayOfWeek; mealType: MealType }
): MealPlan {
  const next: MealPlan = { ...plan };
  const sourceEntries = [...next[source.day][source.mealType]];
  const sourceIdx = sourceEntries.findIndex((e) => e.id === source.entryId);
  if (sourceIdx === -1) return plan;

  const [movedEntry] = sourceEntries.splice(sourceIdx, 1);

  if (source.day === target.day && source.mealType === target.mealType) {
    return plan;
  }

  const targetEntries = [...next[target.day][target.mealType]];

  // If target slot already has an entry, swap the first target entry back into source slot
  if (targetEntries.length > 0) {
    const displaced = targetEntries.shift()!;
    sourceEntries.push(displaced);
  }
  targetEntries.unshift(movedEntry);

  next[source.day] = { ...next[source.day], [source.mealType]: sourceEntries };
  next[target.day] = { ...next[target.day], [target.mealType]: targetEntries };
  return next;
}
