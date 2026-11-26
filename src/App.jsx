import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { SettingsProvider } from './contexts/SettingsContext.jsx';
import { ProfileProvider } from './contexts/ProfileContext.jsx';
import { ChatProvider } from './contexts/ChatContext.jsx';
import Header from './components/Header.jsx';
import { AsciiSpinner } from './components/AsciiPrimitives.jsx';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const ExplorePage = lazy(() => import('./pages/ExplorePage.jsx'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function RouteFallback() {
  return (
    <div className="container" style={{ paddingBlock: '3rem' }}>
      <AsciiSpinner label="Loading page" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ProfileProvider>
          <ChatProvider>
            <BrowserRouter>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <Header />
              <main id="main-content" tabIndex={-1}>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/roadmap/:career" element={<RoadmapPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
            </BrowserRouter>
          </ChatProvider>
        </ProfileProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
