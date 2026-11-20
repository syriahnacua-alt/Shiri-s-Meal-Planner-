import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Trash2,
} from 'lucide-react';
import {
  AggregatedGroceryItem,
  CustomGroceryItem,
  GROCERY_AISLES,
  GroceryAisle,
} from '../types/mealPlanner';
import { formatGroceryListAsText } from '../utils/groceryAggregator';

interface GroceryListProps {
  items: AggregatedGroceryItem[];
  customItems: CustomGroceryItem[];
  onToggleItem: (key: string) => void;
  onToggleCustomItem: (id: string) => void;
  onAddCustomItem: (name: string, quantity: string, aisle: GroceryAisle) => void;
  onRemoveCustomItem: (id: string) => void;
  onResetChecks: () => void;
  onGoToCalendar: () => void;
}

export function GroceryList({
  items,
  customItems,
  onToggleItem,
  onToggleCustomItem,
  onAddCustomItem,
  onRemoveCustomItem,
  onResetChecks,
  onGoToCalendar,
}: GroceryListProps) {
  const [hideChecked, setHideChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newAisle, setNewAisle] = useState<GroceryAisle>('Pantry');

  const totalCount = items.length + customItems.length;
  const checkedCount =
    items.filter((i) => i.checked).length + customItems.filter((c) => c.checked).length;
  const remainingCount = totalCount - checkedCount;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const groupedAisles = useMemo(() => {
    return GROCERY_AISLES.map((aisle) => {
      const aisleAgg = items.filter((i) => i.aisle === aisle && (!hideChecked || !i.checked));
      const aisleCustom = customItems.filter(
        (c) => c.aisle === aisle && (!hideChecked || !c.checked)
      );
      return {
        aisle,
        aggItems: aisleAgg,
        customItems: aisleCustom,
        totalInAisle: aisleAgg.length + aisleCustom.length,
      };
    }).filter((g) => g.totalInAisle > 0);
  }, [items, customItems, hideChecked]);

  const handleCopy = async () => {
    const text = formatGroceryListAsText(items, customItems, true);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback clipboard method
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportTxt = () => {
    const text = formatGroceryListAsText(items, customItems, true);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'verdanttable-grocery-list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddCustomItem(newName.trim(), newQty.trim(), newAisle);
    setNewName('');
    setNewQty('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Weekly Grocery List
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Automatically consolidated from your scheduled meals and organized by supermarket aisle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleCopy}
            disabled={totalCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span className="text-emerald-800">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>Copy List</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportTxt}
            disabled={totalCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export .txt</span>
          </button>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-12 text-center space-y-3">
          <ShoppingBasket className="w-9 h-9 text-stone-300 mx-auto" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-stone-900">
            Your grocery list is empty
          </h2>
          <p className="text-sm text-stone-500 max-w-md mx-auto">
            Schedule meals on your weekly calendar or use Auto-Fill to generate a combined aisle-by-aisle shopping list.
          </p>
          <button
            type="button"
            onClick={onGoToCalendar}
            className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            Go to Meal Calendar
          </button>
        </div>
      ) : (
        <>
          {/* Progress & Quick Controls */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-stone-700">
                  Shopping Progress · {remainingCount} remaining
                </span>
                <span className="font-mono tabular-nums text-stone-600">
                  {checkedCount} / {totalCount} items ({progressPct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-700 transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 no-print">
              <label className="inline-flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideChecked}
                  onChange={(e) => setHideChecked(e.target.checked)}
                  className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
                />
                <span>Hide checked</span>
              </label>

              {checkedCount > 0 && (
                <button
                  type="button"
                  onClick={onResetChecks}
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Uncheck all</span>
                </button>
              )}
            </div>
          </div>

          {/* Add Extra Item Form */}
          <form
            onSubmit={handleAddExtra}
            className="bg-white border border-stone-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 no-print"
          >
            <input
              type="text"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              placeholder="Qty (e.g., 2 bunches)"
              aria-label="Extra item quantity"
              className="sm:w-36 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add extra item not in a recipe (e.g., Sparkling water, Coffee beans)..."
              aria-label="Extra grocery item name"
              className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <select
              aria-label="Extra item aisle"
              value={newAisle}
              onChange={(e) => setNewAisle(e.target.value as GroceryAisle)}
              className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white text-stone-700"
            >
              {GROCERY_AISLES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-700 rounded-lg transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Item</span>
            </button>
          </form>

          {/* Aisle-Grouped Columns */}
          {groupedAisles.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-sm text-stone-500">
              All items are checked off. Uncheck &ldquo;Hide checked&rdquo; above to review purchased items.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
              {groupedAisles.map(({ aisle, aggItems, customItems: aisleCustom, totalInAisle }) => (
                <section
                  key={aisle}
                  aria-label={`${aisle} aisle`}
                  className="bg-white border border-stone-200 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 bg-stone-50/70 border-b border-stone-200 flex items-center justify-between">
                    <h2 className="font-display text-sm font-semibold text-stone-900">
                      {aisle}
                    </h2>
                    <span className="text-xs font-mono tabular-nums text-stone-500">
                      {totalInAisle} {totalInAisle === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <ul className="divide-y divide-stone-100">
                    {aggItems.map((item) => (
                      <li key={item.key}>
                        <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50/70 transition-colors">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => onToggleItem(item.key)}
                            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
                          />
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-sm transition-colors ${
                                item.checked
                                  ? 'line-through text-stone-400'
                                  : 'text-stone-900'
                              }`}
                            >
                              <span className="font-mono tabular-nums font-medium mr-1.5">
                                {item.displayQuantity}
                              </span>
                              <span>{item.name}</span>
                            </div>
                            <p className="text-[11px] text-stone-400 truncate mt-0.5">
                              {item.sources.join(' · ')}
                            </p>
                          </div>
                        </label>
                      </li>
                    ))}

                    {aisleCustom.map((custom) => (
                      <li
                        key={custom.id}
                        className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-stone-50/70 transition-colors"
                      >
                        <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={custom.checked}
                            onChange={() => onToggleCustomItem(custom.id)}
                            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
                          />
                          <div
                            className={`text-sm truncate ${
                              custom.checked ? 'line-through text-stone-400' : 'text-stone-900'
                            }`}
                          >
                            {custom.quantity && (
                              <span className="font-mono tabular-nums font-medium mr-1.5">
                                {custom.quantity}
                              </span>
                            )}
                            <span>{custom.name}</span>
                          </div>
                        </label>
                        <button
                          type="button"
                          onClick={() => onRemoveCustomItem(custom.id)}
                          aria-label={`Remove ${custom.name}`}
                          className="p-1 text-stone-400 hover:text-orange-800 shrink-0 no-print"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
