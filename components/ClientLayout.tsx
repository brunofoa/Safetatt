import React, { useState } from 'react';
import { Screen } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ClientLayoutProps {
    children: React.ReactNode;
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children, currentScreen, onNavigate }) => {
    const { user, signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        setIsSidebarOpen(false);
    };

    const handleNavigate = (screen: Screen) => {
        onNavigate(screen);
        setIsSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans relative overflow-x-hidden">

            {/* Floating Header */}
            <div className="fixed top-4 left-4 right-4 z-50">
                <header className="bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full h-16 flex items-center justify-between px-4 shadow-xl shadow-black/20">
                    {/* Menu Button */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors"
                    >
                        <span className="material-icons">menu</span>
                    </button>


                    {/* User Avatar (Profile shortcut) */}
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-xs text-zinc-400">
                                {user?.name?.charAt(0) || 'U'}
                            </span>
                        )}
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="flex-1 pt-28 px-4 pb-10 overflow-y-auto">
                {children}
            </main>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar Drawer */}
            <aside
                className={`fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-zinc-900 border-r border-white/10 z-[70] transform transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-xl text-white">Menu</h3>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-500 hover:text-white">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => handleNavigate(Screen.CLIENT_HOME)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${currentScreen === Screen.CLIENT_HOME ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <span className="material-icons">home</span>
                        Início
                    </button>

                    <button
                        onClick={() => handleNavigate(Screen.CLIENT_CARE)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${currentScreen === Screen.CLIENT_CARE ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <span className="material-icons">medical_services</span>
                        Cuidados
                    </button>

                    <button
                        onClick={() => handleNavigate(Screen.CLIENT_HISTORY)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${currentScreen === Screen.CLIENT_HISTORY ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <span className="material-icons">history</span>
                        Histórico
                    </button>

                    <button
                        onClick={() => handleNavigate(Screen.CLIENT_FINANCIAL)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${currentScreen === Screen.CLIENT_FINANCIAL ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-white font-bold' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <span className="material-icons">attach_money</span>
                        Financeiro
                    </button>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium"
                    >
                        <span className="material-icons">logout</span>
                        Sair
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default ClientLayout;
