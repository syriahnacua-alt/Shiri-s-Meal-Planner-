import { useMemo, useState } from 'react';
import { Clock, Plus, Search, UtensilsCrossed } from 'lucide-react';
import {
  DIETARY_TAGS,
  DietaryTag,
  MEAL_BANNER_IMAGES,
  MEAL_TYPES,
  MealType,
  Recipe,
  UserPreferences,
} from '../types/mealPlanner';
import { isRecipeCompatible } from '../utils/mealPlannerUtils';

interface RecipeLibraryProps {
  recipes: Recipe[];
  preferences: UserPreferences;
  onViewRecipe: (recipe: Recipe) => void;
  onOpenNewRecipe: () => void;
}

export function RecipeLibrary({
  recipes,
  preferences,
  onViewRecipe,
  onOpenNewRecipe,
}: RecipeLibraryProps) {
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');
  const [dietaryFilters, setDietaryFilters] = useState<DietaryTag[]>([]);
  const [onlyProfileSafe, setOnlyProfileSafe] = useState(false);

  const toggleDietary = (tag: DietaryTag) => {
    setDietaryFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (mealFilter !== 'all' && !r.mealTypes.includes(mealFilter)) return false;
      if (dietaryFilters.length > 0 && !dietaryFilters.every((t) => r.dietaryTags.includes(t))) {
        return false;
      }
      if (onlyProfileSafe && !isRecipeCompatible(r, preferences)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = r.description.toLowerCase().includes(q);
        const inIng = r.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inIng) return false;
      }
      return true;
    });
  }, [recipes, mealFilter, dietaryFilters, onlyProfileSafe, preferences, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Recipe Library
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {recipes.length} curated and custom recipes with exact ingredient weights and macro profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewRecipe}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Create Custom Recipe</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes, ingredients, or flavor profiles..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setMealFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                mealFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({recipes.length})
            </button>
            {MEAL_TYPES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMealFilter(m.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  mealFilter === m.key
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {DIETARY_TAGS.map((tag) => {
              const active = dietaryFilters.includes(tag);
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

          <label className="inline-flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyProfileSafe}
              onChange={(e) => setOnlyProfileSafe(e.target.checked)}
              className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
            />
            <span>Match my dietary &amp; allergy preferences</span>
          </label>
        </div>
      </div>

      {/* Recipe Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center space-y-3">
          <UtensilsCrossed className="w-8 h-8 text-stone-300 mx-auto" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-stone-900">
            No recipes match your current filters
          </h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Clear your search or dietary filters, or add a custom recipe tailored to your goals.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setMealFilter('all');
                setDietaryFilters([]);
                setOnlyProfileSafe(false);
              }}
              className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              Clear All Filters
            </button>
            <button
              type="button"
              onClick={onOpenNewRecipe}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
            >
              Create Custom Recipe
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recipe) => {
            const primaryMeal = recipe.mealTypes[0] || 'dinner';
            const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
            const compatible = isRecipeCompatible(recipe, preferences);

            return (
              <article
                key={recipe.id}
                className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col hover:border-stone-300 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onViewRecipe(recipe)}
                  className="text-left flex-1 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700"
                >
                  <div className="relative h-40 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={MEAL_BANNER_IMAGES[primaryMeal]}
                      alt={`${recipe.title} category visual`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                        <span className="capitalize">
                          {recipe.mealTypes.join(' / ')}
                          {recipe.isCustom ? ' · Custom' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3 h-3 text-stone-400" aria-hidden="true" />
                          {totalTime} min
                        </span>
                      </div>

                      <h2 className="font-display text-base font-semibold text-stone-900 leading-snug">
                        {recipe.title}
                      </h2>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                        <span className="font-semibold text-stone-900">
                          {recipe.nutrition.calories} kcal
                        </span>
                        <span className="text-stone-500">
                          P {recipe.nutrition.protein}g · C {recipe.nutrition.carbs}g · F{' '}
                          {recipe.nutrition.fats}g
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-500 truncate">
                        {recipe.dietaryTags.length > 0
                          ? recipe.dietaryTags.join(' · ')
                          : 'Standard balanced recipe'}
                        {!compatible && (
                          <span className="text-orange-800 font-medium">
                            {' '}
                            · Excluded by profile
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
