import { PATTERNS, ROOT_CAUSES, EXERCISE_CODES } from '../data/dummy';
import { FilterBar, useFilters } from '../components/FilterBar';
import './Patterns.css';

export function Patterns() {
  const { activeCategory, activeExercise } = useFilters();

  const filtered = PATTERNS.filter((p) => {
    if (activeCategory && p.rootCause !== activeCategory) return false;
    if (activeExercise && !p.exercisesAffected.includes(activeExercise)) return false;
    return true;
  });

  return (
    <>
      <div className="view-header">
        <h1>Patterns</h1>
        {(activeCategory || activeExercise) && (
          <span className="view-count">{filtered.length} shown</span>
        )}
      </div>

      <FilterBar categories={ROOT_CAUSES} exercises={EXERCISE_CODES} />

      <div className="view-scroll">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No patterns match these filters.</p>
          </div>
        ) : (
          <div className="view-content">
            {filtered.map((p) => (
              <div key={p.id} className="pattern-card card">
                <div className="pattern-card__top">
                  <span className="pattern-card__count">{p.sessions} sessions</span>
                  <span className="pattern-card__since">since {p.firstNoted}</span>
                </div>
                <h2 className="pattern-card__name">{p.pattern}</h2>
                <div className="tag-row">
                  <span className="chip chip--accent">{p.rootCause}</span>
                </div>
                {p.exercisesAffected.length > 0 && (
                  <div className="tag-row">
                    {p.exercisesAffected.map((ex) => (
                      <span key={ex} className="chip chip--exercise">{ex}</span>
                    ))}
                  </div>
                )}
                {p.exercisesAffected.length === 0 && (
                  <div className="tag-row">
                    <span className="chip chip--exercise chip--pending">pending mapping</span>
                  </div>
                )}
                <div className="divider" />
                <div className="pattern-card__impact-label">Exam impact</div>
                <p className="pattern-card__impact">{p.examImpact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
