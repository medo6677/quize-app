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
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
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
        </div>
        
        {/* Footer */}
        <footer className="w-full py-4 text-center text-sm text-gray-400 bg-black/10 backdrop-blur-sm border-t border-white/5">
          <p className="font-mono">
            Developed by <span className="text-primary font-bold">Mohamed A. AbdElfattah</span> | 01222306014
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
