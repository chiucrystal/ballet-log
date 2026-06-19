import { useSearchParams } from 'react-router-dom';
import type { RootCause, ExerciseCode } from '../types';
import './FilterBar.css';

interface FilterBarProps {
  categories?: readonly RootCause[];
  exercises?: readonly ExerciseCode[];
  categoryParam?: string;
  exerciseParam?: string;
}

export function FilterBar({
  categories = [],
  exercises = [],
  categoryParam = 'category',
  exerciseParam = 'exercise',
}: FilterBarProps) {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get(categoryParam) ?? '';
  const activeExercise = params.get(exerciseParam) ?? '';

  function toggleCategory(cat: RootCause) {
    const next = new URLSearchParams(params);
    if (activeCategory === cat) {
      next.delete(categoryParam);
    } else {
      next.set(categoryParam, cat);
    }
    setParams(next, { replace: true });
  }

  function toggleExercise(ex: ExerciseCode) {
    const next = new URLSearchParams(params);
    if (activeExercise === ex) {
      next.delete(exerciseParam);
    } else {
      next.set(exerciseParam, ex);
    }
    setParams(next, { replace: true });
  }

  const hasFilters = activeCategory || activeExercise;

  function clearAll() {
    const next = new URLSearchParams(params);
    next.delete(categoryParam);
    next.delete(exerciseParam);
    setParams(next, { replace: true });
  }

  return (
    <div className="filter-bar">
      {categories.length > 0 && (
        <div className="filter-bar__row" role="group" aria-label="Filter by root cause">
          {categories.map((cat) => (
            <button
              key={cat}
              className={['filter-pill', activeCategory === cat ? 'filter-pill--active' : ''].join(' ')}
              onClick={() => toggleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      {exercises.length > 0 && (
        <div className="filter-bar__row" role="group" aria-label="Filter by exercise">
          {exercises.map((ex) => (
            <button
              key={ex}
              className={['filter-pill filter-pill--exercise', activeExercise === ex ? 'filter-pill--active' : ''].join(' ')}
              onClick={() => toggleExercise(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
      {hasFilters && (
        <button className="filter-bar__clear" onClick={clearAll}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export function useFilters(categoryParam = 'category', exerciseParam = 'exercise') {
  const [params] = useSearchParams();
  return {
    activeCategory: (params.get(categoryParam) ?? '') as RootCause | '',
    activeExercise: (params.get(exerciseParam) ?? '') as ExerciseCode | '',
  };
}
