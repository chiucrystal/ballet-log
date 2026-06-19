import { TOP_PRIORITIES } from '../data/dummy';
import './Home.css';

export function Home() {
  return (
    <>
      <div className="view-header">
        <h1>Priorities</h1>
        <span className="view-count">Dec 2026 exam</span>
      </div>
      <div className="view-scroll">
        <div className="view-content">
          {TOP_PRIORITIES.map((p) => (
            <div key={p.rank} className="priority-card card">
              <div className="priority-card__rank">#{p.rank}</div>
              <h2 className="priority-card__title">{p.title}</h2>
              <div className="tag-row">
                <span className="chip chip--accent">{p.rootCause}</span>
              </div>
              <p className="priority-card__desc">{p.description}</p>
              <div className="priority-card__why-box">
                <span className="priority-card__why-label">Why now</span>
                <p className="priority-card__why-text">{p.whyNow}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
