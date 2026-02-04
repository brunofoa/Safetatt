
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

    // Admin Client (Service Role - Bypass RLS for invite/creation)
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
        // Validate Caller (Security Check)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization Header' }), { status: 401, headers: corsHeaders })
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);

        if (callerError || !caller) {
            return new Response(JSON.stringify({ error: 'Invalid User Token' }), { status: 401, headers: corsHeaders })
        }

        // Input - Extended to support all client fields
        const {
            email,
            role,
            studio_id,
            type,
            fullName,
            firstName,
            lastName,
            cpf,
            phone,
            color,
            avatarUrl,
            redirectTo,
            metaData,
            commission,
            // Client-specific fields
            birthDate,
            rg,
            profession,
            instagram,
            address,
            cep,
            neighborhood,
            city,
            state
        } = await req.json();

        if (!email || !studio_id) {
            return new Response(JSON.stringify({ error: 'Missing required fields: email and studio_id are required' }), { status: 400, headers: corsHeaders })
        }

        // Determine role based on type if not provided
        const effectiveRole = role || (type === 'client' ? 'CLIENT' : 'ARTIST');

        console.log(`[invite-user] Starting invite for ${email}, type: ${type}, role: ${effectiveRole}, studio: ${studio_id}`);

        // 1. Check if user already exists in auth.users
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listError) throw listError;

        const users = listData?.users || [];
        let targetUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        let isNewUser = false;

        if (!targetUser) {
            // Send invitation email to create new user
            console.log(`[invite-user] User not found, sending invite to ${email}`);

            const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                redirectTo: redirectTo || 'https://safetatt.app/update-password',
                data: {
                    full_name: fullName || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
                    ...metaData
                }
            });

            if (inviteError) {
                console.error(`[invite-user] Invite error:`, inviteError);
                throw inviteError;
            }

            if (!inviteData || !inviteData.user) {
                throw new Error("Failed to invite user (no data returned).");
            }

            targetUser = inviteData.user;
            isNewUser = true;
            console.log(`[invite-user] New user created with ID: ${targetUser.id}`);
        } else {
            console.log(`[invite-user] User already exists with ID: ${targetUser.id}`);
        }

        if (!targetUser) throw new Error("Could not find or create user.");

        const userId = targetUser.id;
        const computedFullName = fullName || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];

        // 2. Upsert Profile
        const profileData: Record<string, any> = {
            id: userId,
            email: email,
            full_name: computedFullName,
            updated_at: new Date().toISOString()
        };

        // Add optional fields if provided
        if (firstName) profileData.first_name = firstName;
        if (lastName) profileData.last_name = lastName;
        if (cpf) profileData.cpf = cpf;
        if (phone) profileData.phone = phone;
        if (avatarUrl) profileData.avatar_url = avatarUrl;
        if (color) profileData.display_color = color;

        console.log(`[invite-user] Upserting profile for user ${userId}`);

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

        if (profileError) {
            console.error(`[invite-user] Profile upsert error:`, profileError);
            throw profileError;
        }

        // 3. Create/Update studio_members entry
        const { data: existingMember } = await supabaseAdmin
            .from('studio_members')
            .select('id')
            .eq('profile_id', userId)
            .eq('studio_id', studio_id)
            .single();

        let studioMemberId: string | null = null;

        if (existingMember) {
            studioMemberId = existingMember.id;
            console.log(`[invite-user] User already member of studio, updating role to ${effectiveRole}`);

            const updateData: Record<string, any> = { role: effectiveRole };
            if (commission !== undefined) updateData.commission_percentage = commission;

            await supabaseAdmin.from('studio_members').update(updateData).eq('id', existingMember.id);
        } else {
            console.log(`[invite-user] Adding user to studio with role ${effectiveRole}`);

            const { data: newMember, error: memberError } = await supabaseAdmin
                .from('studio_members')
                .insert({
                    profile_id: userId,
                    studio_id: studio_id,
                    role: effectiveRole,
                    commission_percentage: commission !== undefined ? commission : (type === 'client' ? 0 : 50.00)
                })
                .select('id')
                .single();

            if (memberError) {
                console.error(`[invite-user] Studio member insert error:`, memberError);
                throw memberError;
            }

            studioMemberId = newMember?.id || null;
        }

        // 4. If client, also create/update clients table
        let clientId: string | null = null;

        if (type === 'client' || effectiveRole === 'CLIENT') {
            console.log(`[invite-user] Creating/updating client record`);

            const { data: existingClient } = await supabaseAdmin
                .from('clients')
                .select('id')
                .eq('profile_id', userId)
                .eq('studio_id', studio_id)
                .single();

            if (existingClient) {
                clientId = existingClient.id;
                console.log(`[invite-user] Client already exists, updating data`);

                // Update existing client with new data
                const clientUpdateData: Record<string, any> = {
                    full_name: computedFullName,
                    email: email,
                    updated_at: new Date().toISOString()
                };

                if (firstName) clientUpdateData.first_name = firstName;
                if (lastName) clientUpdateData.last_name = lastName;
                if (phone) clientUpdateData.phone = phone;
                if (cpf) clientUpdateData.cpf = cpf;
                if (rg) clientUpdateData.rg_passport = rg;
                if (profession) clientUpdateData.profession = profession;
                if (instagram) clientUpdateData.social_media = instagram;
                if (birthDate) clientUpdateData.birth_date = birthDate;
                if (cep) clientUpdateData.cep = cep;
                if (neighborhood) clientUpdateData.neighborhood = neighborhood;
                if (city) clientUpdateData.city = city;
                if (state) clientUpdateData.state = state;
                if (address) clientUpdateData.address = address;
                if (avatarUrl) clientUpdateData.avatar_url = avatarUrl;

                await supabaseAdmin.from('clients').update(clientUpdateData).eq('id', existingClient.id);
            } else {
                console.log(`[invite-user] Creating new client record`);

                const clientInsertData: Record<string, any> = {
                    profile_id: userId,
                    studio_id: studio_id,
                    full_name: computedFullName,
                    email: email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                if (firstName) clientInsertData.first_name = firstName;
                if (lastName) clientInsertData.last_name = lastName;
                if (phone) clientInsertData.phone = phone;
                if (cpf) clientInsertData.cpf = cpf;
                if (rg) clientInsertData.rg_passport = rg;
                if (profession) clientInsertData.profession = profession;
                if (instagram) clientInsertData.social_media = instagram;
                if (birthDate) clientInsertData.birth_date = birthDate;
                if (cep) clientInsertData.cep = cep;
                if (neighborhood) clientInsertData.neighborhood = neighborhood;
                if (city) clientInsertData.city = city;
                if (state) clientInsertData.state = state;
                if (address) clientInsertData.address = address;
                if (avatarUrl) clientInsertData.avatar_url = avatarUrl;

                const { data: newClient, error: clientError } = await supabaseAdmin
                    .from('clients')
                    .insert(clientInsertData)
                    .select('id')
                    .single();

                if (clientError) {
                    console.error(`[invite-user] Client insert error:`, clientError);
                    throw clientError;
                }

                clientId = newClient?.id || null;
            }
        }

        console.log(`[invite-user] Success! userId: ${userId}, isNewUser: ${isNewUser}, clientId: ${clientId}`);

        return new Response(JSON.stringify({
            success: true,
            isNewUser,
            userId,
            clientId,
            studioMemberId,
            message: isNewUser
                ? 'Convite enviado por email! O usuário receberá instruções para definir sua senha.'
                : 'Usuário adicionado ao estúdio com sucesso!'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error(`[invite-user] Error:`, error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
