import { supabase } from '../lib/supabase';
import { LoyaltyConfig, LoyaltyTransaction } from '../types';

export const loyaltyService = {
    // --- CONFIGURATION (NEW TABLE: loyalty_settings) ---
    async getSettings(studioId: string): Promise<LoyaltyConfig | null> {
        const { data, error } = await supabase
            .from('loyalty_settings')
            .select('*')
            .eq('studio_id', studioId)
            .single();

        if (error) {
            // It's okay if not found, we return null so UI uses defaults
            if (error.code !== 'PGRST116') {
                console.error('Error fetching loyalty settings:', error);
            }
            return null;
        }

        // Map snake_case DB to camelCase Interface
        return {
            isActive: data.is_active,
            rewardType: data.reward_type,
            rewardValue: Number(data.reward_value),
            validityDays: Number(data.points_expiration_days),
            minSpentToUse: Number(data.minimum_purchase_amount),
            maxUsageLimit: 100 // Default or add column if needed. The request didn't specify this one, keeping default.
        };
    },

    async upsertSettings(studioId: string, config: LoyaltyConfig): Promise<{ success: boolean; error?: any }> {
        const dbData = {
            studio_id: studioId,
            is_active: config.isActive,
            reward_type: config.rewardType,
            reward_value: config.rewardValue,
            points_expiration_days: config.validityDays,
            minimum_purchase_amount: config.minSpentToUse,
            updated_at: new Date()
        };

        const { error } = await supabase
            .from('loyalty_settings')
            .upsert(dbData, { onConflict: 'studio_id' });

        if (error) {
            console.error('Error saving loyalty settings:', error);
            return { success: false, error };
        }
        return { success: true };
    },

    // --- LEGACY CONFIGURATION (Keeping for reference if needed, but unused for new feature) ---
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
            // Map DB columns to logical names
            const type = t.transaction_type;
            const amount = Number(t.points_amount || 0);

            if (type === 'CREDIT' || type === 'MANUAL_ADJUST') { // Assuming Manual Adjust is usually credit
                // Check if expired
                if (t.expires_at && new Date(t.expires_at) < now && type !== 'MANUAL_ADJUST') return;
                balance += amount;
            } else if (type === 'DEBIT') {
                balance -= amount;
            }
        });

        // Find next expiration date of valid credits (simplified)
        const activeCredits = data.filter((t: any) =>
            (t.transaction_type === 'CREDIT') &&
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
        // Map Frontend Interface (amount, type) to DB Columns (points_amount, transaction_type)
        const dbTransaction = {
            studio_id: transaction.studio_id,
            client_id: transaction.client_id,
            appointment_id: transaction.appointment_id,
            transaction_type: transaction.type, // Map
            points_amount: transaction.amount,  // Map
            description: transaction.description,
            expires_at: transaction.expires_at
        };

        const { data, error } = await supabase
            .from('loyalty_transactions')
            .insert([dbTransaction])
            .select()
            .single();

        if (error) {
            console.error('Error creating transaction:', error);
            return null;
        }

        // Map back to interface
        return {
            ...data,
            type: data.transaction_type,
            amount: data.points_amount
        };
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
            const amount = Number(t.points_amount || 0);
            const type = t.transaction_type;

            if (type === 'CREDIT' || type === 'MANUAL_ADJUST') {
                totalLiability += amount;
                if (t.expires_at) {
                    const expDate = new Date(t.expires_at);
                    if (expDate > now && expDate <= thirtyDaysFromNow) {
                        expiringSoon += amount;
                    }
                }
            } else if (type === 'DEBIT') {
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

        if (error || !data) return [];

        // Map DB to Interface
        return data.map((t: any) => {
            let type = 'USE';
            if (t.transaction_type === 'CREDIT' || t.transaction_type === 'MANUAL_ADJUST') {
                type = 'EARN';
            }

            return {
                ...t,
                type: type,
                amount: Number(t.points_amount) // IMPORTANT: Cast to Number for frontend .toFixed() compatibility
            };
        });
    },

    async getClientsWithLoyalty(studioId: string) {
        // In a real app, this would be a JOIN or efficient query.

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

            // Map columns
            const amount = Number(t.points_amount || 0);
            const type = t.transaction_type;

            if (type === 'CREDIT' || type === 'MANUAL_ADJUST') {
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

            } else if (type === 'DEBIT') {
                c.balance -= amount;
            }

            if (!c.lastTransaction || new Date(t.created_at) > new Date(c.lastTransaction)) {
                c.lastTransaction = t.created_at;
            }
        });

        // Map to array and fill details
        const clientIds = Object.keys(clientBalances);
        let clientsMap: Record<string, any> = {};

        if (clientIds.length > 0) {
            const { data: clients } = await supabase
                .from('clients')
                .select('*')
                .in('id', clientIds);

            if (clients) {
                clients.forEach(c => clientsMap[c.id] = c);
            }
        }

        return clientIds.map(id => {
            const client = clientsMap[id] || { full_name: 'Cliente Desconhecido', phone: '', avatar: '' };
            const data = clientBalances[id];

            // Format dates
            const nextExp = data.nextExpiration ? new Date(data.nextExpiration).toLocaleDateString('pt-BR') : '-';
            const lastVisit = data.lastTransaction ? new Date(data.lastTransaction).toLocaleDateString('pt-BR') : '-';

            return {
                id,
                name: client.full_name || 'Sem Nome',
                phone: client.phone || '-',
                avatar: client.avatar || `https://ui-avatars.com/api/?name=${client.full_name || 'C'}`,
                cpf: client.cpf,
                balance: Math.max(0, data.balance),
                totalAccumulated: data.totalAccumulated,
                lastVisit: lastVisit,
                nextExpiration: nextExp
            };
        });
    }
};
