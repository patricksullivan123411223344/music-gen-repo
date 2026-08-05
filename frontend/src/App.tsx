import { Routes, Route } from 'react-router-dom';
import MidiProvider from './context/MidiProvider.tsx';
import Navbar from './components/layout/Navbar.tsx';
import AnalysisPage from './pages/AnalysisPage.tsx';
import SessionPage from './pages/SessionPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';

function App() {
  return (
    <MidiProvider>
      <div className="app-shell">
        <Navbar />
        <div className="app-main">
          <Routes>
            <Route path="/" element={<SessionPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/session/:id/analysis" element={<AnalysisPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </MidiProvider>
  );
}

export default App;
