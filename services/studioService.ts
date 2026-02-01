
import { supabase } from '../lib/supabase';

export const studioService = {
    async getStudioSettings(studioId: string) {
        const { data, error } = await supabase
            .from('studios')
            .select('*')
            .eq('id', studioId)
            .single();

        if (error) {
            console.error('Error fetching studio settings:', error);
            return null;
        }
        return data;
    },

    async updateStudioSettings(studioId: string, updates: any) {
        const { data, error } = await supabase
            .from('studios')
            .update(updates)
            .eq('id', studioId)
            .select()
            .single();

        if (error) {
            console.error('Error updating studio settings:', error);
            return { success: false, error };
        }
        return { success: true, data };
    },

    async checkSlugAvailability(slug: string, studioId?: string) {
        let query = supabase
            .from('studios')
            .select('id')
            .eq('slug', slug);

        if (studioId) {
            query = query.neq('id', studioId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error checking slug availability:', error);
            // Fail safe: assume available if error, or handle otherwise? 
            // Better to assume UNAVAILABLE or throw. 
            // Let's return false safely to prevent conflicts if we can't check
            return false;
        }

        // If data has length > 0, it means slug is taken
        return data.length === 0;
    },

    async getUserStudios(userId: string) {
        // Fetch studios where the user is a member
        const { data, error } = await supabase
            .from('studio_members')
            .select(`
                role,
                studios (
                    id,
                    name,
                    logo_url,
                    contact_email
                )
            `)
            .eq('profile_id', userId);

        if (error) {
            console.error('Error fetching user studios:', error);
            return [];
        }

        // Map to Studio interface
        return data
            .filter((item: any) => item.studios) // Filter out null studios
            .map((item: any) => ({
                id: item.studios.id,
                name: item.studios.name,
                owner: 'Unknown',
                role: item.role,
                logo: item.studios.logo_url || 'https://via.placeholder.com/150',
                memberCount: 0
            }));
    }
};
