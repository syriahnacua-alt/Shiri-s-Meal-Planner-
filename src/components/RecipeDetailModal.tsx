import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarPlus, Clock, Trash2, Users, X } from 'lucide-react';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  MEAL_BANNER_IMAGES,
  MEAL_TYPES,
  MealSlotEntry,
  MealType,
  Recipe,
} from '../types/mealPlanner';
import { formatQuantityNumber } from '../utils/groceryAggregator';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  slotContext?: {
    day: DayOfWeek;
    mealType: MealType;
    entry: MealSlotEntry;
  } | null;
  onClose: () => void;
  onAddToMealPlan: (recipe: Recipe, day: DayOfWeek, mealType: MealType, servings: number) => void;
  onDeleteCustomRecipe: (recipeId: string) => void;
}

export function RecipeDetailModal({
  recipe,
  slotContext,
  onClose,
  onAddToMealPlan,
  onDeleteCustomRecipe,
}: RecipeDetailModalProps) {
  const [servings, setServings] = useState<number>(
    slotContext?.entry.servingsMultiplier ?? recipe?.servings ?? 1
  );
  const [scheduleDay, setScheduleDay] = useState<DayOfWeek>('monday');
  const [scheduleMeal, setScheduleMeal] = useState<MealType>(
    recipe?.mealTypes[0] ?? 'dinner'
  );

  if (!recipe) return null;

  const primaryMeal = recipe.mealTypes[0] || 'dinner';
  const baseServings = recipe.servings || 1;
  const scale = servings / baseServings;
  const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label={recipe.title}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-[1px]"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white border border-stone-200 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header Banner */}
          <div className="relative h-44 sm:h-52 w-full bg-stone-100 shrink-0">
            <img
              src={MEAL_BANNER_IMAGES[primaryMeal]}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close recipe details"
              className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 text-stone-800 hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <p className="text-xs text-stone-200 capitalize">
                {recipe.mealTypes.join(' · ')}
                {recipe.isCustom ? ' · Custom Recipe' : ''}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-semibold leading-tight mt-0.5">
                {recipe.title}
              </h2>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <p className="text-sm text-stone-600 leading-relaxed">{recipe.description}</p>

            {/* Quick Facts & Serving Scaler */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3.5">
              <div>
                <div className="text-[11px] text-stone-500">Total Time</div>
                <div className="mt-0.5 inline-flex items-center gap-1 text-sm font-mono font-medium tabular-nums text-stone-900">
                  <Clock className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                  {totalMinutes} min
                </div>
              </div>
              <div>
                <div className="text-[11px] text-stone-500">Calories (scaled)</div>
                <div className="mt-0.5 text-sm font-mono font-semibold tabular-nums text-stone-900">
                  {Math.round(recipe.nutrition.calories * scale)} kcal
                </div>
              </div>
              <div>
                <div className="text-[11px] text-stone-500">Macros (P / C / F)</div>
                <div className="mt-0.5 text-xs font-mono tabular-nums text-stone-800">
                  {Math.round(recipe.nutrition.protein * scale)}g ·{' '}
                  {Math.round(recipe.nutrition.carbs * scale)}g ·{' '}
                  {Math.round(recipe.nutrition.fats * scale)}g
                </div>
              </div>
              <div>
                <div className="text-[11px] text-stone-500">Servings</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setServings((s) => Math.max(0.5, s - 0.5))}
                    aria-label="Decrease servings"
                    className="w-6 h-6 rounded border border-stone-200 bg-white text-xs font-mono text-stone-700 hover:bg-stone-100"
                  >
                    -
                  </button>
                  <span className="text-sm font-mono tabular-nums font-medium text-stone-900">
                    {servings}
                  </span>
                  <button
                    type="button"
                    onClick={() => setServings((s) => s + 0.5)}
                    aria-label="Increase servings"
                    className="w-6 h-6 rounded border border-stone-200 bg-white text-xs font-mono text-stone-700 hover:bg-stone-100"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Dietary & Allergen Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
              <span>
                <strong className="font-medium text-stone-800">Dietary:</strong>{' '}
                {recipe.dietaryTags.length > 0 ? recipe.dietaryTags.join(' · ') : 'Standard'}
              </span>
              <span>
                <strong className="font-medium text-stone-800">Allergens:</strong>{' '}
                {recipe.allergens.length > 0 ? recipe.allergens.join(', ') : 'None listed'}
              </span>
            </div>

            {/* Ingredients */}
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-stone-900">
                Ingredients
              </h3>
              <ul className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                {recipe.ingredients.map((ing) => (
                  <li
                    key={ing.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-4 text-sm bg-white"
                  >
                    <span className="text-stone-900">
                      <span className="font-mono tabular-nums font-medium text-stone-800 mr-2">
                        {formatQuantityNumber(ing.amount * scale)}{' '}
                        {ing.unit === 'whole' ? '' : ing.unit}
                      </span>
                      {ing.name}
                    </span>
                    <span className="text-xs text-stone-400 shrink-0">{ing.aisle}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-stone-900">
                Preparation Steps
              </h3>
              <ol className="space-y-2.5">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-stone-700 leading-relaxed">
                    <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 font-mono text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {recipe.isCustom ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomRecipe(recipe.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete Recipe</span>
              </button>
            ) : (
              <span className="text-xs text-stone-500">
                Prep {recipe.prepTimeMinutes}m · Cook {recipe.cookTimeMinutes}m
              </span>
            )}

            {!slotContext ? (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <select
                  aria-label="Day of week"
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value as DayOfWeek)}
                  className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-stone-800"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Meal slot"
                  value={scheduleMeal}
                  onChange={(e) => setScheduleMeal(e.target.value as MealType)}
                  className="text-xs bg-white border border-stone-200 rounded-lg px-2.5 py-2 text-stone-800"
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    onAddToMealPlan(recipe, scheduleDay, scheduleMeal, servings);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add to Plan</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors ml-auto"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
