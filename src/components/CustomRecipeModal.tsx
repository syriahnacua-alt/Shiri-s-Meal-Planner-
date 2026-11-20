import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  COMMON_ALLERGENS,
  DIETARY_TAGS,
  DietaryTag,
  GROCERY_AISLES,
  GroceryAisle,
  Ingredient,
  MEAL_TYPES,
  MealType,
  Recipe,
} from '../types/mealPlanner';

interface CustomRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
}

interface IngredientDraft {
  name: string;
  amount: string;
  unit: string;
  aisle: GroceryAisle;
}

const COMMON_UNITS = ['whole', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'ml', 'clove', 'slice', 'medium'];

export function CustomRecipeModal({ isOpen, onClose, onSaveRecipe }: CustomRecipeModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mealTypes, setMealTypes] = useState<MealType[]>(['dinner']);
  const [prepTime, setPrepTime] = useState('10');
  const [cookTime, setCookTime] = useState('15');
  const [servings, setServings] = useState('1');
  const [calories, setCalories] = useState('450');
  const [protein, setProtein] = useState('32');
  const [carbs, setCarbs] = useState('40');
  const [fats, setFats] = useState('16');
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { name: '', amount: '1', unit: 'cup', aisle: 'Produce' },
  ]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  const toggleMealType = (m: MealType) => {
    setMealTypes((prev) =>
      prev.includes(m) ? (prev.length > 1 ? prev.filter((x) => x !== m) : prev) : [...prev, m]
    );
  };

  const toggleDietary = (tag: DietaryTag) => {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAllergen = (a: string) => {
    setAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const updateIngredient = (idx: number, patch: Partial<IngredientDraft>) => {
    setIngredients((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a recipe title.');
      return;
    }

    const validIngredients: Ingredient[] = ingredients
      .filter((i) => i.name.trim())
      .map((i, idx) => ({
        id: `custom-ing-${Date.now()}-${idx}`,
        name: i.name.trim(),
        amount: Math.max(0.05, Number(i.amount) || 1),
        unit: i.unit.trim() || 'whole',
        aisle: i.aisle,
      }));

    if (validIngredients.length === 0) {
      setError('Add at least one ingredient with a name and measurement.');
      return;
    }

    const validSteps = instructions.map((s) => s.trim()).filter(Boolean);
    if (validSteps.length === 0) {
      setError('Add at least one preparation instruction.');
      return;
    }

    const newRecipe: Recipe = {
      id: `custom-rec-${Date.now()}`,
      title: title.trim(),
      description:
        description.trim() ||
        `Custom ${mealTypes.join('/')} recipe with ${validIngredients.length} ingredients.`,
      mealTypes,
      prepTimeMinutes: Math.max(0, Number(prepTime) || 0),
      cookTimeMinutes: Math.max(0, Number(cookTime) || 0),
      servings: Math.max(1, Number(servings) || 1),
      nutrition: {
        calories: Math.max(0, Number(calories) || 0),
        protein: Math.max(0, Number(protein) || 0),
        carbs: Math.max(0, Number(carbs) || 0),
        fats: Math.max(0, Number(fats) || 0),
      },
      dietaryTags,
      allergens,
      ingredients: validIngredients,
      instructions: validSteps,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    onSaveRecipe(newRecipe);

    // Reset form
    setTitle('');
    setDescription('');
    setMealTypes(['dinner']);
    setDietaryTags([]);
    setAllergens([]);
    setIngredients([{ name: '', amount: '1', unit: 'cup', aisle: 'Produce' }]);
    setInstructions(['']);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create custom recipe"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-[1px]"
          />

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white border border-stone-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-stone-900">
                  Create Custom Recipe
                </h2>
                <p className="text-xs text-stone-500">
                  Saved automatically to your local recipe library for meal scheduling.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-900"
                >
                  {error}
                </div>
              )}

              {/* Basics */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="rec-title" className="block text-xs font-medium text-stone-700 mb-1">
                    Recipe Title
                  </label>
                  <input
                    id="rec-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Herb-Crusted Chicken & Farro Bowl"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label htmlFor="rec-desc" className="block text-xs font-medium text-stone-700 mb-1">
                    Short Description
                  </label>
                  <textarea
                    id="rec-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe the dish and key flavors..."
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-stone-700 mb-1.5">
                    Meal Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {MEAL_TYPES.map((m) => {
                      const active = mealTypes.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => toggleMealType(m.key)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            active
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Timing & Nutrition */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label htmlFor="rec-prep" className="block text-xs text-stone-600 mb-1">
                    Prep (min)
                  </label>
                  <input
                    id="rec-prep"
                    type="number"
                    min={0}
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="rec-cook" className="block text-xs text-stone-600 mb-1">
                    Cook (min)
                  </label>
                  <input
                    id="rec-cook"
                    type="number"
                    min={0}
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="rec-serv" className="block text-xs text-stone-600 mb-1">
                    Base Servings
                  </label>
                  <input
                    id="rec-serv"
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="rec-cal" className="block text-xs text-stone-600 mb-1">
                    Calories (total)
                  </label>
                  <input
                    id="rec-cal"
                    type="number"
                    min={0}
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="rec-pro" className="block text-xs text-stone-600 mb-1">
                    Protein (g)
                  </label>
                  <input
                    id="rec-pro"
                    type="number"
                    min={0}
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="rec-carbs" className="block text-xs text-stone-600 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    id="rec-carbs"
                    type="number"
                    min={0}
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="rec-fats" className="block text-xs text-stone-600 mb-1">
                    Fats (g)
                  </label>
                  <input
                    id="rec-fats"
                    type="number"
                    min={0}
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Dietary & Allergens */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div>
                  <span className="block text-xs font-medium text-stone-700 mb-1.5">
                    Dietary Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DIETARY_TAGS.map((tag) => {
                      const active = dietaryTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleDietary(tag)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
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
                </div>

                <div>
                  <span className="block text-xs font-medium text-stone-700 mb-1.5">
                    Contains Allergens (optional)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_ALLERGENS.map((allergen) => {
                      const active = allergens.includes(allergen);
                      return (
                        <button
                          key={allergen}
                          type="button"
                          onClick={() => toggleAllergen(allergen)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                            active
                              ? 'bg-orange-700 text-white border-orange-700'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {allergen}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Ingredients */}
              <div className="space-y-2.5 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-700">Ingredients</span>
                  <button
                    type="button"
                    onClick={() =>
                      setIngredients((prev) => [
                        ...prev,
                        { name: '', amount: '1', unit: 'tbsp', aisle: 'Pantry' },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="number"
                        step="0.25"
                        min="0.05"
                        aria-label={`Ingredient ${idx + 1} quantity`}
                        value={ing.amount}
                        onChange={(e) => updateIngredient(idx, { amount: e.target.value })}
                        className="col-span-2 px-2 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-lg"
                      />
                      <select
                        aria-label={`Ingredient ${idx + 1} unit`}
                        value={ing.unit}
                        onChange={(e) => updateIngredient(idx, { unit: e.target.value })}
                        className="col-span-2 px-1.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Ingredient name (e.g., Eggs)"
                        aria-label={`Ingredient ${idx + 1} name`}
                        value={ing.name}
                        onChange={(e) => updateIngredient(idx, { name: e.target.value })}
                        className="col-span-4 px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg"
                      />
                      <select
                        aria-label={`Ingredient ${idx + 1} grocery aisle`}
                        value={ing.aisle}
                        onChange={(e) =>
                          updateIngredient(idx, { aisle: e.target.value as GroceryAisle })
                        }
                        className="col-span-3 px-2 py-1.5 text-xs border border-stone-200 rounded-lg bg-white"
                      >
                        {GROCERY_AISLES.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setIngredients((prev) =>
                            prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                          )
                        }
                        aria-label="Remove ingredient"
                        className="col-span-1 p-1.5 text-stone-400 hover:text-orange-800 flex justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Instructions */}
              <div className="space-y-2.5 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-700">Preparation Steps</span>
                  <button
                    type="button"
                    onClick={() => setInstructions((prev) => [...prev, ''])}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-mono text-stone-400 pt-2 w-5 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        placeholder={`Step ${idx + 1} instructions...`}
                        value={step}
                        onChange={(e) =>
                          setInstructions((prev) =>
                            prev.map((s, i) => (i === idx ? e.target.value : s))
                          )
                        }
                        className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setInstructions((prev) =>
                            prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                          )
                        }
                        aria-label="Remove step"
                        className="p-1.5 text-stone-400 hover:text-orange-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                Save Recipe
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}
