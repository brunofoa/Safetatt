import React from 'react';
import { Screen, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
    SquaresFour,
    CalendarCheck,
    FileText,
    Users,
    Gear,
    X,
    Sun,
    Moon,
    SignOut,
    CaretRight,
    Megaphone,
    Ticket
} from '@phosphor-icons/react';

interface NavigationDrawerProps {
    user: User;
    currentScreen: Screen;
    onNavigate: (screen: Screen) => void;
    isOpen: boolean;
    onClose: () => void;
}

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({ user, currentScreen, onNavigate, isOpen, onClose }) => {
    const { signOut } = useAuth();
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const handleLogout = async () => {
        await signOut();
        onClose();
        // Redirect handled by App.tsx observing auth state
    };

    const navItems = [
        { label: 'Dashboard', screen: Screen.DASHBOARD, icon: <SquaresFour size={24} weight="duotone" /> },
        { label: 'Agenda', screen: Screen.AGENDA, icon: <CalendarCheck size={24} weight="duotone" /> },
        { label: 'Atendimentos', screen: Screen.APPOINTMENTS, icon: <FileText size={24} weight="duotone" /> },
        { label: 'Clientes', screen: Screen.CLIENTS, icon: <Users size={24} weight="duotone" /> },
        { label: 'Marketing', screen: Screen.MARKETING, icon: <Megaphone size={24} weight="duotone" /> },
        { label: 'Cashback', screen: Screen.LOYALTY, icon: <Ticket size={24} weight="duotone" /> },
        { label: 'Configurações', screen: Screen.SETTINGS, icon: <Gear size={24} weight="duotone" /> },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-zinc-900 border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full p-6">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white tracking-tight">Menu</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={24} weight="bold" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.screen}
                                onClick={() => {
                                    onNavigate(item.screen);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group text-left ${currentScreen === item.screen
                                    ? 'bg-white/10 shadow-lg border border-white/5'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span className={`text-2xl ${currentScreen === item.screen ? 'text-[#92FFAD]' : 'text-gray-400 group-hover:text-white'
                                    }`}>
                                    {item.icon}
                                </span>
                                <span className={`font-medium text-base tracking-wide ${currentScreen === item.screen
                                    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] font-bold'
                                    : ''
                                    }`}>{item.label}</span>

                                {currentScreen === item.screen && (
                                    <span className="ml-auto text-primary">
                                        <CaretRight size={16} weight="bold" />
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-white/10 space-y-3">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/20 text-gray-400 hover:text-white transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {isDarkMode ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
                                <span className="text-sm font-medium">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
                            </div>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <SignOut size={20} weight="bold" />
                            Sair
                        </button>
                    </div>


                </div>
            </div>
        </>
    );
};

export default NavigationDrawer;
