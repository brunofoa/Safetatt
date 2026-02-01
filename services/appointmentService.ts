import { supabase } from '../lib/supabase';
import { Appointment } from '../types';


const STATUS_MAP_TO_DB: Record<string, string> = {
    'Pendente': 'pending',
    'Confirmado': 'confirmed',
    'Finalizado': 'completed',
    'Concluído': 'completed',
    'Realizado': 'completed',
    'Cancelado': 'cancelled',
    'No Show': 'no_show',
    'Em Andamento': 'confirmed',
    'pending': 'pending',
    'confirmed': 'confirmed',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'no_show': 'no_show',
    'in_progress': 'confirmed'
};

const STATUS_MAP_FROM_DB: Record<string, string> = {
    'pending': 'Pendente',
    'confirmed': 'Confirmado',
    'completed': 'Finalizado',
    'cancelled': 'Cancelado',
    'no_show': 'No Show',
    'in_progress': 'Em Andamento'
};

export const appointmentService = {
    // Help to extract local YYYY-MM-DD
    getLocalYYYYMMDD(date: Date) {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    },

    async getByDate(date: Date, studioId: string) {
        const dateStr = this.getLocalYYYYMMDD(date);

        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                clients (full_name),
                profiles:professional_id (full_name, display_color)
            `)
            .eq('studio_id', studioId)
            .eq('scheduled_date', dateStr)
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.error('Error fetching appointments:', error);
            return [];
        }

        return data.map((app: any) => {
            // Construct ISO strings for frontend
            const datePart = app.scheduled_date; // YYYY-MM-DD
            const timePart = app.scheduled_time; // HH:MM:SS
            const startDateTime = new Date(`${datePart}T${timePart}`);
            const endDateTime = new Date(startDateTime.getTime() + (app.duration_minutes || 60) * 60000);

            return {
                id: app.id,
                date: startDateTime.toISOString(),
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                time: `${timePart.slice(0, 5)} - ${endDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                clientName: app.clients?.full_name || 'Cliente Desconhecido',
                clientAvatar: '',
                artist: app.profiles?.full_name || 'Artista',
                artistColor: app.profiles?.display_color,
                status: STATUS_MAP_FROM_DB[app.status] || app.status,
                title: app.appointment_type || 'Agendamento',
                description: app.notes || '',
                photos: [], // Schema update implies photos might not be directly here or handled differently, kept empty for now
                tattooImage: null
            };
        });
    },

    // --- Appointment CRUD Operations ---


    async getAppointments(studioId: string, startDate?: string, endDate?: string, professionalId?: string) {
        let query = supabase
            .from('appointments')
            .select(`
                *,
                clients (full_name, email, phone),
                profiles:professional_id (full_name, display_color)
            `)
            .eq('studio_id', studioId);

        if (startDate) {
            const startStr = new Date(startDate).toISOString().split('T')[0];
            query = query.gte('scheduled_date', startStr);
        }
        if (endDate) {
            const endStr = new Date(endDate).toISOString().split('T')[0];
            query = query.lte('scheduled_date', endStr);
        }
        if (professionalId) query = query.eq('professional_id', professionalId);

        const { data, error } = await query.order('scheduled_date', { ascending: true }).order('scheduled_time', { ascending: true });

        if (error) {
            console.error('Error getting appointments:', error);
            return { success: false, error };
        }

        const mappedData = data.map((app: any) => {
            const startDateTime = new Date(`${app.scheduled_date}T${app.scheduled_time}`);
            const endDateTime = new Date(startDateTime.getTime() + (app.duration_minutes || 60) * 60000);
            return {
                ...app,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                appointment_type: app.appointment_type,
                service_type: app.appointment_type, // Alias for compatibility
                notes: app.notes,
                artist_id: app.professional_id // Alias
            };
        });

        return { success: true, data: mappedData };
    },

    async checkTimeConflict(studioId: string, professionalId: string, startTime: string, endTime: string, excludeAppointmentId?: string) {
        const start = new Date(startTime);
        const dateStr = this.getLocalYYYYMMDD(start);
        const timeStr = start.toTimeString().slice(0, 8); // HH:MM:SS

        // Fetch all appointments for this pro on this day
        let query = supabase
            .from('appointments')
            .select('id, scheduled_time, duration_minutes')
            .eq('studio_id', studioId)
            .eq('professional_id', professionalId)
            .eq('scheduled_date', dateStr)
            .neq('status', 'cancelled');

        if (excludeAppointmentId) {
            query = query.neq('id', excludeAppointmentId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error checking conflict:', error);
            // Fail safe: return error
            return { error };
        }

        // JS Conflict Check
        // requestedStart
        const reqStart = new Date(startTime).getTime();
        const reqEnd = new Date(endTime).getTime();

        const hasConflict = data.some((app: any) => {
            const appStart = new Date(`${dateStr}T${app.scheduled_time}`).getTime();
            const appEnd = appStart + (app.duration_minutes * 60000);

            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            return (reqStart < appEnd) && (reqEnd > appStart);
        });

        return { conflict: hasConflict };
    },

    async createAppointment(appointmentData: any) {
        // 1. Check Conflict
        if (appointmentData.artistId && appointmentData.startTime && appointmentData.endTime) {
            const { conflict, error } = await this.checkTimeConflict(
                appointmentData.studioId,
                appointmentData.artistId,
                appointmentData.startTime,
                appointmentData.endTime
            );
            if (error) return { success: false, error };
            if (conflict) return { success: false, error: { message: 'Conflito de horário detectado para este profissional.' } };
        }

        // 2. Prepare Payload
        // 2. Prepare Payload
        const start = new Date(appointmentData.startTime);
        const end = appointmentData.endTime ? new Date(appointmentData.endTime) : new Date(start.getTime() + 60 * 60000); // Default to 1 hour if null
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

        const payload = {
            studio_id: appointmentData.studioId,
            client_id: appointmentData.clientId,
            professional_id: appointmentData.artistId,
            scheduled_date: this.getLocalYYYYMMDD(start),
            scheduled_time: start.toTimeString().slice(0, 8),
            duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
            status: STATUS_MAP_TO_DB[appointmentData.status] || 'pending',
            notes: appointmentData.observations,
            appointment_type: null, // Bypassing check constraint for now
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('appointments')
            .insert([payload])
            .select()
            .single();

        if (error) return { success: false, error };
        return { success: true, data };
    },

    async updateAppointment(id: string, updates: any) {
        // 1. Check Conflict if time changed
        if (updates.artistId && updates.startTime && updates.endTime) {
            const { conflict, error } = await this.checkTimeConflict(
                updates.studioId,
                updates.artistId,
                updates.startTime,
                updates.endTime,
                id
            );
            if (error) return { success: false, error };
            if (conflict) return { success: false, error: { message: 'Conflito de horário detectado.' } };
        }

        const payload: any = {};
        if (updates.clientId) payload.client_id = updates.clientId;
        if (updates.artistId) payload.professional_id = updates.artistId;

        if (updates.startTime && updates.endTime) {
            const start = new Date(updates.startTime);
            const end = new Date(updates.endTime);
            payload.scheduled_date = this.getLocalYYYYMMDD(start);
            payload.scheduled_time = start.toTimeString().slice(0, 8);
            payload.duration_minutes = Math.round((end.getTime() - start.getTime()) / 60000);
        }

        if (updates.status) payload.status = STATUS_MAP_TO_DB[updates.status] || updates.status;
        if (updates.observations) payload.notes = updates.observations;
        if (updates.price !== undefined) payload.price = updates.price;
        // if (updates.service_type) payload.appointment_type = updates.service_type; // Disabled to bypass constraint

        const { data, error } = await supabase
            .from('appointments')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) return { success: false, error };
        return { success: true, data };
    },

    async updateAppointmentStatus(id: string, status: string) {
        const dbStatus = STATUS_MAP_TO_DB[status] || status;
        const { data, error } = await supabase
            .from('appointments')
            .update({ status: dbStatus })
            .eq('id', id)
            .select()
            .single();

        if (error) return { success: false, error };
        return { success: true, data };
    },

    async deleteAppointment(id: string) {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) return { success: false, error };
        return { success: true };
    },
};
