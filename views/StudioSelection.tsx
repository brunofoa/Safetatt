import React from 'react';
import { User, Studio } from '../../types';

interface StudioSelectionProps {
  user: User;
  onSelectStudio: (studio: Studio) => void;
}

const STUDIOS: Studio[] = [
  {
    id: 'studio_1',
    name: 'Ink & Iron Studio',
    owner: 'Kevin Ferguson',
    role: 'MASTER',
    logo: 'https://picsum.photos/seed/ink/200/200',
    memberCount: 15
  },
  {
    id: 'studio_2',
    name: 'Primal Mark Collective',
    owner: 'Kevin Ferguson',
    role: 'ARTIST',
    logo: 'https://picsum.photos/seed/primal/200/200',
    memberCount: 5
  },
  {
    id: 'studio_3',
    name: 'Eternal Ink Boutique',
    owner: 'Kevin Ferguson',
    role: 'CLIENT',
    logo: 'https://picsum.photos/seed/eternal/200/200',
    memberCount: 1
  }
];

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'MASTER': return 'MASTER';
    case 'ARTIST': return 'TATUADOR';
    case 'CLIENT': return 'CLIENTE';
    default: return role;
  }
};

const StudioSelection: React.FC<StudioSelectionProps> = ({ user, onSelectStudio }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <header className="fixed top-4 left-4 right-4 z-50 header-gradient h-16 rounded-2xl flex items-center justify-between px-6 shadow-2xl border border-zinc-800 glass-header">
        <div className="flex items-center gap-2">
          <span className="material-icons text-primary text-3xl">auto_fix_high</span>
          <span className="text-white font-extrabold text-xl tracking-tighter">Safetatt</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            onClick={() => document.documentElement.classList.toggle('dark')}
          >
            <span className="material-icons text-xl dark:hidden">dark_mode</span>
            <span className="material-icons text-xl hidden dark:block">light_mode</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-sm">
            KF
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Bem-vindo de volta, {user.name.split(' ')[0]}</h1>
          <p className="text-slate-500 dark:text-slate-400">Selecione qual estúdio você gostaria de gerenciar ou visualizar hoje.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STUDIOS.map((studio) => (
            <div
              key={studio.id}
              className="group relative bg-white dark:bg-zinc-900 border border-[#333333] p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => onSelectStudio(studio)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img alt={studio.name} className="object-cover w-full h-full opacity-80 group-hover:scale-110 transition-transform duration-500" src={studio.logo} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${studio.role === 'MASTER' ? 'bg-primary text-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                  {getRoleLabel(studio.role)}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">{studio.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{studio.owner}</p>

              <div className="flex items-center justify-end mt-auto">
                <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-primary hover:text-black dark:hover:bg-primary dark:hover:text-black transition-colors flex items-center gap-2">
                  Entrar <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}

          <div className="border-2 border-dashed border-slate-300 dark:border-[#333333] p-8 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors group">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1A1A1A] flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-black transition-colors">
              <span className="material-icons">add</span>
            </div>
            <h3 className="font-bold text-lg">Adicionar Novo Estúdio</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Conectar um novo estúdio de tatuagem</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudioSelection;
