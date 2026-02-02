import { supabase } from '../lib/supabase';

export interface DashboardStats {
    totalClients: number;
    totalAppointments: number;
    totalRevenue: number;
    revenueByMonth: { name: string; value: number }[];
}

export interface AppointmentSession {
    id: string;
    clientName: string;
    time: string;
    detail: string;
    day?: string;
    date: string; // for sorting
}

export const dashboardService = {
    async getStats(studioId: string): Promise<DashboardStats> {
        const today = new Date();
        const currentYear = today.getFullYear();
        const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
        const endOfYear = `${currentYear}-12-31T23:59:59.999Z`;

        // 1. Total Clients
        const { count: totalClients, error: clientsError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('studio_id', studioId);

        // 2. Total Appointments (Using sessions table now)
        const { count: totalAppointments, error: appointmentsError } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('studio_id', studioId);

        // 3. Total Revenue (Sum of price from ALL sessions, regardless of status)
        const { data: revenueData, error: revenueError } = await supabase
            .from('sessions')
            .select('price, performed_date, created_at') // created_at as fallback date
            .eq('studio_id', studioId);

        let totalRevenue = 0;
        const monthlyRevenue = Array(12).fill(0);
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        if (revenueData) {
            revenueData.forEach(session => {
                const price = Number(session.price) || 0;
                totalRevenue += price;

                const dateStr = session.performed_date || session.created_at;
                if (dateStr) {
                    const date = new Date(dateStr);
                    if (date.getFullYear() === currentYear) {
                        monthlyRevenue[date.getMonth()] += price;
                    }
                }
            });
        }

        const revenueByMonth = monthNames.map((name, index) => ({
            name,
            value: monthlyRevenue[index]
        }));

        if (clientsError || appointmentsError || revenueError) {
            console.error('Error fetching dashboard stats', clientsError, appointmentsError, revenueError);
        }

        return {
            totalClients: totalClients || 0,
            totalAppointments: totalAppointments || 0,
            totalRevenue,
            revenueByMonth
        };
    },

    async getUpcomingSessions(studioId: string): Promise<AppointmentSession[]> {
        const now = new Date().toISOString();

        // Using sessions table for consistency with Appointments page
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                id,
                performed_date,
                service_type,
                body_location,
                title,
                clients (
                  full_name
                )
            `)
            .eq('studio_id', studioId)
            .gte('performed_date', now)
            .order('performed_date', { ascending: true })
            .limit(3);

        if (error) {
            console.error('Error fetching upcoming sessions:', error);
            return [];
        }

        return data.map((item: any) => {
            const date = new Date(item.performed_date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === date.toDateString();

            let dayLabel = 'Hoje';
            if (!isToday) {
                dayLabel = isTomorrow ? 'Amanhã' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            }

            return {
                id: item.id,
                clientName: item.clients?.full_name || 'Cliente',
                time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                detail: `${item.title || item.service_type || 'Sessão'} • ${item.body_location || 'Geral'}`,
                day: dayLabel,
                date: item.performed_date
            };
        });
    },

    async getUpcomingAppointments(studioId: string): Promise<AppointmentSession[]> {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // Fetch appointments from today onwards (simplified query)
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                scheduled_date,
                scheduled_time,
                appointment_type,
                notes,
                status,
                clients (full_name)
            `)
            .eq('studio_id', studioId)
            .gte('scheduled_date', todayStr)
            .not('status', 'in', '("cancelled","completed")')
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true })
            .limit(10); // Fetch more, then filter

        if (error) {
            console.error('Error fetching upcoming appointments:', error);
            return [];
        }

        // Filter in JS: only future appointments (if today, must be after current time)
        const now = new Date();
        const filtered = data.filter((item: any) => {
            const appointmentDate = new Date(`${item.scheduled_date}T${item.scheduled_time}`);
            return appointmentDate >= now;
        });

        // Take only first 3
        return filtered.slice(0, 3).map((item: any) => {
            const date = new Date(`${item.scheduled_date}T${item.scheduled_time}`);
            const isToday = new Date().toDateString() === date.toDateString();
            const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === date.toDateString();

            let dayLabel = 'Hoje';
            if (!isToday) {
                dayLabel = isTomorrow ? 'Amanhã' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            }

            return {
                id: item.id,
                clientName: item.clients?.full_name || 'Cliente',
                time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                detail: item.appointment_type || item.notes || 'Agendamento',
                day: dayLabel,
                date: `${item.scheduled_date}T${item.scheduled_time}`
            };
        });
    }
};
