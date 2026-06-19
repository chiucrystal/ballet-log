import { SESSIONS, ROOT_CAUSES } from '../data/dummy';
import { FilterBar, useFilters } from '../components/FilterBar';
import './SessionLog.css';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SessionLog() {
  const { activeCategory } = useFilters();

  const filtered = SESSIONS.map((s) => {
    if (!activeCategory) return { ...s, corrections: s.corrections };
    const blocks = s.corrections.filter((c) => c.rootCause === activeCategory);
    return blocks.length > 0 ? { ...s, corrections: blocks } : null;
  }).filter(Boolean) as typeof SESSIONS;

  return (
    <>
      <div className="view-header">
        <h1>Sessions</h1>
        {activeCategory && (
          <span className="view-count">{filtered.length} sessions</span>
        )}
      </div>

      <FilterBar categories={ROOT_CAUSES} />

      <div className="view-scroll">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No sessions match this filter.</p>
          </div>
        ) : (
          <div className="view-content">
            {filtered.map((s) => (
              <div key={s.date} className="card session-card">
                <div className="session-card__header">
                  <span className="session-card__date">{formatDate(s.date)}</span>
                  <span className={`source-badge source-badge--${s.source}`}>
                    {s.source}
                  </span>
                </div>
                {s.corrections.map((block) => (
                  <div key={block.rootCause} className="session-block">
                    <div className="root-cause-label">{block.rootCause}</div>
                    {block.exercisesTagged && block.exercisesTagged.length > 0 && (
                      <div className="tag-row" style={{ marginBottom: 6, marginTop: 3 }}>
                        {block.exercisesTagged.map((ex) => (
                          <span key={ex} className="chip chip--exercise">{ex}</span>
                        ))}
                      </div>
                    )}
                    <ul className="session-block__bullets">
                      {block.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
