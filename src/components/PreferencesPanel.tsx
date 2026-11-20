import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import {
  COMMON_ALLERGENS,
  DIETARY_TAGS,
  DietaryTag,
  Recipe,
  UserPreferences,
} from '../types/mealPlanner';
import { isRecipeCompatible } from '../utils/mealPlannerUtils';

interface PreferencesPanelProps {
  preferences: UserPreferences;
  recipes: Recipe[];
  onChangePreferences: (next: UserPreferences) => void;
  onAutoFillFromPreferences: () => void;
}

const MACRO_PRESETS: {
  label: string;
  desc: string;
  targets: UserPreferences['dailyTargets'];
}[] = [
  {
    label: 'Balanced Maintenance',
    desc: '2,050 kcal · 145g P · 205g C · 72g F',
    targets: { calories: 2050, protein: 145, carbs: 205, fats: 72 },
  },
  {
    label: 'High-Protein Lean',
    desc: '1,850 kcal · 165g P · 155g C · 62g F',
    targets: { calories: 1850, protein: 165, carbs: 155, fats: 62 },
  },
  {
    label: 'Ketogenic Low-Carb',
    desc: '1,950 kcal · 130g P · 35g C · 142g F',
    targets: { calories: 1950, protein: 130, carbs: 35, fats: 142 },
  },
  {
    label: 'Active Endurance',
    desc: '2,450 kcal · 140g P · 305g C · 75g F',
    targets: { calories: 2450, protein: 140, carbs: 305, fats: 75 },
  },
];

