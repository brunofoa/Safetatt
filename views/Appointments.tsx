import React, { useState } from 'react';
import AppointmentDetailsModal from '../components/AppointmentDetailsModal';

interface AppointmentsProps {
  onNewAppointment: () => void;
}

// Helper for dynamic dates
const getDynamicDate = (daysOffset: number) => {
  const date = new React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d;
  }, [daysOffset]);
  return date;
};

// Date formatting helper
const formatDateDisplay = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === tomorrow.toDateString()) return 'Amanhã';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Check if date is in current week
const isDateInThisWeek = (date: Date) => {
  const today = new Date();
  const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
  const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return date >= firstDay && date <= lastDay;
};

const Appointments: React.FC<AppointmentsProps> = ({ onNewAppointment }) => {
  // Initialize Mock Data with stable dates
  const [mockData] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const past = new Date(today); past.setMonth(past.getMonth() - 1); // 1 month ago

    return [
      {
        id: '1',
        clientName: 'Marcus Vinicius',
        clientCpf: '123.***.***-00',
        clientAvatar: 'https://picsum.photos/seed/marcusv/100/100',
        dateObj: today,
        time: '14:30',
        artist: 'Kevin Ferguson',
        title: 'Blackwork',
        subtitle: 'Fechamento Braço',
        status: 'CONFIRMADO',
        // Extended Details
        clientPhone: '(11) 98765-4321',
        clientEmail: 'marcus.v@email.com',
        value: 'R$ 1.200,00',
        bodyPart: 'Braço Esquerdo (Fechamento)',
        size: '25cm x 15cm',
        style: 'Blackwork Geométrico',
        session: '2/3',
        description: 'Continuação do fechamento do braço com padrões geométricos e pontilhismo. Foco na parte interna do antebraço.',
        anamnesisAlert: 'Nenhuma alergia relatada.',
        notes: 'Cliente tolera bem sessões longas. Pausa a cada 2 horas.',
        tattooImage: 'https://picsum.photos/seed/tattoo1/400/400'
      },
      {
        id: '2',
        clientName: 'Ana Clara Silva',
        clientCpf: '456.***.***-89',
        clientAvatar: 'https://picsum.photos/seed/anac/100/100',
        dateObj: tomorrow,
        time: '10:00',
        artist: 'Kevin Ferguson',
        title: 'Fine Line',
        subtitle: 'Floral Minimalista',
        status: 'PENDENTE',
        // Extended Details
        clientPhone: '(11) 91234-5678',
        clientEmail: 'ana.clara@email.com',
        value: 'R$ 450,00',
        bodyPart: 'Pulso',
        size: '5cm x 3cm',
        style: 'Fine Line',
        session: '1/1',
        description: 'Pequeno arranjo floral no pulso. Traços muito finos (agulha 3RL).',
        anamnesisAlert: 'Pele sensível.',
        notes: 'Confirmar arte final antes de começar.',
        tattooImage: 'https://picsum.photos/seed/tattoo2/400/400'
      },
      {
        id: '3',
        clientName: 'Ricardo Mendes',
        clientCpf: '789.***.***-12',
        clientAvatar: 'https://picsum.photos/seed/ricm/100/100',
        dateObj: past,
        time: '09:00',
        artist: 'Kevin Ferguson',
        title: 'Realismo',
        subtitle: 'Retrato',
        status: 'FINALIZADO',
        // Extended Details
        clientPhone: '(11) 99887-7665',
        clientEmail: 'ricardo.m@email.com',
        value: 'R$ 2.500,00',
        bodyPart: 'Panturrilha',
        size: '20cm x 15cm',
        style: 'Realismo Preto e Cinza',
        session: '1/1',
        description: 'Retrato realista de animal de estimação.',
        anamnesisAlert: 'Nenhuma.',
        notes: 'Cicatrização da sessão anterior foi perfeita.',
        tattooImage: 'https://picsum.photos/seed/tattoo3/400/400'
      },
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [datePeriod, setDatePeriod] = useState<'all' | 'week'>('all');

  // Modal State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleOpenDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDENTE':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'FINALIZADO':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredAppointments = mockData.filter(app => {
    // 1. Search Logic
    const matchesSearch =
      app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.clientCpf.includes(searchTerm);

    // 2. Status Logic
    const matchesStatus = statusFilter ? app.status === statusFilter : true;

    // 3. Date Logic
    let matchesDate = true;
    if (datePeriod === 'week') {
      matchesDate = isDateInThisWeek(app.dateObj);
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="px-6 max-w-7xl mx-auto min-h-screen pb-20">
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
      />

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
            className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl pl-12 py-3.5 focus:border-transparent focus:ring-2 focus:ring-[#92FFAD] dark:text-zinc-50 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-all"
            placeholder="Buscar por nome do cliente ou CPF..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">

          {/* Filters Button (Status) */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`px-6 py-3.5 border rounded-2xl font-bold text-xs tracking-widest flex items-center gap-2 transition-all shadow-sm group
                ${statusFilter
                  ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black border-transparent'
                  : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-transparent hover:bg-gradient-to-r hover:from-[#92FFAD] hover:to-[#5CDFF0] hover:text-black dark:text-zinc-50'
                }`}
            >
              <span className="material-symbols-outlined text-xl">tune</span>
              {statusFilter ? statusFilter : 'Filtros'}
              {statusFilter && <span onClick={(e) => { e.stopPropagation(); setStatusFilter(null); }} className="material-icons text-sm ml-1 hover:text-red-600">close</span>}
            </button>

            {showStatusMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-20 animate-fade-in-up">
                <button onClick={() => { setStatusFilter(null); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 dark:text-zinc-50 border-b border-gray-100 dark:border-zinc-800/50">Todos</button>
                <button onClick={() => { setStatusFilter('CONFIRMADO'); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 text-green-600">Confirmados</button>
                <button onClick={() => { setStatusFilter('PENDENTE'); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 text-orange-500">Pendentes</button>
                <button onClick={() => { setStatusFilter('FINALIZADO'); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 text-blue-500">Finalizados</button>
              </div>
            )}
          </div>

          <button
            onClick={() => setDatePeriod(prev => prev === 'week' ? 'all' : 'week')}
            className={`px-6 py-3.5 border rounded-2xl font-bold text-xs tracking-widest flex items-center gap-2 transition-all shadow-sm group
                ${datePeriod === 'week'
                ? 'bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black border-transparent'
                : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-transparent hover:bg-gradient-to-r hover:from-[#92FFAD] hover:to-[#5CDFF0] hover:text-black dark:text-zinc-50'
              }`}
          >
            <span className="material-icons text-xl">calendar_today</span>
            Esta Semana
          </button>
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
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shrink-0">
                          <img src={app.clientAvatar} alt={app.clientName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-gray-900 dark:text-zinc-50 tracking-tight">{app.clientName}</p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">{app.clientCpf}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-zinc-50">{formatDateDisplay(app.dateObj)}</p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">{app.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-gray-900 dark:text-zinc-50 tracking-tight">{app.artist}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-zinc-50">{app.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium italic">{app.subtitle}</p>
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
            Mostrando <span className="text-gray-900 dark:text-zinc-50 font-bold">{filteredAppointments.length}</span> de {mockData.length} atendimentos
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50" disabled>
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            <button className="p-2 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors">
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
