import { useSearchParams } from 'react-router-dom';
import { EXERCISES, PATTERNS, SESSIONS, EXERCISE_CODES } from '../data/dummy';
import type { ExerciseCode } from '../types';
import './ByExercise.css';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ByExercise() {
  const [params, setParams] = useSearchParams();
  const active = (params.get('code') ?? 'AF-10') as ExerciseCode;

  function selectCode(code: ExerciseCode) {
    setParams({ code }, { replace: true });
  }

  const exercise = EXERCISES.find((e) => e.code === active);
  const relatedPatterns = PATTERNS.filter((p) => p.exercisesAffected.includes(active));
  const relatedSessions = SESSIONS.filter((s) =>
    s.corrections.some((c) => c.exercisesTagged?.includes(active))
  );

  return (
    <>
      <div className="view-header">
        <h1>Exercises</h1>
      </div>

      {/* Exercise selector */}
      <div className="exercise-tabs">
        {EXERCISE_CODES.map((code) => (
          <button
            key={code}
            className={['exercise-tab', active === code ? 'exercise-tab--active' : ''].join(' ')}
            onClick={() => selectCode(code)}
          >
            {code}
          </button>
        ))}
      </div>

      <div className="view-scroll">
        {exercise && (
          <>
            <div className="exercise-title-block">
              <span className="exercise-title-block__code">{exercise.code}</span>
              <h2 className="exercise-title-block__name">{exercise.name}</h2>
            </div>

            {/* Mark scheme corrections */}
            <div className="section-heading">Mark scheme corrections</div>
            <div className="view-content" style={{ paddingTop: 0 }}>
              <div className="card">
                {exercise.corrections.map((c) => (
                  <div key={c.criterion} className="criterion-block">
                    <div className="criterion-block__label">{c.criterion}</div>
                    <p className="criterion-block__notes">{c.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related patterns */}
            {relatedPatterns.length > 0 && (
              <>
                <div className="section-heading">Related patterns</div>
                <div className="view-content" style={{ paddingTop: 0 }}>
                  {relatedPatterns.map((p) => (
                    <div key={p.id} className="card exercise-related-pattern">
                      <span className="pattern-card__count">{p.sessions} sessions</span>
                      <span className="related-pattern__name">{p.pattern}</span>
                      <span className="chip chip--accent" style={{ marginTop: 6, display: 'inline-flex' }}>{p.rootCause}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Related sessions */}
            {relatedSessions.length > 0 && (
              <>
                <div className="section-heading">Session history</div>
                <div className="view-content" style={{ paddingTop: 0 }}>
                  {relatedSessions.map((s) => {
                    const relevantBlocks = s.corrections.filter((c) =>
                      c.exercisesTagged?.includes(active)
                    );
                    return (
                      <div key={s.date} className="card">
                        <div className="session-card__header">
                          <span className="session-card__date">{formatDate(s.date)}</span>
                          <span className={`source-badge source-badge--${s.source}`}>
                            {s.source}
                          </span>
                        </div>
                        {relevantBlocks.map((block) => (
                          <div key={block.rootCause} className="session-block">
                            <div className="root-cause-label">{block.rootCause}</div>
                            <ul className="session-block__bullets">
                              {block.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