export function PreferencesPanel({
  preferences,
  recipes,
  onChangePreferences,
  onAutoFillFromPreferences,
}: PreferencesPanelProps) {
  const [customAllergy, setCustomAllergy] = useState('');

  const updateTarget = (key: keyof UserPreferences['dailyTargets'], val: number) => {
    onChangePreferences({
      ...preferences,
      dailyTargets: {
        ...preferences.dailyTargets,
        [key]: Math.max(0, val),
      },
    });
  };

  const toggleDietary = (tag: DietaryTag) => {
    const exists = preferences.dietaryFilters.includes(tag);
    onChangePreferences({
      ...preferences,
      dietaryFilters: exists
        ? preferences.dietaryFilters.filter((t) => t !== tag)
        : [...preferences.dietaryFilters, tag],
    });
  };

  const toggleAllergy = (allergen: string) => {
    const exists = preferences.allergies.includes(allergen);
    onChangePreferences({
      ...preferences,
      allergies: exists
        ? preferences.allergies.filter((a) => a !== allergen)
        : [...preferences.allergies, allergen],
    });
  };

  const handleAddCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customAllergy.trim();
    if (!cleaned) return;
    if (!preferences.allergies.some((a) => a.toLowerCase() === cleaned.toLowerCase())) {
      onChangePreferences({
        ...preferences,
        allergies: [...preferences.allergies, cleaned],
      });
    }
    setCustomAllergy('');
  };

  const macroCalories =
    preferences.dailyTargets.protein * 4 +
    preferences.dailyTargets.carbs * 4 +
    preferences.dailyTargets.fats * 9;

  const compatibleCount = recipes.filter((r) => isRecipeCompatible(r, preferences)).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          Profile &amp; Dietary Preferences
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Configure daily macro targets, dietary preferences, and allergen exclusions. Changes save automatically.
        </p>
      </div>

      {/* Compatibility Live Summary */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-stone-500">Recipe Library Compatibility</div>
          <div className="mt-0.5 text-sm font-medium text-stone-900">
            <span className="font-mono tabular-nums font-semibold text-emerald-800">
              {compatibleCount} of {recipes.length}
            </span>{' '}
            recipes match your active dietary filters and allergy rules.
          </div>
        </div>
        <button
          type="button"
          onClick={onAutoFillFromPreferences}
          disabled={compatibleCount === 0}
          className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          Auto-Fill Week With Profile
        </button>
      </div>

      {/* Daily Calorie & Macro Targets */}
      <section className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-stone-900">
              Daily Nutrition Targets
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Used by the daily progress tracker and calorie-aware week auto-fill.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateTarget('calories', macroCalories)}
            className="text-xs font-medium text-emerald-800 hover:underline self-start sm:self-auto"
          >
            Sync calories to macros ({macroCalories.toLocaleString()} kcal)
          </button>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {MACRO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                onChangePreferences({
                  ...preferences,
                  dailyTargets: { ...preset.targets },
                })
              }
              className="text-left p-3 rounded-lg border border-stone-200 hover:border-emerald-700 hover:bg-emerald-50/40 transition-colors"
            >
              <div className="text-xs font-semibold text-stone-900">{preset.label}</div>
              <div className="mt-1 text-[11px] font-mono tabular-nums text-stone-500">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <label htmlFor="target-calories" className="block text-xs font-medium text-stone-700 mb-1">
              Calories (kcal)
            </label>
            <input
              id="target-calories"
              type="number"
              min={800}
              max={6000}
              step={50}
              value={preferences.dailyTargets.calories}
              onChange={(e) => updateTarget('calories', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label htmlFor="target-protein" className="block text-xs font-medium text-stone-700 mb-1">
              Protein (g)
            </label>
            <input
              id="target-protein"
              type="number"
              min={20}
              max={400}
              step={5}
              value={preferences.dailyTargets.protein}
              onChange={(e) => updateTarget('protein', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label htmlFor="target-carbs" className="block text-xs font-medium text-stone-700 mb-1">
              Carbs (g)
            </label>
            <input
              id="target-carbs"
              type="number"
              min={0}
              max={600}
              step={5}
              value={preferences.dailyTargets.carbs}
              onChange={(e) => updateTarget('carbs', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
          <div>
            <label htmlFor="target-fats" className="block text-xs font-medium text-stone-700 mb-1">
              Fats (g)
            </label>
            <input
              id="target-fats"
              type="number"
              min={10}
              max={300}
              step={5}
              value={preferences.dailyTargets.fats}
              onChange={(e) => updateTarget('fats', Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>
      </section>

      {/* Dietary Filters */}
      <section className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-stone-900">
            Dietary Filters
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Select all requirements that auto-filled and filtered recipes must satisfy.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {DIETARY_TAGS.map((tag) => {
            const active = preferences.dietaryFilters.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDietary(tag)}
                className={`px-3.5 py-2.5 rounded-lg border text-left text-sm font-medium flex items-center justify-between transition-colors ${
                  active
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                <span>{tag}</span>
                {active && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Allergy Exclusions */}
      <section className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-stone-900">
            Allergy &amp; Ingredient Exclusions
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Recipes containing selected allergens or matching ingredient names will be excluded from auto-fill and safe filters.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGENS.map((allergen) => {
            const active = preferences.allergies.includes(allergen);
            return (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergy(allergen)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  active
                    ? 'bg-orange-700 text-white border-orange-700'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                {active ? `Exclude: ${allergen}` : allergen}
              </button>
            );
          })}
        </div>

        {/* Custom Exclusions */}
        <form onSubmit={handleAddCustomAllergy} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            placeholder="Add custom ingredient exclusion (e.g., cilantro, mushroom)..."
            aria-label="Custom ingredient exclusion"
            className="flex-1 max-w-md px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add</span>
          </button>
        </form>

        {preferences.allergies.filter((a) => !COMMON_ALLERGENS.includes(a)).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-stone-500">Custom exclusions:</span>
            {preferences.allergies
              .filter((a) => !COMMON_ALLERGENS.includes(a))
              .map((custom) => (
                <button
                  key={custom}
                  type="button"
                  onClick={() => toggleAllergy(custom)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-orange-50 text-orange-900 border border-orange-200 rounded-md hover:bg-orange-100"
                >
                  <span>{custom}</span>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
