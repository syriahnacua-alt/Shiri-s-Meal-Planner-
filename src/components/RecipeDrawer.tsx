import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  DAYS_OF_WEEK,
  DIETARY_TAGS,
  DayOfWeek,
  DietaryTag,
  MEAL_TYPES,
  MealType,
  Recipe,
  UserPreferences,
} from '../types/mealPlanner';
import { isRecipeCompatible } from '../utils/mealPlannerUtils';

interface RecipeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  preferences: UserPreferences;
  targetSlot: {
    day: DayOfWeek;
    mealType: MealType;
    swapEntryId?: string;
  } | null;
  onSelectRecipe: (recipe: Recipe, day: DayOfWeek, mealType: MealType, swapEntryId?: string) => void;
  onViewRecipe: (recipe: Recipe) => void;
  onOpenNewRecipe: () => void;
}

export function RecipeDrawer({
  isOpen,
  onClose,
  recipes,
  preferences,
  targetSlot,
  onSelectRecipe,
  onViewRecipe,
  onOpenNewRecipe,
}: RecipeDrawerProps) {
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>(targetSlot?.mealType ?? 'all');
  const [selectedDietary, setSelectedDietary] = useState<DietaryTag[]>([]);
  const [onlyCompatible, setOnlyCompatible] = useState(true);
  const [maxPrep, setMaxPrep] = useState<number | null>(null);
  const [quickDay, setQuickDay] = useState<DayOfWeek>(targetSlot?.day ?? 'monday');
  const [quickMeal, setQuickMeal] = useState<MealType>(targetSlot?.mealType ?? 'dinner');

  useEffect(() => {
    if (isOpen) {
      setMealFilter(targetSlot?.mealType ?? 'all');
      if (targetSlot) {
        setQuickDay(targetSlot.day);
        setQuickMeal(targetSlot.mealType);
      }
    }
  }, [isOpen, targetSlot]);

  const activeDay = targetSlot?.day ?? quickDay;
  const activeMeal = targetSlot?.mealType ?? quickMeal;

  const toggleDietary = (tag: DietaryTag) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      if (onlyCompatible && !isRecipeCompatible(recipe, preferences)) {
        return false;
      }
      if (mealFilter !== 'all' && !recipe.mealTypes.includes(mealFilter)) {
        return false;
      }
      if (selectedDietary.length > 0) {
        const hasAll = selectedDietary.every((tag) => recipe.dietaryTags.includes(tag));
        if (!hasAll) return false;
      }
      if (maxPrep !== null && recipe.prepTimeMinutes + recipe.cookTimeMinutes > maxPrep) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesDesc = recipe.description.toLowerCase().includes(q);
        const matchesIng = recipe.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesIng) return false;
      }
      return true;
    });
  }, [recipes, onlyCompatible, preferences, targetSlot, mealFilter, selectedDietary, maxPrep, search]);

  const targetDayLabel = DAYS_OF_WEEK.find((d) => d.key === activeDay)?.label ?? 'Monday';
  const targetMealLabel = MEAL_TYPES.find((m) => m.key === activeMeal)?.label ?? 'Dinner';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label="Recipe drawer">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/30 backdrop-blur-[1px]"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg bg-white h-full border-l border-stone-200 flex flex-col shadow-xl"
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-stone-900">
                  {targetSlot?.swapEntryId
                    ? `Swap ${targetDayLabel} ${targetMealLabel}`
                    : targetSlot
                      ? `Add to ${targetDayLabel} ${targetMealLabel}`
                      : 'Quick-Add Recipes'}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {filteredRecipes.length} matching {filteredRecipes.length === 1 ? 'recipe' : 'recipes'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close recipe drawer"
                className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Destination selector when opened as general Recipe Drawer */}
            {!targetSlot && (
              <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex items-center gap-2">
                <span className="text-xs font-medium text-stone-600 shrink-0">Schedule to:</span>
                <select
                  aria-label="Select day to add recipe"
                  value={quickDay}
                  onChange={(e) => setQuickDay(e.target.value as DayOfWeek)}
                  className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Select meal slot to add recipe"
                  value={quickMeal}
                  onChange={(e) => setQuickMeal(e.target.value as MealType)}
                  className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search & Filters */}
            <div className="px-5 py-3.5 border-b border-stone-200 space-y-3">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by recipe title or ingredient..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Meal Type Segmented Filter */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setMealFilter('all')}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    mealFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All Meals
                </button>
                {MEAL_TYPES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMealFilter(m.key)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                      mealFilter === m.key
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Dietary & Prep Filters */}
              <div className="flex flex-wrap items-center gap-1.5">
                {DIETARY_TAGS.map((tag) => {
                  const active = selectedDietary.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietary(tag)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-stone-600 pt-0.5">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyCompatible}
                    onChange={(e) => setOnlyCompatible(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
                  />
                  <span>Match my dietary &amp; allergy profile</span>
                </label>

                <div className="inline-flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                  <select
                    aria-label="Maximum total cook time"
                    value={maxPrep ?? ''}
                    onChange={(e) => setMaxPrep(e.target.value ? Number(e.target.value) : null)}
                    className="text-xs bg-white border border-stone-200 rounded-md px-2 py-1 text-stone-700"
                  >
                    <option value="">Any time</option>
                    <option value="15">Under 15m</option>
                    <option value="25">Under 25m</option>
                    <option value="35">Under 35m</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recipe Results */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
              {filteredRecipes.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-stone-900">
                    No recipes match these filters
                  </p>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Try clearing a dietary tag, turning off profile matching, or creating a custom recipe.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setMealFilter('all');
                        setSelectedDietary([]);
                        setMaxPrep(null);
                        setOnlyCompatible(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
                    >
                      Reset Filters
                    </button>
                    <button
                      type="button"
                      onClick={onOpenNewRecipe}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
                    >
                      Create Recipe
                    </button>
                  </div>
                </div>
              ) : (
                filteredRecipes.map((recipe) => {
                  const totalMins = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
                  const compatible = isRecipeCompatible(recipe, preferences);

                  return (
                    <div
                      key={recipe.id}
                      className="p-4 hover:bg-stone-50/70 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <button
                          type="button"
                          onClick={() => onViewRecipe(recipe)}
                          className="text-left text-sm font-semibold text-stone-900 hover:text-emerald-800 transition-colors focus:outline-none focus-visible:underline"
                        >
                          {recipe.title}
                        </button>
                        <p className="text-xs text-stone-500 line-clamp-2">{recipe.description}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 pt-0.5">
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums text-stone-700">
                            <Clock className="w-3 h-3 text-stone-400" aria-hidden="true" />
                            {totalMins}m
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-stone-800 font-medium">
                            {recipe.nutrition.calories} kcal
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {recipe.nutrition.protein}g P · {recipe.nutrition.carbs}g C · {recipe.nutrition.fats}g F
                          </span>
                        </div>
                        {recipe.dietaryTags.length > 0 && (
                          <p className="text-[11px] text-stone-400">
                            {recipe.dietaryTags.join(' · ')}
                            {!compatible ? ' · Conflicts with profile' : ''}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSelectRecipe(recipe, activeDay, activeMeal, targetSlot?.swapEntryId)
                        }
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-700 rounded-lg transition-colors shrink-0 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{targetSlot?.swapEntryId ? 'Swap' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
