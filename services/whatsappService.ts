import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_WHATSAPP_API_URL;
const GLOBAL_KEY = import.meta.env.VITE_WHATSAPP_GLOBAL_KEY;

interface ConnectionResponse {
    status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
    qrCode?: string; // Base64
    qrcode?: string; // API Variation
    base64?: string; // API Variation
    debug?: any;
}

const cleanBaseUrl = API_URL?.replace(/\/$/, '');
const SANITIZED_KEY = GLOBAL_KEY?.trim().replace(/['"]/g, '') || '';

const api = axios.create({
    baseURL: cleanBaseUrl
});

api.defaults.headers.common['Authorization'] = `Bearer ${SANITIZED_KEY}`;
api.defaults.headers.common['apikey'] = SANITIZED_KEY;
api.defaults.headers.common['admintoken'] = SANITIZED_KEY;

console.log('[WhatsApp] Configured with Key Length:', SANITIZED_KEY.length);

/**
 * Creates/Initializes a new WhatsApp instance.
 * ENDPOINT: /instance/init (based on user docs)
 */
export const createInstance = async (instanceName: string) => {
    try {
        const url = `${cleanBaseUrl}/instance/init`;

        console.log('Tentando conectar em:', url, 'com headers:', {
            'Authorization': `Bearer ${SANITIZED_KEY?.substring(0, 5)}...`,
            'apikey': `${SANITIZED_KEY?.substring(0, 5)}...`,
            'admintoken': `${SANITIZED_KEY?.substring(0, 5)}...`,
            'Content-Type': 'application/json'
        });

        // Payload: Documentation shows "name" as the required field.
        const payload = {
            name: instanceName,
            instanceName: instanceName // Sending both to be safe against API variations
        };

        const response = await api.post('/instance/init', payload);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            console.error('[WhatsApp] 401 Unauthorized Detail:', {
                url: `${cleanBaseUrl}/instance/init`,
                headersSent: {
                    ...api.defaults.headers.common,
                    Authorization: `Bearer ${SANITIZED_KEY.substring(0, 5)}...`
                },
                responseData: JSON.stringify(error.response?.data || {})
            });
        } else if (error.response?.status === 404) {
            console.error('[WhatsApp] 404 Not Found - Check API URL:', `${cleanBaseUrl}/instance/init`);
        }

        console.error('[WhatsApp] Create Instance Failed:', JSON.stringify(error.response?.data || error.message));
        throw error;
    }
};

/**
 * Connects a WhatsApp instance to get the QR Code.
 */
/**
 * Connects a WhatsApp instance to get the QR Code.
 * Updated to use POST /instance/connect with instance token.
 */
export const connectInstance = async (token: string): Promise<ConnectionResponse> => {
    try {
        console.log(`[WhatsApp] Connecting with token prefix: ${token?.substring(0, 5)}...`);

        // Endpoint: /instance/connect (POST)
        // Trying to pass token in Query Params as well since Headers returned 401 Missing Token
        const response = await axios.post(`${cleanBaseUrl}/instance/connect`, {}, {
            params: {
                token: token
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SANITIZED_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('[WhatsApp] Connect Response:', response.data);

        const data = response.data || {};
        const instance = data.instance;
        // Try multiple fields for QR
        // API v2 seems to return it inside instance object sometimes
        console.log('[WhatsApp] Instance Data:', JSON.stringify(instance));
        const qr = data.base64 || data.qrcode || data.code || data.url || instance?.qrcode || instance?.base64;
        console.log('[WhatsApp] Resolved QR:', qr ? qr.substring(0, 50) + '...' : 'NULL');

        const debugInfo = {
            ...data,
            _meta: {
                url: `${cleanBaseUrl}/instance/connect`,
                status: response.status,
                headers: response.headers
            },
            _diagnostics: {
                has_instance: !!instance,
                instance_type: typeof instance,
                instance_keys: instance ? Object.keys(instance) : [],
                has_qrcode_prop: instance ? 'qrcode' in instance : false,
                qrcode_val_preview: instance?.qrcode ? instance.qrcode.substring(0, 20) : 'undefined'
            }
        };

        if (instance?.state === 'open' || instance?.status === 'connected') {
            return { status: 'CONNECTED', debug: debugInfo };
        }

        if (qr) {
            return { status: 'DISCONNECTED', qrCode: qr, debug: debugInfo };
        }

        return { status: 'CONNECTING', debug: debugInfo };
    } catch (error: any) {
        const errorDebug = {
            message: error.message,
            response_data: error.response?.data,
            _meta: {
                url: `${cleanBaseUrl}/instance/connect`,
                status: error.response?.status
            }
        };

        if (error.response?.status === 409) {
            return { status: 'CONNECTED', debug: errorDebug };
        }
        console.error('[WhatsApp] Connect Instance Failed:', error.response?.data || error.message);
        return { status: 'DISCONNECTED', debug: errorDebug };
    }
};

/**
 * Checks connection state to see if QR was scanned.
 */
export const getConnectionState = async (instanceName: string, token: string): Promise<'open' | 'close' | 'connecting' | 'unknown'> => {
    try {
        const response = await axios.get(`${cleanBaseUrl}/instance/connectionState/${instanceName}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SANITIZED_KEY
            }
        });

        // Expected: { instance: { state: 'open' } }
        return response.data?.instance?.state || 'unknown';
    } catch (error) {
        return 'unknown';
    }
};

/**
 * Helper delay function
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Requests a pairing code for phone number connection
 */
export const requestPairingCode = async (token: string, phoneNumber: string): Promise<{ pairingCode?: string; status: string; debug: any }> => {
    try {
        console.log(`[WhatsApp] Requesting Pairing Code for ${phoneNumber}...`);

        const cleanNumber = phoneNumber.replace(/\D/g, '');

        const response = await axios.post(`${cleanBaseUrl}/instance/connect`, {
            number: cleanNumber
        }, {
            params: { token },
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SANITIZED_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('[WhatsApp] Pairing Response:', response.data);
        const data = response.data || {};
        const instance = data.instance || {};

        const code = data.paircode || instance.paircode;

        return {
            pairingCode: code,
            status: 'PAIRING',
            debug: { ...data, _meta: { status: response.status } }
        };

    } catch (error: any) {
        console.error('[WhatsApp] Pairing Error:', error);
        return {
            status: 'ERROR',
            debug: { error: error.message }
        };
    }
};

/**
 * Sends a text message using the instance token.
 */
export const sendMessage = async (instanceId: string, token: string, number: string, text: string): Promise<SendMessageResponse> => {
    try {
        const cleanNumber = number.replace(/\D/g, '');

        await axios.post(`${cleanBaseUrl}/message/text`, {
            instanceId,
            options: { delay: 1200 },
            textMessage: { text },
            number: cleanNumber
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error(`[WhatsApp] Send Message Failed to ${number}:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error };
    }
};

/**
 * Auto-Provisions a new WhatsApp instance for the studio.
 */
export const provisionInstance = async (studioName: string, studioId: string): Promise<{ success: boolean; instanceName?: string; error?: any }> => {
    try {
        // 1. Sanitize Name (Improved)
        // If it comes with underscores or is simple, preserve it more faithfully.
        // We still need to remove illegal chars for file systems/URLs if any.
        const instanceName = studioName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_') // Spaces to underscores
            .replace(/[^\w-]/g, ''); // Remove non-word except hyphen/underscore

        // Old aggressive sanitization:
        /*
        const instanceName = studioName
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
        */

        // 2. Create/Init Instance
        const data = await createInstance(instanceName);

        // Extract critical data
        // API response for /instance/init might differ.
        // Usually: { instance: { id, ... }, hash: { token, ... } }
        const instanceId = data.instance?.instanceId || data.instance?.id || data.instanceId || data.id; // added data.id check
        const token = data.hash?.token || data.token || data.auth?.token; // added data.auth check

        if (!instanceId || !token) {
            console.error('API Response Structure Unexpected:', data);
            throw new Error('Invalid response from WhatsApp API: Missing instanceId or token');
        }

        console.log(`[WhatsApp] Instance Created: ${instanceName} (${instanceId})`);

        // 3. Update Supabase
        const { error } = await supabase
            .from('studios')
            .update({
                whatsapp_instance_name: instanceName,
                whatsapp_instance_id: instanceId,
                whatsapp_token: token,
                whatsapp_status: 'connecting'
            })
            .eq('id', studioId);

        if (error) throw error;

        return { success: true, instanceName };
    } catch (error) {
        console.error('Provisioning Failed:', error);
        return { success: false, error };
    }
};

/**
 * Sends Mass Messages
 */
export const sendMassMessage = async (
    studioId: string,
    clients: { name: string; phone: string }[],
    messageTemplate: string,
    onProgress?: (current: number, total: number) => void
) => {
    // 1. Fetch Credentials
    const { data: studio } = await supabase
        .from('studios')
        .select('whatsapp_instance_id, whatsapp_token')
        .eq('id', studioId)
        .single();

    if (!studio?.whatsapp_instance_id || !studio?.whatsapp_token) {
        throw new Error('WhatsApp not configured for this studio');
    }

    const { whatsapp_instance_id: instanceId, whatsapp_token: token } = studio;

    let sentCount = 0;
    const total = clients.length;

    for (const client of clients) {
        const message = messageTemplate.replace('{{name}}', client.name.split(' ')[0]);

        await sendMessage(instanceId, token, client.phone, message);

        sentCount++;
        if (onProgress) onProgress(sentCount, total);

        if (sentCount < total) {
            const randomDelay = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
            console.log(`Anti-ban wait: ${randomDelay}ms`);
            await delay(randomDelay);
        }
    }

    return { success: true, sentCount };
};

/**
 * Logs out the instance
 */
export const logoutInstance = async (instanceName: string, token: string) => {
    try {
        await axios.delete(`${cleanBaseUrl}/instance/logout/${instanceName}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': SANITIZED_KEY
            }
        });
        return { success: true };
    } catch (error: any) {
        console.error('[WhatsApp] Logout Failed:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error };
    }
};


export const whatsappService = {
    createInstance,
    connectInstance,
    getConnectionState, // Exported new function
    sendMessage,
    requestPairingCode, // Added export
    provisionInstance,
    sendMassMessage,
    logoutInstance
};
