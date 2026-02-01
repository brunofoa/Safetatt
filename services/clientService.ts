import { supabase } from '../lib/supabase';
import { Client } from '../types';

export const clientService = {
    // Fetch all clients
    // Fetch all clients with real-time metrics aggregation
    async getClients(studioId: string): Promise<Client[]> {
        // Parallel fetch for clients and sessions to aggregate metrics
        const [clientsResponse, sessionsResponse] = await Promise.all([
            supabase
                .from('clients')
                .select('*')
                .eq('studio_id', studioId)
                .order('created_at', { ascending: false }),
            supabase
                .from('sessions')
                .select('id, client_id, price, performed_date, created_at')
                .eq('studio_id', studioId)
        ]);

        if (clientsResponse.error) {
            console.error('Error fetching clients:', clientsResponse.error);
            return [];
        }

        const clients = clientsResponse.data;
        const sessions = sessionsResponse.data || [];

        // Aggregate metrics per client
        const clientMetrics = sessions.reduce((acc: any, session: any) => {
            if (!session.client_id) return acc;

            if (!acc[session.client_id]) {
                acc[session.client_id] = {
                    totalVisits: 0,
                    totalSpent: 0,
                    lastVisit: null
                };
            }

            // Total Visits (Sessions)
            acc[session.client_id].totalVisits += 1;

            // Total Spent (Sum of price, regardless of status)
            const price = parseFloat(session.price) || 0;
            acc[session.client_id].totalSpent += price;

            // Last Visit (Most recent performed_date or created_at)
            const sessionDate = session.performed_date || session.created_at;
            if (sessionDate) {
                const currentLast = acc[session.client_id].lastVisit;
                if (!currentLast || new Date(sessionDate) > new Date(currentLast)) {
                    acc[session.client_id].lastVisit = sessionDate;
                }
            }

            return acc;
        }, {});

        // Map database fields to Client interface with aggregated metrics
        return clients.map((client: any) => {
            const metrics = clientMetrics[client.id] || { totalVisits: 0, totalSpent: 0, lastVisit: null };

            return {
                id: client.id,
                name: client.full_name,
                email: client.email || '',
                phone: client.phone || '',

                // Calculated Metrics
                totalVisits: metrics.totalVisits,
                totalSpent: metrics.totalSpent,
                lastVisit: metrics.lastVisit
                    ? new Date(metrics.lastVisit).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-',

                // existing fields...
                avatar_url: client.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.full_name)}&background=random`,
                birthDate: client.birth_date,
                cpf: client.cpf,
                rg: client.rg_passport,
                profession: client.profession,
                instagram: client.social_media,
                zipCode: client.address?.zip_code,
                street: client.address?.street,
                number: client.address?.number,
                neighborhood: client.address?.neighborhood,
                city: client.address?.city,
                state: client.address?.state,
                address: client.address?.full_address || ''
            };
        });
    },

    // Create a new client
    async createClient(clientData: any): Promise<{ success: boolean; data?: any; error?: any }> {
        // Prepare data for DB (snake_case)
        const { data: { user } } = await supabase.auth.getUser();

        // Prepare data for DB (snake_case)
        const dbData = {
            first_name: clientData.firstName,
            last_name: clientData.lastName,
            full_name: `${clientData.firstName} ${clientData.lastName}`.trim(),
            birth_date: clientData.birthDate || null,
            cpf: clientData.cpf,
            rg_passport: clientData.rg,        // Mapped from rg
            profession: clientData.profession,
            email: clientData.email,
            phone: clientData.phone,
            social_media: clientData.instagram, // Mapped from instagram

            // Address Fields (Top Level)
            cep: clientData.zipCode,
            neighborhood: clientData.neighborhood,
            city: clientData.city,
            state: clientData.state,

            // Address JSONB for extra fields
            address: {
                street: clientData.street,
                number: clientData.number,
                zip_code: clientData.zipCode
            },

            studio_id: clientData.studioId || user?.id // Should ideally be passed in
        };

        const { data, error } = await supabase
            .from('clients')
            .insert([dbData])
            .select()
            .single();

        if (error) {
            console.error('Error creating client:', error);
            return { success: false, error };
        }

        return { success: true, data };
    },
    async getClientById(id: string): Promise<Client | null> {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching client:', error);
            return null;
        }

        const client = data;
        return {
            id: client.id,
            name: client.full_name,
            email: client.email || '',
            phone: client.phone || '',
            totalVisits: client.total_visits || 0,
            lastVisit: client.last_visit ? new Date(client.last_visit).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            totalSpent: client.total_spent || 0,
            avatar_url: client.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.full_name)}&background=random`,
            // Additional fields
            birthDate: client.birth_date,
            cpf: client.cpf,
            rg: client.rg_passport,
            profession: client.profession,
            instagram: client.social_media,
            zipCode: client.cep || client.address?.zip_code,
            street: client.address?.street,
            number: client.address?.number,
            neighborhood: client.neighborhood || client.address?.neighborhood,
            city: client.city || client.address?.city,
            state: client.state || client.address?.state,
            address: client.address?.full_address || ''
        };
    },

    async searchClients(query: string, studioId: string): Promise<Client[]> {
        if (!query || query.length < 2) return [];

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('studio_id', studioId)
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,cpf.ilike.%${query}%`)
            .limit(10);

        if (error) {
            console.error('Error searching clients:', error);
            return [];
        }

        return data.map((client: any) => ({
            id: client.id,
            name: client.full_name,
            email: client.email || '',
            phone: client.phone || '',
            totalVisits: client.total_visits || 0,
            lastVisit: client.last_visit ? new Date(client.last_visit).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
            totalSpent: client.total_spent || 0,
            avatar_url: client.avatar_url,
            cpf: client.cpf
        }));
    },

    async updateClient(id: string, clientData: any): Promise<{ success: boolean; error?: any }> {
        const dbData = {
            first_name: clientData.firstName, // If you separate name
            // If we use full_name usually:
            full_name: clientData.name,
            birth_date: clientData.birthDate || null,
            cpf: clientData.cpf,
            rg_passport: clientData.rg,
            profession: clientData.profession,
            email: clientData.email,
            phone: clientData.phone,
            social_media: clientData.instagram,

            // Address Fields
            cep: clientData.zipCode,
            neighborhood: clientData.neighborhood,
            city: clientData.city,
            state: clientData.state,

            updated_at: new Date()
        };

        const { error } = await supabase
            .from('clients')
            .update(dbData)
            .eq('id', id);

        if (error) {
            console.error('Error updating client:', error);
            return { success: false, error };
        }
        return { success: true };
    },

    async getNotes(clientId: string) {
        const { data, error } = await supabase
            .from('client_notes')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
            return [];
        }
        return data;
    },

    async addNote(noteData: { clientId: string, content: string, type: string, authorName: string }) {
        const { data, error } = await supabase
            .from('client_notes')
            .insert({
                client_id: noteData.clientId,
                content: noteData.content,
                type: noteData.type,
                author_name: noteData.authorName,
                created_at: new Date()
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding note:', error);
            return null;
        }
        return data;
    },

    async updateNote(id: string, content: string) {
        const { error } = await supabase
            .from('client_notes')
            .update({ content, updated_at: new Date() })
            .eq('id', id);

        if (error) {
            console.error('Error updating note:', error);
            return { success: false, error };
        }
        return { success: true };
    },

    async deleteNote(id: string) {
        const { error } = await supabase
            .from('client_notes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting note:', error);
            return { success: false, error };
        }
        return { success: true };
    }
};
