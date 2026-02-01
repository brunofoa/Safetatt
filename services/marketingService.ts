import { supabase } from '../lib/supabase';

export interface Campaign {
    id?: string;
    studio_id: string;
    name: string;
    type: 'birthday' | 'winback' | 'return' | 'custom';
    status: 'sent' | 'scheduled' | 'draft';
    audience_count: number;
    channel?: 'whatsapp' | 'email';
    created_at?: string;
}

export const marketingService = {
    // Fetch campaigns for the current studio
    async getCampaigns(studioId: string) {
        if (!studioId) return [];

        const { data, error } = await supabase
            .from('marketing_campaigns')
            .select('*')
            .eq('studio_id', studioId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching campaigns:', error);
            return [];
        }

        return data;
    },

    // Create a new campaign
    async createCampaign(campaign: Campaign) {
        const { data, error } = await supabase
            .from('marketing_campaigns')
            .insert([campaign])
            .select()
            .single();

        if (error) {
            console.error('Error creating campaign:', error);
            throw error;
        }

        return data;
    },

    // Get dashboard metrics (cards)
    async getDashboardMetrics(studioId: string) {
        if (!studioId) return { birthdayCount: 0, winbackCount: 0, returnCount: 0 };

        try {
            // 1. Birthdays Today
            // Fetch all clients birth_dates (lightweight)
            const { data: clients } = await supabase
                .from('clients')
                .select('birth_date')
                .eq('studio_id', studioId);

            const today = new Date();
            const birthdayCount = clients?.filter(c => {
                if (!c.birth_date) return false;
                // Parse "YYYY-MM-DD"
                // Warning: new Date("YYYY-MM-DD") treats as UTC. 
                // We want to match Day/Month.
                const parts = c.birth_date.split('-'); // [YYYY, MM, DD]
                if (parts.length !== 3) return false;

                // Month is 0-indexed in JS Date, but parts[1] is 1-12.
                const month = parseInt(parts[1], 10);
                const day = parseInt(parts[2], 10);

                return day === today.getDate() && (month - 1) === today.getMonth();
            }).length || 0;

            // 2. Winback (Inactive > 90 days)
            // Fetch sessions to calculate last visit
            const { data: sessionData } = await supabase
                .from('sessions')
                .select('client_id, performed_date')
                .eq('studio_id', studioId);

            const lastVisits = new Map<string, number>();
            sessionData?.forEach((s: any) => {
                if (!s.client_id) return;
                const time = new Date(s.performed_date || 0).getTime();
                if (time > (lastVisits.get(s.client_id) || 0)) {
                    lastVisits.set(s.client_id, time);
                }
            });

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const cutoffTime = ninetyDaysAgo.getTime();

            let winbackCount = 0;
            // Only count clients who HAVE visited (are in sessions)
            lastVisits.forEach(lastVisitTime => {
                if (lastVisitTime < cutoffTime) winbackCount++;
            });

            // 3. Return (Open Sessions / Pending work)
            // Counting sessions that are pending or in_progress
            const { count: returnCount } = await supabase
                .from('sessions')
                .select('*', { count: 'exact', head: true })
                .eq('studio_id', studioId)
                .in('status', ['pending', 'in_progress']);

            return {
                birthdayCount,
                winbackCount,
                returnCount: returnCount || 0
            };

        } catch (error) {
            console.error('Error fetching dashboard metrics:', error);
            return { birthdayCount: 0, winbackCount: 0, returnCount: 0 };
        }
    },

    // Get audience list based on type
    async getAudience(studioId: string, type: string): Promise<any[]> {
        if (!studioId) return [];

        try {
            // 1. Fetch Clients
            const { data: clients } = await supabase
                .from('clients')
                .select('*')
                .eq('studio_id', studioId);

            // 2. Fetch Sessions for Last Visit calculation
            const { data: sessions } = await supabase
                .from('sessions')
                .select('client_id, performed_date')
                .eq('studio_id', studioId);

            // Calculate Last Visit Map
            const lastVisits = new Map<string, string>();
            sessions?.forEach((s: any) => {
                if (!s.client_id) return;
                const currentDate = s.performed_date || '';
                const existing = lastVisits.get(s.client_id) || '';
                if (currentDate > existing) {
                    lastVisits.set(s.client_id, currentDate);
                }
            });

            // Map clients to include lastVisit
            const textSearch = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const processedClients = clients?.map(c => ({
                id: c.id,
                name: c.full_name, // Map full_name to name
                phone: c.phone,
                lastVisit: lastVisits.get(c.id) || c.created_at, // Fallback to created_at if no session
                gender: c.gender || 'Outro',
                birthDate: c.birth_date,
                artist: 'Todos' // We don't have easy artist mapping without joining sessions -> artist. Future improvement.
            })) || [];

            // Filter based on Type
            if (type === 'birthday') {
                return processedClients.filter(c => !!c.birthDate); // Modal filter will handle specific month
            }

            if (type === 'winback') {
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                const cutoff = ninetyDaysAgo.toISOString();

                return processedClients.filter(c => {
                    return c.lastVisit < cutoff; // Visited before cutoff (older)
                });
            }

            if (type === 'return') {
                // For "return", we might want clients with *pending* sessions?
                // or just return all and let filters handle it?
                // Let's rely on processedClients
                // But wait, "Return" card logic was "open sessions".
                // That required session status check.
                // Here we serve the list of PEOPLE.
                // Maybe people who have "pending" sessions?
                // Let's filter by having at least one "Open" session.
                // Need to fetch session status...
                // Re-fetch sessions with status
                const { data: pendingSessions } = await supabase
                    .from('sessions')
                    .select('client_id')
                    .eq('studio_id', studioId)
                    .in('status', ['pending', 'in_progress']);

                const pendingClientIds = new Set(pendingSessions?.map(s => s.client_id));
                return processedClients.filter(c => pendingClientIds.has(c.id));
            }

            // 'all' or 'custom'
            return processedClients;

        } catch (error) {
            console.error('Error fetching audience:', error);
            return [];
        }
    }
};
