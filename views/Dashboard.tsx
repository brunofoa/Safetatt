
import React from 'react';
import { User } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  UsersThree,
  CalendarCheck,
  CurrencyDollar,
  Package,
  CaretRight
} from '@phosphor-icons/react';

interface DashboardProps {
  user: User;
}

const DATA = [
  { name: 'Jan', value: 12000 },
  { name: 'Feb', value: 15000 },
  { name: 'Mar', value: 18500 },
  { name: 'Apr', value: 14000 },
  { name: 'May', value: 21000 },
  { name: 'Jun', value: 19000 },
  { name: 'Jul', value: 28000 },
  { name: 'Aug', value: 22000 },
  { name: 'Set', value: 31000 },
  { name: 'Out', value: 29000 },
  { name: 'Nov', value: 38000 },
  { name: 'Dez', value: 45000 },
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return (
    <div className="px-6 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-zinc-50">Bem-vindo, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 dark:text-zinc-400 font-medium italic">"A arte é a expressão da alma na pele."</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <UsersThree size={32} weight="duotone" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full">+5%</span>
          </div>
          <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Clientes totais</h3>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">1.248</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
              <CalendarCheck size={32} weight="duotone" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full">+12%</span>
          </div>
          <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Atendimentos totais</h3>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">3.520</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-xl p-6 hover:shadow-lg transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
              <CurrencyDollar size={32} weight="duotone" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full">+8.4%</span>
          </div>
          <h3 className="text-gray-500 dark:text-zinc-400 text-xs font-bold tracking-wider mb-1">Faturamento total</h3>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">R$ 158.400,00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">Faturamento mês a mês</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Visão geral do desempenho financeiro anual</p>
            </div>
            <select className="bg-gray-100 dark:bg-zinc-800 border-none rounded-lg text-xs font-bold focus:ring-primary text-gray-900 dark:text-zinc-50">
              <option>Ano 2024</option>
              <option>Ano 2023</option>
            </select>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#92FFAD" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#5CDFF0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33333322" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fafafa' }}
                  itemStyle={{ color: '#92FFAD' }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Area type="monotone" dataKey="value" stroke="#5CDFF0" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-[#333333] dark:border-zinc-800 shadow-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900 dark:text-zinc-50">Próximas Sessões</h2>
              <button className="text-blue-600 text-[10px] font-bold tracking-widest hover:underline">Ver todas</button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {[
                { time: '14:00', client: 'Ricardo Alvez', detail: 'Blackwork • Antebraço' },
                { time: '16:30', client: 'Juliana Mendes', detail: 'Fine Line • Costas' },
                { time: '09:00', client: 'Bruno Costa', detail: 'Old School • Perna', day: 'Amanhã' }
              ].map((session, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                  <div className="text-center min-w-[50px]">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">{session.day || 'Hoje'}</p>
                    <p className="text-lg font-extrabold leading-none text-gray-900 dark:text-zinc-50">{session.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{session.client}</p>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">{session.detail}</p>
                  </div>
                  <span className="text-gray-300 dark:text-zinc-600 group-hover:text-primary transition-colors">
                    <CaretRight size={20} weight="bold" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="btn-gradient p-6 rounded-xl relative overflow-hidden group cursor-pointer shadow-md">
            <div className="relative z-10 text-black">
              <div className="flex justify-between items-start mb-4">
                <Package size={32} weight="duotone" />
                <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded">Estoque Baixo</span>
              </div>
              <h3 className="text-lg font-bold mb-1">Tintas Preto Intenso</h3>
              <p className="text-xs font-medium opacity-80">Apenas 2 frascos restantes. Recomendamos repor o estoque hoje.</p>
            </div>
            <div className="absolute top-0 right-0 p-4 translate-x-1/2 -translate-y-1/2 bg-black/5 rounded-full w-32 h-32 group-hover:scale-110 transition-transform"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
