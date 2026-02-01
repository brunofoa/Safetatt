import React, { useState, useEffect } from 'react';
import AppointmentDetailsModal from '../components/AppointmentDetailsModal';
import ErrorBoundary from '../components/ErrorBoundary'; // Import ErrorBoundary
import { useAuth } from '../contexts/AuthContext';
import { sessionService } from '../services/sessionService';
import { teamService, TeamMember } from '../services/teamService';
import { Appointment } from '../types';


interface AppointmentsProps {
  onNewAppointment: () => void;
}

// Date formatting helper
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Check if date is in current week
const isDateInThisWeek = (dateString: string) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return date >= firstDay && date <= lastDay;
};

const Appointments: React.FC<AppointmentsProps> = ({ onNewAppointment }) => {
  const { currentStudio } = useAuth(); // Import useAuth if missing
  // State for Pagination and Filters
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 10;

  const [searchTerm, setSearchTerm] = useState('');
  // Debounce search term
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Filter by Professional
  const [professionals, setProfessionals] = useState<TeamMember[]>([]);
  const [filterProfessionalId, setFilterProfessionalId] = useState<string | null>(null);
  const [showProfessionalMenu, setShowProfessionalMenu] = useState(false);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = Recente, asc = Antigo
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Effect to debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchAppointments = async () => {
    if (!currentStudio?.id) return;

    console.log('fetchAppointments called with:', {
      studioId: currentStudio.id,
      page,
      search: debouncedSearch,
      statusFilter,
      professionalId: filterProfessionalId,
      sortOrder
    });

    setIsLoading(true);
    try {
      const { data, count } = await sessionService.getSessionsLight(
        currentStudio.id,
        page,
        LIMIT,
        {
          search: debouncedSearch,
          status: statusFilter || undefined,
          professionalId: filterProfessionalId || undefined,
          sortOrder: sortOrder
        }
      );

      // Map Session data to Appointment-like structure for the UI
      const mappedData = data.map((s: any) => {
        const dateStr = s.performed_date || s.created_at;
        return {
          ...s,
          artist: s.artistName,
          date: dateStr,
          start_time: dateStr,
          end_time: dateStr,
          time: (() => {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          })(),
          clientAvatar: s.clientAvatar || '',
          status: mapSessionStatus(s.status),
        };
      });

      setAppointments(mappedData);
      setTotalCount(count);
    } catch (error: any) {
      console.error("Failed to fetch appointments", error);
      setErrorMsg(error.message || JSON.stringify(error));
    } finally {
      setIsLoading(false);
    }
  };

  const mapSessionStatus = (status: string): string => {
    const map: Record<string, string> = {
      'draft': 'Pendente',
      'pending': 'Pendente',
      'in_progress': 'Confirmado',
      'completed': 'Finalizado',
      'canceled': 'Cancelado'
    };
    return map[status] || 'Confirmado';
  };

  // Fetch when dependencies change
  useEffect(() => {
    console.log('useEffect triggered - dependencies:', {
      studioId: currentStudio?.id,
      page,
      debouncedSearch,
      statusFilter,
      filterProfessionalId,
      sortOrder
    });

    if (currentStudio?.id) {
      fetchAppointments();
    }
  }, [currentStudio?.id, page, debouncedSearch, statusFilter, filterProfessionalId, sortOrder]);

  // Fetch Professionals for Filter
  useEffect(() => {
    if (currentStudio?.id) {
      teamService.getTeamMembers(currentStudio.id).then(setProfessionals);
    }
  }, [currentStudio?.id]);

  const handleOpenDetails = async (appointment: Appointment) => {
    // Optimistic set
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);

    // Lazy load full details if needed is handled inside the Modal by fetching specific session ID
    // Check AppointmentDetailsModal implementation - confirmed it fetches getSessionById
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Pendente':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Finalizado':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // No longer needed client-side filter here
  // const filteredAppointments = ... 
  // We use 'appointments' state directly now.

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className="px-6 max-w-7xl mx-auto min-h-screen pb-20">

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Erro:</strong>
          <span className="block sm:inline"> {errorMsg}</span>
        </div>
      )}
      <ErrorBoundary>
        <AppointmentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          appointment={selectedAppointment}
        />
      </ErrorBoundary>

      {/* We are reusing the parent's logic for New Appointment button, 
          but we also need to expose a way to refresh the list if that modal saves.
          If `onNewAppointment` opens a modal in `App.tsx` or similar, we might need a refresh button or mechanism.
          For now, I'll add a separate Create Modal inside here IF the button is clicked, 
          OR rely on the prop.
          Wait, looking at the previous file content, `NewAppointmentModal` wasn't used inside plain `Appointments`.
          It was imported but unused? No, checking lines...
          Line 3 imports it but line 173 starts rendering.
          Line 179 calls `onNewAppointment`. 
          Let's assume the user uses the button provided.
       */}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight dark:text-zinc-50 mb-2 capitalize">Atendimentos</h1>
          <p className="text-slate-500 dark:text-zinc-400 font-medium">Gerencie sua agenda e sessões de hoje</p>
        </div>
        <button
          onClick={onNewAppointment}
          className="btn-gradient text-black font-bold py-3.5 px-8 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="material-icons">add_circle</span>
          Novo Atendimento
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1 group">
          <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 group-focus-within:text-[#5CDFF0] transition-colors">search</span>
          <input
            className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-[#333333] rounded-2xl pl-12 py-3.5 focus:border-transparent focus:ring-2 focus:ring-[#92FFAD] dark:text-zinc-50 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
            placeholder="Buscar por nome do cliente..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">

          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`px-6 py-3.5 border rounded-2xl font-bold text-xs tracking-widest flex items-center gap-2 transition-all shadow-sm group 
              ${sortOrder !== 'desc'
                  ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black border-transparent'
                  : 'bg-white dark:bg-zinc-900 border-[#333333] dark:border-zinc-800 text-black dark:text-zinc-50 hover:bg-gray-50'
                }`}
            >
              <span className="material-icons text-xl">sort</span>
              Ordenar
            </button>
            {showSortMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-20 animate-fade-in-up">
                <button onClick={() => { setSortOrder('desc'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 dark:text-zinc-50 border-b border-gray-100 dark:border-zinc-800/50 ${sortOrder === 'desc' ? 'text-primary' : ''}`}>Mais Recente</button>
                <button onClick={() => { setSortOrder('asc'); setShowSortMenu(false); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 dark:text-zinc-50 ${sortOrder === 'asc' ? 'text-primary' : ''}`}>Mais Antigo</button>
              </div>
            )}
          </div>

          {/* Filters Button (Status) */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`px-6 py-3.5 border rounded-2xl font-bold text-xs tracking-widest flex items-center gap-2 transition-all shadow-sm group
                ${(statusFilter || filterProfessionalId)
                  ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black border-transparent'
                  : 'bg-white dark:bg-zinc-900 border-[#333333] dark:border-zinc-800 hover:bg-gray-50 text-black dark:text-zinc-50'
                }`}
            >
              <span className="material-symbols-outlined text-xl">tune</span>
              {statusFilter ? statusFilter : (filterProfessionalId ? 'Filtrado' : 'Filtros')}
              {(statusFilter || filterProfessionalId) && <span onClick={(e) => { e.stopPropagation(); setStatusFilter(null); setFilterProfessionalId(null); }} className="material-icons text-sm ml-1 hover:text-red-600">close</span>}
            </button>

            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-20 animate-fade-in-up">
                <button onClick={() => { setStatusFilter(null); setFilterProfessionalId(null); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 dark:text-zinc-50 border-b border-gray-100 dark:border-zinc-800/50">Todos</button>
                <button onClick={() => { setStatusFilter('Confirmado'); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 text-green-600">Confirmados</button>
                <button onClick={() => { setStatusFilter('Pendente'); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 text-orange-500">Pendentes</button>
                <button onClick={() => { setStatusFilter('Finalizado'); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 text-blue-500">Finalizados</button>

                <div className="border-t border-gray-100 dark:border-zinc-800/50 my-1"></div>
                <p className="px-4 py-2 text-[10px] uppercase font-bold text-gray-400">Profissional</p>
                {professionals.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setFilterProfessionalId(p.profile_id); setShowStatusMenu(false); }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 ${filterProfessionalId === p.profile_id ? 'text-[#5CDFF0]' : 'dark:text-zinc-50'}`}
                  >
                    {p.avatar_url && <img src={p.avatar_url} className="w-5 h-5 rounded-full" />}
                    {p.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Date Filter removed as per optimization plan */}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-[#333333] dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800">
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-[0.2em]">Cliente</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-[0.2em]">Data</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-[0.2em]">Tatuador</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-[0.2em]">Título</th>
                <th className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-[0.2em] text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 dark:text-zinc-400 tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/30">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-gray-400 dark:text-zinc-400 animate-pulse">
                    Carregando atendimentos...
                  </td>
                </tr>
              ) : appointments.length > 0 ? (
                appointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0">
                          {app.clientAvatar ? (
                            <img src={app.clientAvatar} alt={app.clientName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              <span className="material-icons text-sm">person</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-gray-900 dark:text-zinc-50 tracking-tight">{app.clientName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-zinc-50">{formatDateDisplay(app.date)}</p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">{app.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-gray-900 dark:text-zinc-50 tracking-tight">{app.artist}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-zinc-50">{app.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium italic">{app.description?.slice(0, 20)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${getStatusStyles(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleOpenDetails(app)}
                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-primary hover:text-black transition-all flex items-center justify-center ml-auto group-hover:scale-105 shadow-sm"
                      >
                        <span className="material-icons text-lg">visibility</span>
                        <span className="ml-2 text-[10px] font-bold tracking-widest pr-1">Ver</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-gray-400 dark:text-zinc-400">
                    <span className="material-icons text-4xl mb-2 opacity-50 block">search_off</span>
                    <p>Nenhum atendimento encontrado para os filtros selecionados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-8 py-5 flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/50">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 tracking-widest">
            Mostrando <span className="text-gray-900 dark:text-zinc-50 font-bold">{appointments.length}</span> de {totalCount} atendimentos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            <span className="text-xs font-bold text-gray-500 px-2">{page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={appointments.length < LIMIT || (page * LIMIT) >= totalCount}
              className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
