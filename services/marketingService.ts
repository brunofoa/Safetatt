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
    }
};
