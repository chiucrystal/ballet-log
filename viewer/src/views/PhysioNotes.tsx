import { PHYSIO_NOTES } from '../data/dummy';
import './PhysioNotes.css';

export function PhysioNotes() {
  return (
    <>
      <div className="view-header">
        <h1>Physio</h1>
      </div>
      <div className="view-scroll">
        <div className="view-content">
          {PHYSIO_NOTES.map((note) => (
            <div key={note.date} className="card physio-card">
              <div className="physio-card__header">
                <span className={`source-badge source-badge--physio`}>Physio</span>
                <span className="physio-card__date">
                  {new Date(note.date).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className="physio-card__practitioner">{note.practitioner}</p>
              <ul className="physio-card__notes">
                {note.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
