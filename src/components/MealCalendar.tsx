import { useState } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  CalendarPlus,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  MEAL_TYPES,
  MealPlan,
  MealSlotEntry,
  MealType,
  Recipe,
  UserPreferences,
} from '../types/mealPlanner';
import {
  calculateDayNutrition,
  calculateEntryNutrition,
  countPlannedMeals,
} from '../utils/mealPlannerUtils';
import { NutritionProgressBar } from './NutritionProgressBar';

interface MealCalendarProps {
  mealPlan: MealPlan;
  recipes: Recipe[];
  preferences: UserPreferences;
  onAddMealClick: (day: DayOfWeek, mealType: MealType) => void;
  onSwapMealClick: (day: DayOfWeek, mealType: MealType, entryId: string) => void;
  onViewRecipe: (recipe: Recipe, context?: { day: DayOfWeek; mealType: MealType; entry: MealSlotEntry }) => void;
  onRemoveMeal: (day: DayOfWeek, mealType: MealType, entryId: string) => void;
  onUpdateServings: (day: DayOfWeek, mealType: MealType, entryId: string, delta: number) => void;
  onMoveOrSwapDrop: (
    source: { day: DayOfWeek; mealType: MealType; entryId: string },
    target: { day: DayOfWeek; mealType: MealType }
  ) => void;
  onAutoFillEmpty: () => void;
  onRegenerateWeek: () => void;
  onClearWeek: () => void;
  onOpenRecipeDrawer: () => void;
  onGoToPreferences: () => void;
  statusBanner: string | null;
  onDismissBanner: () => void;
}

