import React from 'react';
import { User } from '../types';
import { List } from '@phosphor-icons/react';

interface FloatingHeaderProps {
    user: User;
    onToggleMenu: () => void;
}

const FloatingHeader: React.FC<FloatingHeaderProps> = ({ user, onToggleMenu }) => {
    return (
        <div className="fixed top-6 left-0 right-0 z-40 flex justify-center px-4">
            <header className="w-full max-w-7xl h-16 rounded-full bg-gradient-to-r from-[#333333] to-[#000000] shadow-2xl flex items-center justify-between px-6 border border-zinc-800 backdrop-blur-md">

                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <img src="/logo-safetatt.png" alt="Safetatt" className="h-8 w-auto object-contain" />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* User Mini Profile (Optional, nice to have for context) */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-300 text-right">
                            {user.name.split(' ')[0]}<br />
                            <span className="text-[10px] text-primary opacity-80 font-normal">{user.role}</span>
                        </span>
                    </div>

                    {/* Menu Toggle Button */}
                    <button
                        onClick={onToggleMenu}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all group"
                        aria-label="Abrir Menu"
                    >
                        <List size={24} weight="bold" className="text-white group-hover:scale-110 transition-transform" />
                    </button>
                </div>

            </header>
        </div>
    );
};

export default FloatingHeader;
