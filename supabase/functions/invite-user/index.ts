
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // 1. Admin Client (Service Role - Bypass RLS for invite/creation)
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        // 2. Validate Caller (Security Check)
        // We only want Authorized users (or specific roles) to call this.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization Header' }), { status: 401, headers: corsHeaders })
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);

        if (callerError || !caller) {
            return new Response(JSON.stringify({ error: 'Invalid User Token' }), { status: 401, headers: corsHeaders })
        }

        // Optional: Check if caller is admin or has permission. 
        // For now, we proceed as the code was before, assuming authenticated users can invite/create.

        // Input
        const { email, role, studio_id, type, fullName, cpf, phone, color, avatarUrl, redirectTo, metaData, commission } = await req.json();

        if (!email || !role || !studio_id) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
        }

        // 1. Check if user exists
        // Note: listUsers is paginated (default 50), so this might miss users in large DBs. 
        // Ideally we should use createUser and handle "already exists" error, or pagination.
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listError) throw listError;

        // Ensure listData exists
        const users = listData?.users || [];
        let targetUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        let isNewUser = false;

        if (!targetUser) {
            // Invite
            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                redirectTo: redirectTo || undefined,
                data: metaData || undefined
            });
            if (inviteError) throw inviteError;
            // Check inviteData exists
            if (!inviteData || !inviteData.user) {
                throw new Error("Failed to invite user (no data returned).");
            }
            targetUser = inviteData.user;
            isNewUser = true;
        }

        if (!targetUser) throw new Error("Could not find or create user.");

        // ... (rest of function)

        // 2. Ensure Profile Exists & Update Data
        // ... (profile update logic remains same)
        const profileData = {
            id: targetUser.id,
            email: email,
            full_name: fullName || email.split('@')[0],
            cpf: cpf,
            phone: phone,
            avatar_url: avatarUrl,
            display_color: color,
            updated_at: new Date().toISOString()
        };

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(profileData);

        if (profileError) throw profileError;

        let profileId = targetUser.id;

        // 3. Link to Studio (Staff or Client)
        if (type === 'client') {
            // ... (client logic remains same)
            const { data: existingClient } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('profile_id', profileId)
                .eq('studio_id', studio_id)
                .single();

            if (!existingClient) {
                await supabaseAdmin.from('clients').insert({
                    profile_id: profileId,
                    studio_id: studio_id,
                    full_name: fullName || email.split('@')[0],
                    email: email,
                    phone: phone,
                    cpf: cpf
                });
            }
        } else {
            // Staff / Member
            const { data: existingMember } = await supabaseAdmin
                .from('studio_members')
                .select('id')
                .eq('profile_id', profileId)
                .eq('studio_id', studio_id)
                .single();

            if (existingMember) {
                // Update role and commission if provided
                const updateData: any = { role };
                if (commission !== undefined) updateData.commission_percentage = commission;

                await supabaseAdmin.from('studio_members').update(updateData).eq('id', existingMember.id);
            } else {
                await supabaseAdmin.from('studio_members').insert({
                    profile_id: profileId,
                    studio_id: studio_id,
                    role: role,
                    commission_percentage: commission !== undefined ? commission : 50.00 // Default 50 from prompt
                });
            }
        }

        return new Response(JSON.stringify({ success: true, isNewUser }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
