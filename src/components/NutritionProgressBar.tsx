import { NutritionInfo } from '../types/mealPlanner';

interface NutritionProgressBarProps {
  current: NutritionInfo;
  target: NutritionInfo;
  variant?: 'compact' | 'detailed';
}

function getCalorieStatus(current: number, target: number): {
  label: string;
  barClass: string;
  textClass: string;
} {
  if (target <= 0) {
    return { label: 'No target', barClass: 'bg-stone-400', textClass: 'text-stone-600' };
  }
  const ratio = current / target;
  const diff = target - current;

  if (current === 0) {
    return {
      label: `${target.toLocaleString()} left`,
      barClass: 'bg-stone-300',
      textClass: 'text-stone-500',
    };
  }
  if (ratio > 1.08) {
    return {
      label: `Over ${Math.abs(diff)}`,
      barClass: 'bg-orange-700',
      textClass: 'text-orange-800',
    };
  }
  if (ratio >= 0.88) {
    return {
      label: 'On target',
      barClass: 'bg-emerald-700',
      textClass: 'text-emerald-800',
    };
  }
  return {
    label: `${diff.toLocaleString()} left`,
    barClass: 'bg-emerald-600',
    textClass: 'text-stone-600',
  };
}

export function NutritionProgressBar({
  current,
  target,
  variant = 'compact',
}: NutritionProgressBarProps) {
  const calPct = target.calories > 0 ? Math.min(100, Math.round((current.calories / target.calories) * 100)) : 0;
  const status = getCalorieStatus(current.calories, target.calories);

  if (variant === 'compact') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-1 text-xs">
          <span className="font-mono font-medium tabular-nums text-stone-900">
            {current.calories.toLocaleString()}
            <span className="text-stone-400 font-normal">/{target.calories.toLocaleString()}</span>
          </span>
          <span className={`text-[11px] font-medium tabular-nums whitespace-nowrap ${status.textClass}`}>
            {status.label}
          </span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={current.calories}
          aria-valuemin={0}
          aria-valuemax={target.calories}
          aria-label={`Daily calories: ${current.calories} of ${target.calories} kcal`}
        >
          <div
            className={`h-full rounded-full transition-all duration-200 ${status.barClass}`}
            style={{ width: `${calPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-500">
          <span>P {current.protein}g</span>
          <span>C {current.carbs}g</span>
          <span>F {current.fats}g</span>
        </div>
      </div>
    );
  }

  const macros = [
    { label: 'Protein', current: current.protein, target: target.protein, color: 'bg-emerald-700' },
    { label: 'Carbs', current: current.carbs, target: target.carbs, color: 'bg-stone-600' },
    { label: 'Fats', current: current.fats, target: target.fats, color: 'bg-orange-700' },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-stone-500">Daily Energy</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-mono text-xl font-semibold tabular-nums text-stone-900">
              {current.calories.toLocaleString()}
            </span>
            <span className="font-mono text-xs tabular-nums text-stone-500">
              / {target.calories.toLocaleString()} kcal
            </span>
          </div>
        </div>
        <span className={`text-xs font-medium tabular-nums ${status.textClass}`}>
          {status.label} ({calPct}%)
        </span>
      </div>

      <div
        className="h-2 w-full rounded-full bg-stone-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={current.calories}
        aria-valuemin={0}
        aria-valuemax={target.calories}
      >
        <div
          className={`h-full rounded-full transition-all duration-200 ${status.barClass}`}
          style={{ width: `${calPct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        {macros.map((m) => {
          const pct = m.target > 0 ? Math.min(100, Math.round((m.current / m.target) * 100)) : 0;
          return (
            <div key={m.label} className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-stone-600">{m.label}</span>
                <span className="font-mono tabular-nums text-stone-900 font-medium">
                  {m.current}
                  <span className="text-stone-400 font-normal">/{m.target}g</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${m.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
