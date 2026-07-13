import { Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider.tsx';
import MidiProvider from './context/MidiProvider.tsx';
import Navbar from './components/layout/Navbar.tsx';
import AnalysisPage from './pages/AnalysisPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SessionPage from './pages/SessionPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import SignupPage from './pages/SignupPage.tsx';

function App() {
  return (
    <AuthProvider>
      <MidiProvider>
        <div className="app-shell">
          <Navbar />
          <div className="app-main">
            <Routes>
              <Route path="/" element={<SessionPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/session/:id/analysis" element={<AnalysisPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Routes>
          </div>
        </div>
      </MidiProvider>
    </AuthProvider>
  );
}

export default App;
