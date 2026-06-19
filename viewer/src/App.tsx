import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Home } from './views/Home';
import { Patterns } from './views/Patterns';
import { ByExercise } from './views/ByExercise';
import { SessionLog } from './views/SessionLog';
import { PhysioNotes } from './views/PhysioNotes';
import './components/BottomNav.css';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/exercises" element={<ByExercise />} />
          <Route path="/sessions" element={<SessionLog />} />
          <Route path="/physio" element={<PhysioNotes />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
