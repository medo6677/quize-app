import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// General Pages
import LandingPage from './pages/LandingPage';

// Student Pages
import JoinPage from './pages/student/Join';
import SessionPage from './pages/student/Session';

// Teacher Pages
import LoginPage from './pages/teacher/Login';
import DashboardPage from './pages/teacher/Dashboard';
import SessionViewPage from './pages/teacher/SessionView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Student Routes */}
        <Route path="/join" element={<JoinPage />} />
        <Route path="/session/:code" element={<SessionPage />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<LoginPage />} />
        <Route path="/teacher/dashboard" element={<DashboardPage />} />
        <Route path="/teacher/session/:id" element={<SessionViewPage />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
