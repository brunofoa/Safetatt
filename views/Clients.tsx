import React, { useState, useMemo, useEffect } from 'react';
import { Client } from '../types';
import NewClientModal from '../components/NewClientModal';
import Avatar from '../components/Avatar';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';


interface ClientsProps {
  onEditClient: (clientId: string) => void;
}

const parseDate = (dateStr: string) => {
  // Basic parser for "DD Mmm YYYY" or "DD/MM/YYYY" or ISO
  if (!dateStr || dateStr === '-') return new Date(0);

  const months: { [key: string]: number } = {
    'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
    'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11,
    'jan.': 0, 'fev.': 1, 'mar.': 2, 'abr.': 3, 'mai.': 4, 'jun.': 5,
    'jul.': 6, 'ago.': 7, 'set.': 8, 'out.': 9, 'nov.': 10, 'dez.': 11
  };

  // Try split by slash
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  }

  const parts = dateStr.replace('.', '').split(' ');
  if (parts.length < 3) return new Date();
  const day = parseInt(parts[0], 10);
  const month = months[parts[1]?.toLowerCase()] || 0;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

const formatDateCompact = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const date = parseDate(dateStr);
    // Format to dd/MM/yy
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(date);
  } catch (e) {
    return dateStr;
  }
};

const Clients: React.FC<ClientsProps> = ({ onEditClient }) => {
  const { currentStudio } = useAuth();
  const { permissions } = usePermissions();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'vip' | 'new'>('all');
  const [activeSort, setActiveSort] = useState<'name' | 'visits' | 'spent' | 'recent'>('name');

  const fetchClients = async () => {
    if (!currentStudio?.id) return;

    setIsLoading(true);
    try {
      const data = await clientService.getClients(currentStudio.id);
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentStudio?.id) {
      fetchClients();
    }
  }, [currentStudio?.id]);

  // Global Refresh Listener
  useEffect(() => {
    const handleRefresh = () => {
      if (currentStudio?.id) fetchClients();
    };
    window.addEventListener('refreshGlobalData', handleRefresh);
    return () => window.removeEventListener('refreshGlobalData', handleRefresh);
  }, [currentStudio?.id]);

  const handleClientSaved = () => {
    fetchClients();
    // Optional: show toast
  };

  const filteredClients = useMemo(() => {
    let result = clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply Filters
    if (activeFilter === 'vip') {
      result = result.filter(c => c.totalSpent > 1000);
    } else if (activeFilter === 'new') {
      result = result.filter(c => c.totalVisits <= 5); // Example criteria
    }

    // Apply Sort
    result.sort((a, b) => {
      switch (activeSort) {
        case 'visits':
          return b.totalVisits - a.totalVisits;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'recent':
          // If 'lastVisit' is '-' (new client), handle gracefully
          if (a.lastVisit === '-') return 1;
          if (b.lastVisit === '-') return -1;
          return parseDate(b.lastVisit).getTime() - parseDate(a.lastVisit).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [clients, searchTerm, activeFilter, activeSort]);

  return (
    <div className="px-6 max-w-7xl mx-auto min-h-screen pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50 mb-2 capitalize">Gestão de Clientes</h1>
          <p className="text-gray-500 dark:text-zinc-400 font-medium">Acompanhe o histórico e as preferências dos clientes do seu estúdio.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-gradient text-black font-bold py-4 px-8 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="material-icons text-xl">person_add</span>
          Novo Cliente
        </button>
      </div>

      <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleClientSaved} />

      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative w-full md:w-96 group">
          <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-focus-within:text-[#5CDFF0] transition-colors">search</span>
          <input
            className="w-full bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 rounded-2xl pl-12 py-3 focus:border-transparent focus:ring-2 focus:ring-[#92FFAD] text-gray-900 dark:text-zinc-50 outline-none transition-all"
            placeholder="Buscar por nome, e-mail ou telefone..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">

          {/* Filter Button */}
          <div className="relative flex-1 md:flex-none">
            <button
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className={`w-full md:w-auto px-6 py-3 border rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all group
               ${activeFilter !== 'all'
                  ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black border-transparent'
                  : 'bg-white dark:bg-zinc-900 border-[#333333] dark:border-zinc-800 hover:border-transparent hover:bg-gradient-to-r hover:from-[#92FFAD] hover:to-[#5CDFF0] hover:text-black dark:text-zinc-50'
                }`}
            >
              <span className="material-symbols-outlined text-xl">tune</span>
              Filtrar
            </button>

            {showFilterMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-[#333333] dark:border-zinc-800 overflow-hidden z-20 animate-fade-in-up">
                <button onClick={() => { setActiveFilter('all'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800/50 ${activeFilter === 'all' ? 'text-primary' : 'dark:text-zinc-50'}`}>Todos</button>
                <button onClick={() => { setActiveFilter('vip'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800/50 ${activeFilter === 'vip' ? 'text-primary' : 'dark:text-zinc-50'}`}>VIPs (+R$1000)</button>
                <button onClick={() => { setActiveFilter('new'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 ${activeFilter === 'new' ? 'text-primary' : 'dark:text-zinc-50'}`}>Novos Clientes</button>
              </div>
            )}
          </div>

          {/* Sort Button */}
          <div className="relative flex-1 md:flex-none">
            <button
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className={`w-full md:w-auto px-6 py-3 border rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all group
               ${activeSort !== 'name'
                  ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black border-transparent'
                  : 'bg-white dark:bg-zinc-900 border-[#333333] dark:border-zinc-800 hover:border-transparent hover:bg-gradient-to-r hover:from-[#92FFAD] hover:to-[#5CDFF0] hover:text-black dark:text-zinc-50'
                }`}
            >
              <span className="material-icons text-xl">sort</span>
              Ordenar
            </button>

            {showSortMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-[#333333] dark:border-zinc-800 overflow-hidden z-20 animate-fade-in-up">
                <button onClick={() => { setActiveSort('name'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800/50 ${activeSort === 'name' ? 'text-primary' : 'dark:text-zinc-50'}`}>Nome (A-Z)</button>
                <button onClick={() => { setActiveSort('visits'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800/50 ${activeSort === 'visits' ? 'text-primary' : 'dark:text-zinc-50'}`}>Mais Visitas</button>
                <button onClick={() => { setActiveSort('spent'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800/50 ${activeSort === 'spent' ? 'text-primary' : 'dark:text-zinc-50'}`}>Maior Gasto</button>
                <button onClick={() => { setActiveSort('recent'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 ${activeSort === 'recent' ? 'text-primary' : 'dark:text-zinc-50'}`}>Mais Recentes</button>
              </div>
            )}
          </div>

        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">
            <p>Carregando clientes...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div key={client.id} className="group bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 p-3 md:p-4 rounded-xl flex flex-row items-center gap-4 hover:shadow-xl hover:border-primary/50 transition-all duration-300">
              {/* Left: Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0">
                <Avatar
                  name={client.name}
                  src={client.avatar_url && !client.avatar_url.includes('ui-avatars') ? client.avatar_url : null}
                  className="w-full h-full"
                />
              </div>

              {/* Center: Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-zinc-50 truncate group-hover:text-primary transition-colors leading-tight">
                    {client.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 truncate mb-0.5">{client.email}</p>

                {/* Metrics Line */}
                <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                  <span>🎯 {client.totalVisits} sessões</span>
                  <span className="text-gray-300 dark:text-zinc-700">|</span>
                  <span>🕒 {formatDateCompact(client.lastVisit)}</span>
                </div>
              </div>

              {/* Right: Actions - Only show edit if user has permission */}
              {permissions.canViewClientProfile && (
                <div className="flex-shrink-0 ml-auto self-start md:self-center">
                  <button
                    onClick={() => onEditClient(client.id)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-white/5"
                  >
                    <span className="material-icons text-xl">edit</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">
            <span className="material-icons text-4xl mb-2 opacity-50">person_off</span>
            <p>Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>
    </div >
  );
};

export default Clients;
