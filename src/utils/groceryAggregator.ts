import {
  AggregatedGroceryItem,
  CustomGroceryItem,
  DAYS_OF_WEEK,
  GROCERY_AISLES,
  GroceryAisle,
  MEAL_TYPES,
  MealPlan,
  Recipe,
} from '../types/mealPlanner';

const SINGULAR_MAP: Record<string, string> = {
  eggs: 'egg',
  cloves: 'clove',
  avocados: 'avocado',
  tomatoes: 'tomato',
  carrots: 'carrot',
  apples: 'apple',
  lemons: 'lemon',
  cucumbers: 'cucumber',
  peppers: 'pepper',
  zucchinis: 'zucchini',
  mushrooms: 'mushroom',
  strawberries: 'strawberry',
  blueberries: 'blueberry',
  raspberries: 'raspberry',
  olives: 'olive',
  chickpeas: 'chickpea',
  almonds: 'almond',
  slices: 'slice',
  cups: 'cup',
  leaves: 'leaf',
  heads: 'head',
};

function normalizeIngredientName(rawName: string): { canonicalKey: string; displayName: string } {
  const cleaned = rawName.trim().replace(/\s+/g, ' ');
  const lower = cleaned.toLowerCase();
  const words = lower.split(' ');
  const lastWord = words[words.length - 1];
  const singularLast = SINGULAR_MAP[lastWord] || (lastWord.endsWith('s') && lastWord.length > 4 && !lastWord.endsWith('ss') ? lastWord.slice(0, -1) : lastWord);
  const canonicalWords = [...words.slice(0, -1), singularLast];
  const canonicalKey = canonicalWords.join(' ');
  const displayName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return { canonicalKey, displayName };
}

function normalizeUnit(rawUnit: string): string {
  const u = rawUnit.trim().toLowerCase();
  const unitAliases: Record<string, string> = {
    cups: 'cup',
    c: 'cup',
    tbsp: 'tbsp',
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    tsp: 'tsp',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    oz: 'oz',
    ounce: 'oz',
    ounces: 'oz',
    lb: 'lb',
    lbs: 'lb',
    pound: 'lb',
    pounds: 'lb',
    g: 'g',
    gram: 'g',
    grams: 'g',
    kg: 'kg',
    cloves: 'clove',
    slices: 'slice',
    leaves: 'leaf',
    heads: 'head',
    whole: 'whole',
    medium: 'medium',
    large: 'large',
    small: 'small',
  };
  return unitAliases[u] || u;
}

function convertToBaseUnit(amount: number, unit: string): { amount: number; unit: string } {
  if (unit === 'tsp') {
    return { amount: amount / 3, unit: 'tbsp' };
  }
  if (unit === 'lb') {
    return { amount: amount * 16, unit: 'oz' };
  }
  if (unit === 'kg') {
    return { amount: amount * 1000, unit: 'g' };
  }
  return { amount, unit };
}

function finalizeDisplayAmount(amount: number, unit: string): { finalAmount: number; finalUnit: string } {
  if (unit === 'tbsp' && amount < 1) {
    return { finalAmount: amount * 3, finalUnit: 'tsp' };
  }
  if (unit === 'oz' && amount >= 16) {
    return { finalAmount: amount / 16, finalUnit: 'lb' };
  }
  if (unit === 'g' && amount >= 1000) {
    return { finalAmount: amount / 1000, finalUnit: 'kg' };
  }
  return { finalAmount: amount, finalUnit: unit };
}

export function formatQuantityNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const remainder = rounded - whole;

  const fractionMap: Array<{ val: number; label: string }> = [
    { val: 0.25, label: '1/4' },
    { val: 0.33, label: '1/3' },
    { val: 0.5, label: '1/2' },
    { val: 0.67, label: '2/3' },
    { val: 0.75, label: '3/4' },
  ];

  for (const frac of fractionMap) {
    if (Math.abs(remainder - frac.val) < 0.04) {
      return whole > 0 ? `${whole} ${frac.label}` : frac.label;
    }
  }

  if (Math.abs(remainder) < 0.02) {
    return String(whole);
  }

  return Number(rounded.toFixed(2)).toString();
}

