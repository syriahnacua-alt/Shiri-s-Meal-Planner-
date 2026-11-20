import { useMemo, useState } from 'react';
import { SEED_RECIPES } from './data/seedRecipes';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  CustomGroceryItem,
  DayOfWeek,
  GroceryAisle,
  MealPlan,
  MealSlotEntry,
  MealType,
  Recipe,
  UserPreferences,
} from './types/mealPlanner';
import { aggregateGroceryList } from './utils/groceryAggregator';
import {
  DEFAULT_PREFERENCES,
  autoFillMealPlan,
  createEmptyMealPlan,
  createStarterMealPlan,
  swapMealSlots,
} from './utils/mealPlannerUtils';
import { ActiveView, Header } from './components/Header';
import { MealCalendar } from './components/MealCalendar';
import { RecipeDrawer } from './components/RecipeDrawer';
import { RecipeLibrary } from './components/RecipeLibrary';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { CustomRecipeModal } from './components/CustomRecipeModal';
import { GroceryList } from './components/GroceryList';
import { PreferencesPanel } from './components/PreferencesPanel';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('calendar');

  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    'verdanttable_preferences_v1',
    DEFAULT_PREFERENCES
  );
  const [customRecipes, setCustomRecipes] = useLocalStorage<Recipe[]>(
    'verdanttable_custom_recipes_v1',
    []
  );
  const [mealPlan, setMealPlan] = useLocalStorage<MealPlan>(
    'verdanttable_meal_plan_v1',
    () => createStarterMealPlan()
  );
  const [checkedGroceryKeys, setCheckedGroceryKeys] = useLocalStorage<Record<string, boolean>>(
    'verdanttable_grocery_checked_v1',
    {}
  );
  const [customGroceryItems, setCustomGroceryItems] = useLocalStorage<CustomGroceryItem[]>(
    'verdanttable_grocery_custom_v1',
    []
  );

  // Modal & Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTargetSlot, setDrawerTargetSlot] = useState<{
    day: DayOfWeek;
    mealType: MealType;
    swapEntryId?: string;
  } | null>(null);

  const [detailModalState, setDetailModalState] = useState<{
    recipe: Recipe;
    context?: { day: DayOfWeek; mealType: MealType; entry: MealSlotEntry } | null;
  } | null>(null);

  const [newRecipeModalOpen, setNewRecipeModalOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const allRecipes = useMemo(() => [...customRecipes, ...SEED_RECIPES], [customRecipes]);

  const groceryItems = useMemo(
    () => aggregateGroceryList(mealPlan, allRecipes, checkedGroceryKeys),
    [mealPlan, allRecipes, checkedGroceryKeys]
  );

  const groceryRemainingCount = useMemo(() => {
    const aggRemaining = groceryItems.filter((i) => !i.checked).length;
    const customRemaining = customGroceryItems.filter((c) => !c.checked).length;
    return aggRemaining + customRemaining;
  }, [groceryItems, customGroceryItems]);

  // Meal Plan Handlers
  const handleAddOrSwapRecipeToSlot = (
    recipe: Recipe,
    day: DayOfWeek,
    mealType: MealType,
    swapEntryId?: string,
    servingsMultiplier = preferences.defaultServings || 1
  ) => {
    setMealPlan((prev) => {
      const currentEntries = prev[day][mealType];
      if (swapEntryId) {
        return {
          ...prev,
          [day]: {
            ...prev[day],
            [mealType]: currentEntries.map((entry) =>
              entry.id === swapEntryId ? { ...entry, recipeId: recipe.id } : entry
            ),
          },
        };
      }

      const newEntry: MealSlotEntry = {
        id: `${day}-${mealType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        recipeId: recipe.id,
        servingsMultiplier,
      };

      return {
        ...prev,
        [day]: {
          ...prev[day],
          [mealType]: [...currentEntries, newEntry],
        },
      };
    });

    setDrawerOpen(false);
    setDrawerTargetSlot(null);
  };

  const handleRemoveMeal = (day: DayOfWeek, mealType: MealType, entryId: string) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: prev[day][mealType].filter((e) => e.id !== entryId),
      },
    }));
  };

  const handleUpdateServings = (
    day: DayOfWeek,
    mealType: MealType,
    entryId: string,
    delta: number
  ) => {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: prev[day][mealType].map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                servingsMultiplier: Math.max(0.5, Number((entry.servingsMultiplier + delta).toFixed(1))),
              }
            : entry
        ),
      },
    }));
  };

  const handleMoveOrSwapDrop = (
    source: { day: DayOfWeek; mealType: MealType; entryId: string },
    target: { day: DayOfWeek; mealType: MealType }
  ) => {
    setMealPlan((prev) => swapMealSlots(prev, source, target));
  };

  const handleAutoFill = (mode: 'fill-empty' | 'regenerate-all') => {
    const { nextPlan, warning } = autoFillMealPlan(mealPlan, allRecipes, preferences, mode);
    if (warning) {
      setStatusBanner(warning);
      return;
    }
    setMealPlan(nextPlan);
    setStatusBanner(
      mode === 'fill-empty'
        ? 'Empty slots populated based on your dietary filters and daily calorie targets.'
        : 'Generated a fresh 7-day meal schedule aligned with your dietary profile.'
    );
  };

  const handleClearWeek = () => {
    setMealPlan(createEmptyMealPlan());
    setStatusBanner('Weekly calendar cleared. Use Auto-Fill or click any slot to start fresh.');
  };

  const handleSaveCustomRecipe = (recipe: Recipe) => {
    setCustomRecipes((prev) => [recipe, ...prev]);
    setStatusBanner(`Saved "${recipe.title}" to your Recipe Library.`);
  };

  const handleDeleteCustomRecipe = (recipeId: string) => {
    setCustomRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    // Also clean up any scheduled entries referencing the deleted custom recipe
    setMealPlan((prev) => {
      const next = { ...prev };
      for (const dayKey of Object.keys(next) as DayOfWeek[]) {
        const day = { ...next[dayKey] };
        for (const mealKey of Object.keys(day) as MealType[]) {
          day[mealKey] = day[mealKey].filter((e) => e.recipeId !== recipeId);
        }
        next[dayKey] = day;
      }
      return next;
    });
  };

  // Grocery Handlers
  const handleToggleGroceryItem = (key: string) => {
    setCheckedGroceryKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAddCustomGroceryItem = (name: string, quantity: string, aisle: GroceryAisle) => {
    setCustomGroceryItems((prev) => [
      ...prev,
      {
        id: `extra-${Date.now()}`,
        name,
        quantity,
        aisle,
        checked: false,
      },
    ]);
  };

  const handleToggleCustomGroceryItem = (id: string) => {
    setCustomGroceryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleRemoveCustomGroceryItem = (id: string) => {
    setCustomGroceryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetGroceryChecks = () => {
    setCheckedGroceryKeys({});
    setCustomGroceryItems((prev) => prev.map((c) => ({ ...c, checked: false })));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f6] text-stone-900">
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenNewRecipe={() => setNewRecipeModalOpen(true)}
        groceryRemainingCount={groceryRemainingCount}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'calendar' && (
          <MealCalendar
            mealPlan={mealPlan}
            recipes={allRecipes}
            preferences={preferences}
            onAddMealClick={(day, mealType) => {
              setDrawerTargetSlot({ day, mealType });
              setDrawerOpen(true);
            }}
            onSwapMealClick={(day, mealType, entryId) => {
              setDrawerTargetSlot({ day, mealType, swapEntryId: entryId });
              setDrawerOpen(true);
            }}
            onViewRecipe={(recipe, context) =>
              setDetailModalState({ recipe, context: context ?? null })
            }
            onRemoveMeal={handleRemoveMeal}
            onUpdateServings={handleUpdateServings}
            onMoveOrSwapDrop={handleMoveOrSwapDrop}
            onAutoFillEmpty={() => handleAutoFill('fill-empty')}
            onRegenerateWeek={() => handleAutoFill('regenerate-all')}
            onClearWeek={handleClearWeek}
            onOpenRecipeDrawer={() => {
              setDrawerTargetSlot(null);
              setDrawerOpen(true);
            }}
            onGoToPreferences={() => setActiveView('preferences')}
            statusBanner={statusBanner}
            onDismissBanner={() => setStatusBanner(null)}
          />
        )}

        {activeView === 'recipes' && (
          <RecipeLibrary
            recipes={allRecipes}
            preferences={preferences}
            onViewRecipe={(recipe) => setDetailModalState({ recipe, context: null })}
            onOpenNewRecipe={() => setNewRecipeModalOpen(true)}
          />
        )}

        {activeView === 'grocery' && (
          <GroceryList
            items={groceryItems}
            customItems={customGroceryItems}
            onToggleItem={handleToggleGroceryItem}
            onToggleCustomItem={handleToggleCustomGroceryItem}
            onAddCustomItem={handleAddCustomGroceryItem}
            onRemoveCustomItem={handleRemoveCustomGroceryItem}
            onResetChecks={handleResetGroceryChecks}
            onGoToCalendar={() => setActiveView('calendar')}
          />
        )}

        {activeView === 'preferences' && (
          <PreferencesPanel
            preferences={preferences}
            recipes={allRecipes}
            onChangePreferences={setPreferences}
            onAutoFillFromPreferences={() => {
              handleAutoFill('regenerate-all');
              setActiveView('calendar');
            }}
          />
        )}
      </main>

      {/* Slide-over Recipe Drawer for Calendar */}
      <RecipeDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerTargetSlot(null);
        }}
        recipes={allRecipes}
        preferences={preferences}
        targetSlot={drawerTargetSlot}
        onSelectRecipe={(recipe, day, mealType, swapEntryId) =>
          handleAddOrSwapRecipeToSlot(recipe, day, mealType, swapEntryId)
        }
        onViewRecipe={(recipe) => setDetailModalState({ recipe, context: null })}
        onOpenNewRecipe={() => {
          setDrawerOpen(false);
          setNewRecipeModalOpen(true);
        }}
      />

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        key={detailModalState?.recipe.id ?? 'closed'}
        recipe={detailModalState?.recipe ?? null}
        slotContext={detailModalState?.context ?? null}
        onClose={() => setDetailModalState(null)}
        onAddToMealPlan={(recipe, day, mealType, servings) => {
          handleAddOrSwapRecipeToSlot(recipe, day, mealType, undefined, servings);
          setActiveView('calendar');
        }}
        onDeleteCustomRecipe={handleDeleteCustomRecipe}
      />

      {/* Custom Recipe Creator Modal */}
      <CustomRecipeModal
        isOpen={newRecipeModalOpen}
        onClose={() => setNewRecipeModalOpen(false)}
        onSaveRecipe={handleSaveCustomRecipe}
      />
    </div>
  );
}
