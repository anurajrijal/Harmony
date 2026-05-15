import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import ServerSelect from './pages/ServerSelect.jsx';
import CommandsGuide from './pages/CommandsGuide.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import Overview from './pages/dashboard/Overview.jsx';
import MusicPanel from './pages/dashboard/MusicPanel.jsx';
import KeywordManager from './pages/dashboard/KeywordManager.jsx';
import RoleManager from './pages/dashboard/RoleManager.jsx';
import LogsViewer from './pages/dashboard/LogsViewer.jsx';
import Settings from './pages/dashboard/Settings.jsx';
import Greetings from './pages/dashboard/Greetings.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSkeleton />;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-discord border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1c2333', color: '#e2e8f0', border: '1px solid rgba(88,101,242,0.3)' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1c2333' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1c2333' } },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/callback" element={<AuthCallback />} />
          <Route path="/commands" element={<CommandsGuide />} />
          <Route path="/servers" element={<ProtectedRoute><ServerSelect /></ProtectedRoute>} />
          <Route path="/dashboard/:guildId" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="music" element={<MusicPanel />} />
            <Route path="keywords" element={<KeywordManager />} />
            <Route path="greetings" element={<Greetings />} />
            <Route path="roles" element={<RoleManager />} />
            <Route path="commands" element={<CommandsGuide />} />
            <Route path="logs" element={<LogsViewer />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
