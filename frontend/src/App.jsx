import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import AuthModal from './components/common/AuthModal';
import ProductTour from './components/common/ProductTour';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '729927667402-k6hksmher65amh9ufkfckd64m3762gja.apps.googleusercontent.com';

function EditorRouteWrapper() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <EditorPage
      projectId={id}
      onBack={() => navigate('/dashboard')}
    />
  );
}

function DashboardRouteWrapper() {
  const navigate = useNavigate();

  return (
    <DashboardPage
      onSelectProject={(projectId) => navigate(`/editor/${projectId}`)}
    />
  );
}

function MainApp() {
  const { theme } = useTheme();
  const [tourOpen, setTourOpen] = useState(() => {
    return !localStorage.getItem('auto_captions_tour_seen');
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 overflow-x-hidden w-full max-w-full">
      <Header onOpenTour={() => setTourOpen(true)} />

      <main className="flex-1 pb-16 sm:pb-12 w-full max-w-full overflow-x-hidden">
        <Routes>
          <Route path="/" element={<DashboardRouteWrapper />} />
          <Route path="/dashboard" element={<DashboardRouteWrapper />} />
          <Route path="/editor/:id" element={<EditorRouteWrapper />} />
          <Route path="/generation/:id" element={<EditorRouteWrapper />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<DashboardRouteWrapper />} />
        </Routes>
      </main>

      <AuthModal />
      <ProductTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === 'light' ? '#ffffff' : '#18181b',
            color: theme === 'light' ? '#0f172a' : '#f4f4f5',
            border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #27272a',
            borderRadius: '0.75rem',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#eab308',
              secondary: theme === 'light' ? '#ffffff' : '#18181b',
            },
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MainApp />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
