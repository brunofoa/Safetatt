
import { supabase } from '../lib/supabase';

export interface TeamMember {
    id: string; // studio_member id
    profile_id: string;
    studio_id: string;
    role: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    color?: string; // from profile display_color
    phone?: string;
    cpf?: string;
}

export const teamService = {
    // List members
    async getTeamMembers(studioId: string): Promise<TeamMember[]> {
        // 🔒 SECURITY: Filter by studio_id to prevent data leak
        if (!studioId) {
            console.error('❌ SECURITY: studioId is required for getTeamMembers');
            return [];
        }

        console.log('🔒 Fetching team members for studio:', studioId);

        // Query studio_members and join profiles
        const { data, error } = await supabase
            .from('studio_members')
            .select(`
                id,
                role,
                studio_id,
                profile_id,
                profiles!studio_members_profile_id_fkey (
                    full_name,
                    email,
                    avatar_url,
                    display_color,
                    phone,
                    cpf
                )
            `)
            .eq('studio_id', studioId); // 🔒 CRITICAL: Filter by studio

        if (error) {
            console.error('Error fetching team members:', error);
            return [];
        }

        console.log('✅ Team members fetched:', data?.length, 'for studio:', studioId);

        return data.map((item: any) => ({
            id: item.id,
            profile_id: item.profile_id,
            studio_id: item.studio_id,
            role: item.role,
            full_name: item.profiles?.full_name || 'Usuário',
            email: item.profiles?.email || '',
            avatar_url: item.profiles?.avatar_url || '',
            color: item.profiles?.display_color || '#92FFAD',
            phone: item.profiles?.phone || '',
            cpf: item.profiles?.cpf || ''
        }));
    },

    // Invite User (Calls Edge Function)
    async inviteMember(inviteData: { email: string; role: string; studioId: string; fullName: string; cpf?: string; phone?: string; color?: string; avatarUrl?: string }): Promise<{ success: boolean; message?: string; error?: any }> {
        try {
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email: inviteData.email,
                    role: inviteData.role,
                    studio_id: inviteData.studioId,
                    type: 'staff',
                    fullName: inviteData.fullName,
                    cpf: inviteData.cpf,
                    phone: inviteData.phone,
                    color: inviteData.color || '#92FFAD', // Default color if missing
                    avatarUrl: inviteData.avatarUrl
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return { success: true, message: data.isNewUser ? 'Convite enviado e perfil criado!' : 'Usuário atualizado na equipe.' };
        } catch (err: any) {
            console.error('Error inviting member:', err);
            return { success: false, error: err.message };
        }
    },

    // Update Member Role/Details
    async updateMember(memberId: string, profileId: string, updates: {
        role?: string;
        full_name?: string;
        email?: string;
        phone?: string;
        cpf?: string;
        color?: string;
        avatar_url?: string;
    }) {
        // 1. Update Studio Member (Role)
        if (updates.role) {
            const { error: roleError } = await supabase
                .from('studio_members')
                .update({ role: updates.role })
                .eq('id', memberId);

            if (roleError) {
                console.error('Error updating member role:', roleError);
                return { success: false, error: roleError };
            }
        }

        // 2. Update Profile (Personal Data)
        const profileUpdates: any = {};
        if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
        if (updates.email !== undefined) profileUpdates.email = updates.email; // Note: Updating email might require auth changes if tied to login
        if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
        if (updates.cpf !== undefined) profileUpdates.cpf = updates.cpf;
        if (updates.color !== undefined) profileUpdates.display_color = updates.color;
        if (updates.avatar_url !== undefined) profileUpdates.avatar_url = updates.avatar_url;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update(profileUpdates)
                .eq('id', profileId);

            if (profileError) {
                console.error('Error updating member profile:', profileError);
                return { success: false, error: profileError };
            }
        }

        return { success: true };
    },

    // Remove Member
    async removeMember(memberId: string) {
        const { error } = await supabase
            .from('studio_members')
            .delete()
            .eq('id', memberId);

        if (error) {
            console.error('Error removing member:', error);
            return { success: false, error };
        }
        return { success: true };
    }
};
