import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { I18nProvider } from 'react-aria';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register'; // Import Register
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import IncomePage from './pages/IncomePage';
import ExpensePage from './pages/ExpensePage';
import GoalPage from './pages/GoalPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import VoiceRecords from './pages/VoiceRecords';
import LoadingScreen from './components/common/LoadingScreen';
import { Menu } from 'lucide-react';
import { db } from './lib/db';
import { useOfflineSync } from './hooks/useOfflineSync'; // Import the offline sync hook
import { Toaster } from 'react-hot-toast';
import { translations } from './lib/translations';
// Helper to protect private routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Shared layout for all authenticated pages to avoid repetitive JSX
const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <header className="h-16 flex items-center px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <Menu size={24} />
        </button>
      </header>
      <main className="flex-1 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
};

const TranslationContext = createContext();
export const useTranslation = () => useContext(TranslationContext);

// This internal component ensures hooks that use AuthContext are inside the Provider
const AppContent = () => {
  useOfflineSync(); // Initialize offline synchronization
  const { user, loading } = useAuth();

  const profile = useLiveQuery(
    () => (user ? db.profiles.get(user.id) : null),
    [user]
  );

  // Apply Dark Mode class to the document root
  useEffect(() => {
    // Default to 'light' if profile or theme is missing
    const currentTheme = profile?.theme || 'light';
    const isDark = currentTheme === 'dark';

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [profile?.theme]);

  // Memoize the translation function and add robust locale matching
  const t = useCallback((key) => {
    const lang = profile?.language || 'en-US';
    
    // 1. Try exact match (e.g., 'es-ES')
    // 2. Try base language match (e.g., if lang is 'es', find 'es-ES')
    const matchedLang = translations[lang] ? lang : 
                        Object.keys(translations).find(l => l.startsWith(lang.split('-')[0])) || 'en-US';

    return translations[matchedLang]?.[key] || translations['en-US']?.[key] || key;
  }, [profile?.language]);

  // Centralized date formatting based on user preference from settings
  const formatDate = useCallback((dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const formatStr = profile?.date_format || 'DD/MM/YYYY';
    
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();

    switch (formatStr) {
      case 'MM/DD/YYYY':
        return `${mm}/${dd}/${yyyy}`;
      case 'YYYY-MM-DD':
        return `${yyyy}-${mm}-${dd}`;
      default:
        return `${dd}/${mm}/${yyyy}`;
    }
  }, [profile?.date_format]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <I18nProvider locale={profile?.language || 'en-US'}>
      <TranslationContext.Provider value={{ t, profile, formatDate }}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Private Routes wrapped in both Authentication and the App Shell Layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expenses" element={<ExpensePage />} />
            <Route path="/goals" element={<GoalPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/voice-notes" element={<VoiceRecords />} />
          </Route>
        </Routes>
      </div>
      </TranslationContext.Provider>
    </I18nProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
