import { Plus } from 'lucide-react';

export type ActiveView = 'calendar' | 'recipes' | 'grocery' | 'preferences';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenNewRecipe: () => void;
  groceryRemainingCount: number;
}

const NAV_ITEMS: { id: ActiveView; label: string }[] = [
  { id: 'calendar', label: 'Meal Calendar' },
  { id: 'recipes', label: 'Recipe Library' },
  { id: 'grocery', label: 'Grocery List' },
  { id: 'preferences', label: 'Preferences' },
];

export function Header({
  activeView,
  onSelectView,
  onOpenNewRecipe,
  groceryRemainingCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectView('calendar')}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
          >
            VerdantTable
          </button>

          {/* Zone 2: Single-line Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 lg:gap-8 h-full"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`relative h-full inline-flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                    isActive
                      ? 'text-emerald-800'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>
                    {item.label}
                    {item.id === 'grocery' && groceryRemainingCount > 0 ? (
                      <span className="ml-1.5 font-mono text-xs tabular-nums text-stone-500">
                        ({groceryRemainingCount})
                      </span>
                    ) : null}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenNewRecipe}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-700"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>New Recipe</span>
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <nav
          aria-label="Mobile navigation"
          className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-stone-100 py-1.5 -mx-4 px-4"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`py-1.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  isActive
                    ? 'border-emerald-700 text-emerald-800'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
                {item.id === 'grocery' && groceryRemainingCount > 0
                  ? ` (${groceryRemainingCount})`
                  : ''}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
