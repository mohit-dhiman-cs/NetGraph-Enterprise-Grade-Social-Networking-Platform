import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar             from './components/Sidebar';
import TopNav              from './components/TopNav';
import MobileNav           from './components/MobileNav';
import FeedPage            from './pages/FeedPage';
import DiscoverPage        from './pages/DiscoverPage';
import MessagesPage        from './pages/MessagesPage';
import AdminPage           from './pages/AdminPage';
import ProfilePage         from './pages/ProfilePage';
import SearchPage          from './pages/SearchPage';
import NotificationsPage   from './pages/NotificationsPage';
import GraphPage           from './pages/GraphPage';
import AiPage              from './pages/AiPage';
import DevPortalPage       from './pages/DevPortalPage';
import './index.css';
import './App.css';

function AppLayout() {
  return (
    <div className="font-body-md text-on-surface selection:bg-primary-container selection:text-white bg-background min-h-screen">
      <TopNav />
      <main className="max-w-max-width mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-gutter pt-lg pb-xxl">
        <Sidebar />
        <section className="col-span-1 md:col-span-9 lg:col-span-10 flex flex-col gap-lg">
          <Routes>
            <Route path="/feed"             element={<FeedPage />} />
            <Route path="/search"           element={<SearchPage />} />
            <Route path="/discover"         element={<DiscoverPage />} />
            <Route path="/messages"         element={<MessagesPage />} />
            <Route path="/notifications"    element={<NotificationsPage />} />
            <Route path="/graph"            element={<GraphPage />} />
            <Route path="/ai"              element={<AiPage />} />
            <Route path="/dev"             element={<DevPortalPage />} />
            <Route path="/profile/:id"      element={<ProfilePage />} />
            <Route path="/profile"          element={<ProfilePage />} />
            <Route path="/admin"            element={<AdminPage />} />
            <Route path="*"                 element={<Navigate to="/feed" replace />} />
          </Routes>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{ style: { background: '#16161f', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.07)' } }}
          />
          <Routes>
            <Route path="/"  element={<Navigate to="/feed" replace />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
