import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Skeleton } from './components/ui/skeleton';

// General Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));

// Student Pages
const JoinPage = lazy(() => import('./pages/student/Join'));
const SessionPage = lazy(() => import('./pages/student/Session'));

// Teacher Pages
const LoginPage = lazy(() => import('./pages/teacher/Login'));
const DashboardPage = lazy(() => import('./pages/teacher/Dashboard'));
const SessionViewPage = lazy(() => import('./pages/teacher/SessionView'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen p-8 space-y-8 flex flex-col items-center justify-center">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-64 w-full max-w-2xl" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
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