function formatUnitWithPlural(amount: number, unit: string, itemName: string): string {
  const qtyStr = formatQuantityNumber(amount);
  if (!unit || unit === 'whole') {
    return qtyStr;
  }
  if (amount > 1) {
    const plurals: Record<string, string> = {
      cup: 'cups',
      clove: 'cloves',
      slice: 'slices',
      leaf: 'leaves',
      head: 'heads',
    };
    return `${qtyStr} ${plurals[unit] || unit}`;
  }
  // Avoid redundant "1 medium Medium" if unit is descriptive
  void itemName;
  return `${qtyStr} ${unit}`;
}

export function aggregateGroceryList(
  mealPlan: MealPlan,
  recipes: Recipe[],
  checkedKeys: Record<string, boolean>
): AggregatedGroceryItem[] {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  interface Bucket {
    name: string;
    totalAmount: number;
    unit: string;
    aisle: GroceryAisle;
    sources: Set<string>;
  }

  const buckets = new Map<string, Bucket>();

  for (const day of DAYS_OF_WEEK) {
    const dayMeals = mealPlan[day.key];
    for (const mealType of MEAL_TYPES) {
      const entries = dayMeals[mealType.key] || [];
      for (const entry of entries) {
        const recipe = recipeMap.get(entry.recipeId);
        if (!recipe) continue;

        const scale = entry.servingsMultiplier / (recipe.servings || 1);

        for (const ing of recipe.ingredients) {
          const { canonicalKey, displayName } = normalizeIngredientName(ing.name);
          const normUnit = normalizeUnit(ing.unit);
          const { amount: baseAmount, unit: baseUnit } = convertToBaseUnit(ing.amount * scale, normUnit);

          const bucketKey = `${ing.aisle}::${canonicalKey}::${baseUnit}`;
          const existing = buckets.get(bucketKey);

          if (existing) {
            existing.totalAmount += baseAmount;
            existing.sources.add(recipe.title);
          } else {
            buckets.set(bucketKey, {
              name: displayName,
              totalAmount: baseAmount,
              unit: baseUnit,
              aisle: ing.aisle,
              sources: new Set([recipe.title]),
            });
          }
        }
      }
    }
  }

  const items: AggregatedGroceryItem[] = [];

  for (const [key, bucket] of buckets.entries()) {
    const { finalAmount, finalUnit } = finalizeDisplayAmount(bucket.totalAmount, bucket.unit);
    items.push({
      key,
      name: bucket.name,
      totalAmount: finalAmount,
      unit: finalUnit,
      displayQuantity: formatUnitWithPlural(finalAmount, finalUnit, bucket.name),
      aisle: bucket.aisle,
      sources: Array.from(bucket.sources),
      checked: Boolean(checkedKeys[key]),
    });
  }

  const aisleOrder = new Map(GROCERY_AISLES.map((a, idx) => [a, idx]));
  return items.sort((a, b) => {
    const aisleDiff = (aisleOrder.get(a.aisle) ?? 99) - (aisleOrder.get(b.aisle) ?? 99);
    if (aisleDiff !== 0) return aisleDiff;
    return a.name.localeCompare(b.name);
  });
}

export function formatGroceryListAsText(
  items: AggregatedGroceryItem[],
  customItems: CustomGroceryItem[],
  includeChecked = true
): string {
  const lines: string[] = ['VERDANTTABLE — WEEKLY GROCERY LIST', ''];

  for (const aisle of GROCERY_AISLES) {
    const aisleItems = items.filter((i) => i.aisle === aisle && (includeChecked || !i.checked));
    const aisleCustom = customItems.filter((c) => c.aisle === aisle && (includeChecked || !c.checked));

    if (aisleItems.length === 0 && aisleCustom.length === 0) continue;

    lines.push(`${aisle.toUpperCase()}`);
    for (const item of aisleItems) {
      const box = item.checked ? '[x]' : '[ ]';
      lines.push(`  ${box} ${item.displayQuantity} ${item.name}`);
    }
    for (const custom of aisleCustom) {
      const box = custom.checked ? '[x]' : '[ ]';
      const qty = custom.quantity ? `${custom.quantity} ` : '';
      lines.push(`  ${box} ${qty}${custom.name}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
