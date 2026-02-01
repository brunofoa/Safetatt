
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState({
        activeStudios: 0,
        totalUsers: 0,
        newStudios: 0,
        cancelledStudios: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            // Active Studios
            const { count: activeCount } = await supabase
                .from('studios')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            // Cancelled/Inactive Studios
            const { count: inactiveCount } = await supabase
                .from('studios')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'active');

            // Total Users
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // New Studios (Last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { count: newCount } = await supabase
                .from('studios')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thirtyDaysAgo.toISOString());

            setMetrics({
                activeStudios: activeCount || 0,
                totalUsers: userCount || 0,
                newStudios: newCount || 0,
                cancelledStudios: inactiveCount || 0
            });
        } catch (error) {
            console.error('Error fetching admin metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { title: 'Estúdios Ativos', value: metrics.activeStudios, icon: 'store', color: 'text-green-500', bg: 'bg-green-500/10' },
        { title: 'Total de Usuários', value: metrics.totalUsers, icon: 'group', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Novos (30d)', value: metrics.newStudios, icon: 'trending_up', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'Cancelados/Inativos', value: metrics.cancelledStudios, icon: 'store_mall_directory', color: 'text-red-500', bg: 'bg-red-500/10' },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-zinc-900 rounded-2xl border border-zinc-800"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <h1 className="text-2xl font-bold text-white">Visão Geral</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-start justify-between hover:border-zinc-700 transition-all">
                        <div>
                            <p className="text-sm font-medium text-zinc-400 mb-1">{card.title}</p>
                            <h3 className="text-3xl font-bold text-white">{card.value}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
                            <span className={`material-icons ${card.color}`}>{card.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder for Charts or Recent Activity */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center py-20">
                <span className="material-icons text-6xl text-zinc-800 mb-4">bar_chart</span>
                <p className="text-zinc-500">Gráficos detalhados em breve...</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