export function MealCalendar({
  mealPlan,
  recipes,
  preferences,
  onAddMealClick,
  onSwapMealClick,
  onViewRecipe,
  onRemoveMeal,
  onUpdateServings,
  onMoveOrSwapDrop,
  onAutoFillEmpty,
  onRegenerateWeek,
  onClearWeek,
  onOpenRecipeDrawer,
  onGoToPreferences,
  statusBanner,
  onDismissBanner,
}: MealCalendarProps) {
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>('monday');
  const [dragPayload, setDragPayload] = useState<{
    day: DayOfWeek;
    mealType: MealType;
    entryId: string;
  } | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  // Weekly metrics
  const dayTotals = DAYS_OF_WEEK.map((d) => calculateDayNutrition(mealPlan[d.key], recipeMap));
  const activeDays = dayTotals.filter((t) => t.calories > 0);
  const avgCalories =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.calories, 0) / activeDays.length)
      : 0;
  const avgProtein =
    activeDays.length > 0
      ? Math.round(activeDays.reduce((sum, d) => sum + d.protein, 0) / activeDays.length)
      : 0;
  const totalScheduledMeals = countPlannedMeals(mealPlan);

  const handleDragStart = (day: DayOfWeek, mealType: MealType, entryId: string) => {
    setDragPayload({ day, mealType, entryId });
  };

  const handleDrop = (targetDay: DayOfWeek, targetMealType: MealType) => {
    if (dragPayload) {
      onMoveOrSwapDrop(dragPayload, { day: targetDay, mealType: targetMealType });
    }
    setDragPayload(null);
    setDropTargetKey(null);
  };

  const renderSlotEntries = (day: DayOfWeek, mealType: MealType, entries: MealSlotEntry[]) => {
    const slotKey = `${day}-${mealType}`;
    const isDropHighlight = dropTargetKey === slotKey;

    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (dropTargetKey !== slotKey) setDropTargetKey(slotKey);
        }}
        onDragLeave={() => {
          if (dropTargetKey === slotKey) setDropTargetKey(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(day, mealType);
        }}
        className={`space-y-1.5 rounded-lg transition-colors ${
          isDropHighlight ? 'bg-emerald-50/80 ring-1 ring-emerald-600 p-1 -m-1' : ''
        }`}
      >
        {entries.length === 0 ? (
          <button
            type="button"
            onClick={() => onAddMealClick(day, mealType)}
            className="w-full min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-200 text-xs text-stone-400 hover:text-emerald-800 hover:border-emerald-600/50 hover:bg-emerald-50/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add</span>
          </button>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry) => {
              const recipe = recipeMap.get(entry.recipeId);
              if (!recipe) return null;
              const nutrition = calculateEntryNutrition(entry, recipeMap);

              return (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => handleDragStart(day, mealType, entry.id)}
                  onDragEnd={() => {
                    setDragPayload(null);
                    setDropTargetKey(null);
                  }}
                  className="group relative rounded-lg bg-stone-50/80 hover:bg-stone-100/90 border border-stone-200/80 p-2 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <button
                    type="button"
                    onClick={() => onViewRecipe(recipe, { day, mealType, entry })}
                    className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
                  >
                    <p className="text-xs font-medium text-stone-900 leading-snug line-clamp-2 pr-10">
                      {recipe.title}
                    </p>
                    <p className="mt-1 text-[11px] font-mono tabular-nums text-stone-500">
                      {nutrition.calories} kcal · {nutrition.protein}g P
                      {entry.servingsMultiplier !== 1 ? ` · ${entry.servingsMultiplier}×` : ''}
                    </p>
                  </button>

                  {/* Hover / Focus quick controls */}
                  <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-stone-200/60">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateServings(day, mealType, entry.id, -0.5)}
                        disabled={entry.servingsMultiplier <= 0.5}
                        aria-label={`Decrease servings for ${recipe.title}`}
                        className="w-5 h-5 flex items-center justify-center rounded text-xs font-mono text-stone-600 hover:bg-stone-200 disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="text-[11px] font-mono tabular-nums text-stone-600 px-0.5">
                        {entry.servingsMultiplier}×
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateServings(day, mealType, entry.id, 0.5)}
                        aria-label={`Increase servings for ${recipe.title}`}
                        className="w-5 h-5 flex items-center justify-center rounded text-xs font-mono text-stone-600 hover:bg-stone-200"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => onSwapMealClick(day, mealType, entry.id)}
                        title="Swap meal"
                        aria-label={`Swap ${recipe.title}`}
                        className="p-1 rounded text-stone-500 hover:text-emerald-800 hover:bg-white transition-colors"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveMeal(day, mealType, entry.id)}
                        title="Remove meal"
                        aria-label={`Remove ${recipe.title}`}
                        className="p-1 rounded text-stone-500 hover:text-orange-800 hover:bg-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const activeMobileDayObj = DAYS_OF_WEEK.find((d) => d.key === selectedMobileDay)!;
  const mobileDayNutrition = calculateDayNutrition(mealPlan[selectedMobileDay], recipeMap);

  return (
    <div className="space-y-5">
      {/* Workspace Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Weekly Meal Plan
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Click any slot to add or swap recipes, drag meals between days, or auto-fill around your macro targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAutoFillEmpty}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <CalendarPlus className="w-4 h-4" aria-hidden="true" />
            <span>Auto-Fill Empty Slots</span>
          </button>

          <button
            type="button"
            onClick={onRegenerateWeek}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Randomize Full Week</span>
          </button>

          <button
            type="button"
            onClick={onOpenRecipeDrawer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Recipe Drawer</span>
          </button>

          {totalScheduledMeals > 0 && (
            <button
              type="button"
              onClick={onClearWeek}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-orange-800 bg-white border border-stone-200 hover:bg-orange-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Status / Feedback Notice */}
      {statusBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700"
        >
          <span>{statusBanner}</span>
          <button
            type="button"
            onClick={onDismissBanner}
            aria-label="Dismiss notice"
            className="p-1 text-stone-400 hover:text-stone-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Weekly KPI Strip */}
      <div className="bg-white border border-stone-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
        <div className="p-4">
          <div className="text-xs text-stone-500">Avg Planned Energy</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-semibold tabular-nums text-stone-900">
              {avgCalories.toLocaleString()}
            </span>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              / {preferences.dailyTargets.calories.toLocaleString()} kcal
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-stone-500">Avg Daily Protein</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-semibold tabular-nums text-stone-900">
              {avgProtein}g
            </span>
            <span className="text-xs font-mono tabular-nums text-stone-500">
              / {preferences.dailyTargets.protein}g target
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-stone-500">Meals Scheduled</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-semibold tabular-nums text-stone-900">
              {totalScheduledMeals}
            </span>
            <span className="text-xs text-stone-500">
              across {activeDays.length} active {activeDays.length === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        <div className="p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-stone-500">Dietary Profile</div>
            <div className="mt-1 text-sm font-medium text-stone-900 truncate">
              {preferences.dietaryFilters.length > 0
                ? preferences.dietaryFilters.join(' · ')
                : 'No dietary restrictions'}
              {preferences.allergies.length > 0
                ? ` · Excludes ${preferences.allergies.length}`
                : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToPreferences}
            className="text-xs font-medium text-emerald-800 hover:underline shrink-0"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Desktop 7-Day Grid */}
      <div className="hidden lg:grid lg:grid-cols-7 gap-3 items-start">
        {DAYS_OF_WEEK.map((day) => {
          const dayMeals = mealPlan[day.key];
          const dayNutrition = calculateDayNutrition(dayMeals, recipeMap);

          return (
            <section
              key={day.key}
              aria-label={`${day.label} meal plan`}
              className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
            >
              {/* Day Header + Compact Nutrition Tracker */}
              <div className="p-3 bg-stone-50/70 border-b border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold text-stone-900">
                    {day.label}
                  </h2>
                  <span className="text-[11px] font-mono tabular-nums text-stone-400">
                    {MEAL_TYPES.reduce((c, m) => c + dayMeals[m.key].length, 0)} meals
                  </span>
                </div>
                <NutritionProgressBar
                  current={dayNutrition}
                  target={preferences.dailyTargets}
                  variant="compact"
                />
              </div>

              {/* 4 Meal Slots */}
              <div className="divide-y divide-stone-100">
                {MEAL_TYPES.map((mealType) => {
                  const entries = dayMeals[mealType.key];
                  return (
                    <div key={mealType.key} className="p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-stone-500">
                          {mealType.label}
                        </span>
                        {entries.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onAddMealClick(day.key, mealType.key)}
                            title={`Add another ${mealType.label.toLowerCase()} item`}
                            aria-label={`Add another ${mealType.label.toLowerCase()} on ${day.label}`}
                            className="p-0.5 rounded text-stone-400 hover:text-emerald-800 hover:bg-stone-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      {renderSlotEntries(day.key, mealType.key, entries)}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Mobile & Tablet Single-Day Tabbed Switcher */}
      <div className="lg:hidden space-y-4">
        <div
          role="tablist"
          aria-label="Days of the week"
          className="grid grid-cols-7 gap-1 bg-white border border-stone-200 rounded-xl p-1"
        >
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedMobileDay === day.key;
            const mealCount = MEAL_TYPES.reduce(
              (c, m) => c + mealPlan[day.key][m.key].length,
              0
            );
            return (
              <button
                key={day.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedMobileDay(day.key)}
                className={`py-2 px-1 rounded-lg text-center transition-colors min-h-[44px] flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-emerald-700 text-white'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span className="text-xs font-medium">{day.shortLabel}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums mt-0.5 ${
                    isSelected ? 'text-emerald-100' : 'text-stone-400'
                  }`}
                >
                  {mealCount}/4
                </span>
              </button>
            );
          })}
        </div>

        <NutritionProgressBar
          current={mobileDayNutrition}
          target={preferences.dailyTargets}
          variant="detailed"
        />

        <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
          {MEAL_TYPES.map((mealType) => {
            const entries = mealPlan[selectedMobileDay][mealType.key];
            return (
              <div key={mealType.key} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-stone-900">
                    {activeMobileDayObj.label} · {mealType.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onAddMealClick(selectedMobileDay, mealType.key)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline min-h-[36px] px-2"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Meal</span>
                  </button>
                </div>
                {renderSlotEntries(selectedMobileDay, mealType.key, entries)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
