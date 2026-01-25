import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../../types';

interface ClientHomeProps {
    onNavigate: (screen: Screen) => void;
}

const ClientHome: React.FC<ClientHomeProps> = ({ onNavigate }) => {
    const { user, currentStudio } = useAuth();

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="flex flex-col items-center justify-center space-y-4 pt-2 pb-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-zinc-900">
                        Olá, {user?.name?.split(' ')[0] || 'Cliente'}
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-zinc-500 font-medium">Bem vindo (a) ao</span>
                        {currentStudio?.name && (
                            <span className="font-bold text-zinc-900">{currentStudio.name}</span>
                        )}
                        {currentStudio?.logo && (
                            <img src={currentStudio.logo} alt={currentStudio.name} className="h-6 w-6 object-cover rounded-full shadow-sm" />
                        )}
                        {!currentStudio?.name && !currentStudio?.logo && (
                            <span className="font-bold text-zinc-900">Estúdio</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Section - Cashback */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] border border-white/10 relative overflow-hidden shadow-2xl shadow-emerald-900/10">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <p className="text-emerald-900 text-sm font-bold mb-1 flex items-center gap-1">
                        <span className="material-icons text-sm">savings</span>
                        Seu Cashback
                    </p>
                    <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-sm">R$ 50,00</h2>
                    <p className="text-emerald-800 text-xs font-bold">disponíveis para sua próxima tattoo</p>
                </div>
            </div>

            {/* Quick Access - Shortcuts */}
            <div>
                <h3 className="text-lg font-bold mb-4 text-zinc-900 flex items-center gap-2">
                    Escolha uma opção abaixo
                </h3>
                <div className="grid grid-cols-1 gap-6">
                    {/* Card Cuidados */}
                    <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6">
                            <span className="material-icons text-zinc-900 text-3xl">medical_services</span>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-black mb-1">Cuidados</h3>
                            <p className="text-sm text-gray-500 font-medium tracking-wide">Dicas de preservação</p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => onNavigate(Screen.CLIENT_CARE)}
                                className="bg-black text-white py-3 pl-6 pr-5 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg shadow-zinc-200 group-hover:scale-105 active:scale-95 transition-all"
                            >
                                Entrar <span className="material-icons text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* Card Histórico */}
                    <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6">
                            <span className="material-icons text-zinc-900 text-3xl">history</span>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-black mb-1">Histórico</h3>
                            <p className="text-sm text-gray-500 font-medium tracking-wide">Galeria de sessões</p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => onNavigate(Screen.CLIENT_HISTORY)}
                                className="bg-black text-white py-3 pl-6 pr-5 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg shadow-zinc-200 group-hover:scale-105 active:scale-95 transition-all"
                            >
                                Entrar <span className="material-icons text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    {/* Card Financeiro */}
                    <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-6">
                            <span className="material-icons text-zinc-900 text-3xl">attach_money</span>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-black mb-1">Financeiro</h3>
                            <p className="text-sm text-gray-500 font-medium tracking-wide">Controle de gastos</p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => onNavigate(Screen.CLIENT_FINANCIAL)}
                                className="bg-black text-white py-3 pl-6 pr-5 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg shadow-zinc-200 group-hover:scale-105 active:scale-95 transition-all"
                            >
                                Entrar <span className="material-icons text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent/Next Appointment */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-zinc-900">Próxima Sessão</h3>
                <div className="p-4 rounded-2xl bg-white border border-[#333333] flex items-center gap-4 shadow-sm group hover:border-black transition-colors">
                    <div className="w-14 h-14 rounded-xl bg-zinc-100 flex flex-col items-center justify-center border border-zinc-200 shadow-inner group-hover:bg-zinc-200 transition-colors">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Out</span>
                        <span className="text-xl font-bold text-zinc-900">24</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-zinc-900 group-hover:text-black transition-colors">Fechamento Braço</h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                            <span className="material-icons text-[10px]">schedule</span>
                            14:00
                            <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                            Ink & Iron
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ClientHome;
