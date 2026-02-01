import { supabase } from '../lib/supabase';

export const anamnesisService = {
    // Get existing record for an appointment
    async getRecord(appointmentId: string) {
        const { data, error } = await supabase
            .from('anamnesis_records')
            .select('*')
            .eq('appointment_id', appointmentId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('Error fetching anamnesis record:', error);
            return null;
        }

        return data; // Can be null if not exists
    },

    // Save (upsert) answers
    async saveAnswers(appointmentId: string, answers: Record<string, boolean>, observations: string = '', studioId: string) {
        // First check if exists to determine if update or insert (though upsert works if unique constraint exists)
        // UUID is PK, appointment_id is FK. If distinct records per appointment, upsert on appointment_id won't work unless unique constraint.
        // Let's assume one record per appointment.

        if (!studioId) {
            console.error('Studio ID is required to save anamnesis');
            return { success: false, error: { message: 'Studio ID is required' } };
        }

        // We will maintain one record per appointment.
        // Check if exists
        const { data: existing } = await supabase
            .from('anamnesis_records')
            .select('id')
            .eq('appointment_id', appointmentId)
            .single();

        if (existing) {
            const { data, error } = await supabase
                .from('anamnesis_records')
                .update({
                    answers: answers,
                    observations: observations,
                    updated_at: new Date(),
                    studio_id: studioId // Ensure ownership is set/maintained
                })
                .eq('appointment_id', appointmentId)
                .select()
                .single();
            return { success: !error, data, error };
        } else {
            const { data, error } = await supabase
                .from('anamnesis_records')
                .insert({
                    appointment_id: appointmentId,
                    answers: answers,
                    observations: observations,
                    studio_id: studioId
                })
                .select()
                .single();
            return { success: !error, data, error };
        }
    }
};
