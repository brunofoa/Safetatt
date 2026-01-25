import { supabase } from '../lib/supabase';
import { LoyaltyConfig, LoyaltyTransaction } from '../../types';

export const loyaltyService = {
    // --- CONFIGURATION ---
    async getStudioConfig(studioId: string): Promise<LoyaltyConfig | null> {
        const { data, error } = await supabase
            .from('studios')
            .select('loyalty_config')
            .eq('id', studioId)
            .single();

        if (error) {
            console.error('Error fetching loyalty config:', error);
            return null;
        }

        return data?.loyalty_config as LoyaltyConfig;
    },

    async updateStudioConfig(studioId: string, config: LoyaltyConfig): Promise<boolean> {
        const { error } = await supabase
            .from('studios')
            .update({ loyalty_config: config })
            .eq('id', studioId);

        if (error) {
            console.error('Error updating loyalty config:', error);
            return false;
        }
        return true;
    },

    // --- TRANSACTIONS ---
    async getClientBalance(clientId: string): Promise<{ balance: number; nextExpiration: string | null }> {
        // This is a simplified calculation. In a real system, we'd sum valid CREDITS and subtract DEBITS.
        // For now, we assume the backend (or a view) might handle complex expiration logic, 
        // but here we'll calc simply: Total Credits - Total Debits. 
        // Expiration logic usually requires "FIFO" usage of points, which is complex for frontend-only.

        // We will just fetch all transactions
        const { data, error } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: true });

        if (error || !data) {
            console.error('Error fetching transactions:', error);
            return { balance: 0, nextExpiration: null };
        }

        let balance = 0;
        let nextExpiration: string | null = null;
        const now = new Date();

        // Simple aggregation
        data.forEach((t: any) => {
            if (t.type === 'CREDIT' || t.type === 'MANUAL_ADJUST') { // Assuming Manual Adjust is usually credit, or handle signed
                // Check if expired
                if (t.expires_at && new Date(t.expires_at) < now && t.type !== 'MANUAL_ADJUST') return;
                balance += Number(t.amount);
            } else if (t.type === 'DEBIT') {
                balance -= Number(t.amount);
            }
        });

        // Find next expiration date of valid credits (simplified)
        const activeCredits = data.filter((t: any) =>
            (t.type === 'CREDIT') &&
            t.expires_at &&
            new Date(t.expires_at) > now
        );

        if (activeCredits.length > 0) {
            // Sort by nearest expiration
            activeCredits.sort((a: any, b: any) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
            nextExpiration = activeCredits[0].expires_at;
        }

        return { balance: Math.max(0, balance), nextExpiration };
    },

    async createTransaction(transaction: Omit<LoyaltyTransaction, 'id' | 'created_at'>): Promise<LoyaltyTransaction | null> {
        const { data, error } = await supabase
            .from('loyalty_transactions')
            .insert([transaction])
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            return null;
        }
        return data;
    },

    // --- DASHBOARD DATA ---
    async getDashboardMetrics(studioId: string) {
        const { data, error } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('studio_id', studioId);

        if (error) return { totalLiability: 0, redeemedMonth: 0, expiringSoon: 0 };

        let totalLiability = 0;
        let redeemedMonth = 0;
        let expiringSoon = 0;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        data.forEach((t: any) => {
            const amount = Number(t.amount);
            if (t.type === 'CREDIT' || t.type === 'MANUAL_ADJUST') {
                totalLiability += amount;
                if (t.expires_at) {
                    const expDate = new Date(t.expires_at);
                    if (expDate > now && expDate <= thirtyDaysFromNow) {
                        expiringSoon += amount;
                    }
                }
            } else if (t.type === 'DEBIT') {
                totalLiability -= amount;
                if (new Date(t.created_at) >= firstDayOfMonth) {
                    redeemedMonth += amount;
                }
            }
        });

        return { totalLiability: Math.max(0, totalLiability), redeemedMonth, expiringSoon };
    },

    async getClientHistory(clientId: string) {
        const { data, error } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        return data || [];
    },

    async getClientsWithLoyalty(studioId: string) {
        // In a real app, this would be a JOIN or efficient query.
        // For MVP, we fetch all clients (profiles) and their transactions, then aggregate.
        // Or we might have a materialized view.

        // 1. Fetch all clients associated with studio (mocked for now as we don't have linking table)
        // We will just fetch profiles that have at least one transaction for now? 
        // Or if we have a Clients table. The implementation in Clients.tsx uses Mock Data.
        // We need to fetch 'real' clients if we are moving to Supabase, OR mix mock clients with real loyalty data.

        // Strategy: Fetch transactions, group by client_id, calculate balances. 
        // Then merge with basic client info (mocked or fetched).

        const { data: transactions, error } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('studio_id', studioId);

        if (error || !transactions) return [];

        const clientBalances: Record<string, any> = {};

        transactions.forEach((t: any) => {
            if (!clientBalances[t.client_id]) {
                clientBalances[t.client_id] = { balance: 0, totalAccumulated: 0, lastTransaction: null, nextExpiration: null };
            }
            const c = clientBalances[t.client_id];
            const amount = Number(t.amount);

            if (t.type === 'CREDIT' || t.type === 'MANUAL_ADJUST') {
                c.balance += amount;
                c.totalAccumulated += amount;

                if (t.expires_at) {
                    const expDate = new Date(t.expires_at);
                    if (expDate > new Date()) {
                        if (!c.nextExpiration || expDate < new Date(c.nextExpiration)) {
                            c.nextExpiration = t.expires_at;
                        }
                    }
                }

            } else if (t.type === 'DEBIT') {
                c.balance -= amount;
            }

            if (!c.lastTransaction || new Date(t.created_at) > new Date(c.lastTransaction)) {
                c.lastTransaction = t.created_at;
            }
        });

        // Map to array and fill details
        // Note: In real app we would join with 'profiles' table.
        // For now we will return ID and calculated data, UI might need to fetch names or use existing cache.
        // We will try to fetch profiles for these IDs if possible.

        const clientIds = Object.keys(clientBalances);
        let profilesMap: Record<string, any> = {};

        if (clientIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', clientIds);

            if (profiles) {
                profiles.forEach(p => profilesMap[p.id] = p);
            }
        }

        return clientIds.map(id => {
            const profile = profilesMap[id] || { full_name: 'Cliente Desconhecido', phone: '', avatar_url: '' };
            const data = clientBalances[id];

            // Format dates
            const nextExp = data.nextExpiration ? new Date(data.nextExpiration).toLocaleDateString('pt-BR') : '-';
            const lastVisit = data.lastTransaction ? new Date(data.lastTransaction).toLocaleDateString('pt-BR') : '-';

            return {
                id,
                name: profile.full_name || 'Sem Nome',
                phone: profile.phone || '-',
                avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || 'C'}`,
                balance: Math.max(0, data.balance),
                totalAccumulated: data.totalAccumulated,
                lastVisit: lastVisit,
                nextExpiration: nextExp
            };
        });
    }
};
