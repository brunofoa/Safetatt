import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_WHATSAPP_API_URL;
const GLOBAL_KEY = import.meta.env.VITE_WHATSAPP_GLOBAL_KEY;

interface ConnectionResponse {
    status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
    qrCode?: string; // Base64
}

interface SendMessageResponse {
    success: boolean;
    messageId?: string;
    error?: any;
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'apikey': GLOBAL_KEY,
        'Content-Type': 'application/json'
    }
});

/**
 * Checks connection status. If disconnected, tries to connect and returns QR Code.
 */
export const getConnectionInfo = async (instanceName: string): Promise<ConnectionResponse> => {
    try {
        // 1. Check State
        const stateRes = await api.get(`/instance/connectionState/${instanceName}`);
        const state = stateRes.data?.instance?.state; // 'open', 'close', 'connecting'

        if (state === 'open') {
            return { status: 'CONNECTED' };
        }

        // 2. If close/connecting, fetch Connect to get QR
        const connectRes = await api.get(`/instance/connect/${instanceName}`);
        const base64 = connectRes.data?.base64;

        if (base64) {
            return { status: 'DISCONNECTED', qrCode: base64 };
        }

        return { status: 'CONNECTING' }; // Fallback
    } catch (error) {
        console.error('WhatsApp Connection Error:', error);
        return { status: 'DISCONNECTED' };
    }
};

/**
 * Helper delay function for anti-ban
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends a text message to a single number
 */
export const sendText = async (instanceName: string, number: string, text: string): Promise<SendMessageResponse> => {
    try {
        // Ensure number format (55 + DDD + Number)
        const cleanNumber = number.replace(/\D/g, '');
        // Simple validation, UazAPI usually expects full number

        const res = await api.post(`/message/sendText/${instanceName}`, {
            number: cleanNumber,
            options: {
                delay: 1200,
                presence: 'composing',
                linkPreview: false
            },
            textMessage: {
                text: text
            }
        });

        return { success: true, messageId: res.data?.key?.id };
    } catch (error) {
        console.error(`Failed to send to ${number}:`, error);
        return { success: false, error };
    }
};

/**
 * Sends Mass Messages with Safe Delay (Anti-Ban)
 * Forces 15s-45s delay between messages.
 */
export const sendMassMessage = async (
    instanceName: string,
    clients: { name: string; phone: string }[],
    messageTemplate: string,
    onProgress?: (current: number, total: number) => void
) => {
    let sentCount = 0;
    const total = clients.length;

    for (const client of clients) {
        // 1. Personalize Message
        const message = messageTemplate.replace('{{name}}', client.name.split(' ')[0]);

        // 2. Send
        await sendText(instanceName, client.phone, message);
        sentCount++;
        if (onProgress) onProgress(sentCount, total);

        // 3. Anti-Ban Delay (15s to 45s) - ONLY if not the last one
        if (sentCount < total) {
            const randomDelay = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
            console.log(`Anti-ban wait: ${randomDelay}ms`);
            await delay(randomDelay);
        }
    }

    return { success: true, sentCount };
};

/**
 * Auto-Provisions a new WhatsApp instance for the studio.
 * 1. Sanitizes studio name.
 * 2. Creates instance on UazAPI.
 * 3. Updates Supabase record.
 */
export const provisionInstance = async (studioName: string, studioId: string): Promise<{ success: boolean; instanceName?: string; error?: any }> => {
    try {
        // 1. Sanitize Name (e.g., "Kevin's Ink" -> "kevins_ink")
        const instanceName = studioName
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with _
            .replace(/_+/g, "_") // Remove duplicate _
            .replace(/^_|_$/g, ""); // Trim _

        // 2. Check/Create Instance on UazAPI
        // First, check if it exists (optional, but good practice). UazAPI create usually fails if exists or returns existing.
        // We'll try to get state. If 404/error, we create.
        try {
            await api.get(`/instance/connectionState/${instanceName}`);
            console.log(`Instance ${instanceName} already exists.`);
        } catch (e) {
            // If doesn't exist, create it.
            console.log(`Creating instance ${instanceName}...`);
            await api.post(`/instance/create`, {
                instanceName: instanceName
            });
        }

        // 3. Update Supabase
        const { error } = await supabase
            .from('studios')
            .update({ whatsapp_instance_name: instanceName })
            .eq('id', studioId);

        if (error) throw error;

        return { success: true, instanceName };
    } catch (error) {
        console.error('Provisioning Failed:', error);
        return { success: false, error };
    }
};

export const whatsappService = {
    getConnectionInfo,
    sendText,
    sendMassMessage,
    provisionInstance
};
