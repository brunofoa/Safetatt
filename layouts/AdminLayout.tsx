
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Screen } from '../types';

interface AdminLayoutProps {
    children: React.ReactNode;
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentScreen, onNavigate }) => {
    const { session } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!session?.user) {
                // If App component handles redirection, maybe we don't need this, 
                // but for safety let's leave state blank/loading or handle it.
                // Assuming App.tsx handles auth check before rendering.
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('is_platform_admin')
                .eq('id', session.user.id)
                .single();

            if (error || !data?.is_platform_admin) {
                console.error('Access Denied: Not an admin');
                onNavigate(Screen.STUDIO_SELECTION);
            } else {
                setIsAdmin(true);
            }
        };

        checkAdmin();
    }, [session, onNavigate]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (isAdmin === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
                <span className="material-icons animate-spin text-4xl">sync</span>
            </div>
        );
    }

    const navItems = [
        { screen: Screen.ADMIN_DASHBOARD, icon: 'dashboard', label: 'Dashboard' },
        { screen: Screen.ADMIN_STUDIOS, icon: 'store', label: 'Estúdios' },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 flex font-sans relative">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30 w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col transition-transform duration-300
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-zinc-800 flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src="/safetatt-logo.png"
                            alt="Safetatt"
                            className="h-16 w-auto object-contain"
                        />
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-zinc-400 hover:text-white"
                    >
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = currentScreen === item.screen;
                        return (
                            <button
                                key={item.screen}
                                onClick={() => {
                                    onNavigate(item.screen);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-zinc-800 text-white font-bold shadow-inner border border-zinc-700'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                    }`}
                            >
                                <span className={`material-icons ${isActive ? 'text-[#92FFAD]' : ''}`}>{item.icon}</span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={() => onNavigate(Screen.STUDIO_SELECTION)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all text-sm"
                    >
                        <span className="material-icons">arrow_back</span>
                        Voltar ao App
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-auto h-screen flex flex-col">
                <header className="px-4 md:px-8 py-4 md:py-6 border-b border-zinc-800/50 flex justify-between items-center sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white bg-zinc-900/50 rounded-lg border border-zinc-800"
                        >
                            <span className="material-icons">menu</span>
                        </button>
                        <h2 className="font-bold text-lg md:text-xl capitalize text-white truncate max-w-[200px] md:max-w-none">
                            {currentScreen === Screen.ADMIN_DASHBOARD ? 'Dashboard' :
                                currentScreen === Screen.ADMIN_NEW_STUDIO ? 'Novo Estúdio' : 'Gestão de Estúdios'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                            AD
                        </div>
                    </div>
                </header>
                <div className="p-4 md:p-8 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
