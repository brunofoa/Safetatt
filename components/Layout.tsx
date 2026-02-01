
import React, { useState } from 'react';
import { Screen, User } from '../types';
import FloatingHeader from './FloatingHeader';
import NavigationDrawer from './NavigationDrawer';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentScreen, onNavigate }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300 relative">

      {/* Floating Header (Fixed Top) */}
      <FloatingHeader user={user} onToggleMenu={() => setIsDrawerOpen(true)} />

      {/* Navigation Drawer (Overlay) */}
      <NavigationDrawer
        user={user}
        currentScreen={currentScreen}
        onNavigate={onNavigate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen pt-28 pb-10 px-4 md:px-8">
        <main className="w-full max-w-7xl mx-auto flex-1">
          {children}
        </main>

        <footer className="mt-10 py-6 text-center text-gray-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          © 2024 Safetatt Studio Management Platform
        </footer>
      </div>
    </div>
  );
};

export default Layout;
