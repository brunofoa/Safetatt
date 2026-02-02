
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  UsersThree,
  CalendarCheck,
  CurrencyDollar,
  CaretRight
} from '@phosphor-icons/react';
import { dashboardService, DashboardStats, AppointmentSession } from '../services/dashboardService';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { currentStudio } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    revenueByMonth: []
  });
  const [appointments, setAppointments] = useState<AppointmentSession[]>([]);

  useEffect(() => {
    if (currentStudio?.id) {
      loadDashboardData();
    }
  }, [currentStudio]);

  // Global Refresh Listener
  useEffect(() => {
    const handleRefresh = () => {
      if (currentStudio?.id) loadDashboardData();
    };
    window.addEventListener('refreshGlobalData', handleRefresh);
    return () => window.removeEventListener('refreshGlobalData', handleRefresh);
  }, [currentStudio]);

  const loadDashboardData = async () => {
    setLoading(true);
    if (!currentStudio?.id) return;

    try {
      const [statsData, appointmentsData] = await Promise.all([
        dashboardService.getStats(currentStudio.id),
        dashboardService.getUpcomingAppointments(currentStudio.id)
      ]);

      setStats(statsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFirstName = (name: string) => name ? name.split(' ')[0] : 'Usuário';

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-zinc-50">Bem-vindo, {getFirstName(user.name)}!</h1>
          <p className="text-gray-500 dark:text-zinc-400 font-medium italic">"A arte é a expressão da alma na pele."</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-3xl p-3 md:p-6 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
              <UsersThree size={32} weight="duotone" />
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Clientes totais</h3>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
            {loading ? '...' : stats.totalClients}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-3xl p-3 md:p-6 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600">
              <CalendarCheck size={32} weight="duotone" />
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Atendimentos totais</h3>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
            {loading ? '...' : stats.totalAppointments}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-3xl p-3 md:p-6 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600">
              <CurrencyDollar size={32} weight="duotone" />
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Faturamento total</h3>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-3xl p-3 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900 dark:text-zinc-50">Próximos Agendamentos</h2>
            <button className="text-blue-600 text-[10px] font-bold tracking-widest hover:underline">Ver todas</button>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum agendamento próximo.</p>
            ) : (
              appointments.map((appointment, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                  <div className="text-center min-w-[50px]">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">{appointment.day}</p>
                    <p className="text-lg font-extrabold leading-none text-gray-900 dark:text-zinc-50">{appointment.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{appointment.clientName}</p>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">{appointment.detail}</p>
                  </div>
                  <span className="text-gray-300 dark:text-zinc-600 group-hover:text-primary transition-colors">
                    <CaretRight size={20} weight="bold" />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-3xl p-3 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Faturamento mês a mês</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Visão geral do desempenho financeiro anual</p>
            </div>
            <select className="bg-gray-100 dark:bg-zinc-800 border-none rounded-2xl text-xs font-bold focus:ring-primary text-gray-900 dark:text-zinc-50">
              <option>Ano {new Date().getFullYear()}</option>
            </select>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByMonth}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#92FFAD" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#5CDFF0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33333322" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  width={45}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(0)}M`;
                    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
                    return `R$ ${value}`;
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fafafa' }}
                  itemStyle={{ color: '#92FFAD' }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Faturamento']}
                />
                <Area type="monotone" dataKey="value" stroke="#5CDFF0" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
