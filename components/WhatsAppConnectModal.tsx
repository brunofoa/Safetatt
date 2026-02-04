
import React, { useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';

interface WhatsAppConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    instanceName: string; // Required for proper status polling
    studioSlug?: string;
    onSuccess: () => void;
}

const WhatsAppConnectModal: React.FC<WhatsAppConnectModalProps> = ({ isOpen, onClose, token, instanceName, studioSlug, onSuccess }) => {
    const [mode, setMode] = useState<'QR' | 'PAIRING'>('QR');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [retryCount, setRetryCount] = useState(0); // Added retry state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial QR Fetch
    useEffect(() => {
        let isMounted = true;

        if (isOpen && mode === 'QR' && !qrCode) {
            const fetchQR = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const res = await whatsappService.connectInstance(token);
                    if (isMounted) {
                        const qr = res.qrCode || res.qrcode || res.base64;
                        if (qr) {
                            setQrCode(qr);
                        } else if (res.status === 'CONNECTED') {
                            onSuccess();
                            onClose();
                        } else {
                            // Keep polling or show loading state logic here if needed
                            // For MVP we just show what we got
                        }
                    }
                } catch (err: any) {
                    if (isMounted) setError(err.message || 'Erro ao carregar QR Code');
                } finally {
                    if (isMounted) setIsLoading(false);
                }
            };
            fetchQR();
        }

        return () => { isMounted = false; };
    }, [isOpen, mode, token, retryCount]);

    // Polling for Status - uses getConnectionState (not connectInstance which regenerates QR)
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        if (isOpen && !isLoading && instanceName && token) {
            console.log('[Modal] Starting status polling for:', instanceName);
            pollInterval = setInterval(async () => {
                try {
                    // Use getConnectionState to check status WITHOUT side effects
                    const state = await whatsappService.getConnectionState(instanceName, token);
                    console.log('[Modal] Poll state:', state);
                    if (state === 'open') {
                        console.log('[Modal] Connection detected! Closing modal.');
                        onSuccess();
                        onClose();
                    }
                } catch (e) {
                    // Ignore polling errors
                }
            }, 3000);
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
                console.log('[Modal] Polling stopped');
            }
        };
    }, [isOpen, isLoading, token, instanceName, onSuccess, onClose]);

    const handlePairing = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Digite um número válido com DDD (Ex: 5511999999999)');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await whatsappService.requestPairingCode(token, phoneNumber);
            if (res.pairingCode) {
                setPairingCode(res.pairingCode);
            } else {
                setError('Não foi possível obter o código. Tente novamente.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao solicitar pareamento');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center relative">

                {/* Header */}
                <div className="w-full px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
                    <h3 className="font-bold text-lg dark:text-white">Conectar WhatsApp</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
                        <span className="material-icons text-gray-400">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col items-center w-full">

                    {error && (
                        <div className="w-full bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    {mode === 'QR' ? (
                        <>
                            <div className="mb-6 relative w-64 h-64 bg-white p-4 rounded-xl shadow-inner border border-gray-200 flex items-center justify-center">
                                {isLoading ? (
                                    <div className="flex flex-col items-center">
                                        <span className="material-icons animate-spin text-4xl text-primary mb-2">sync</span>
                                        <span className="text-xs text-gray-400">Carregando QR...</span>
                                    </div>
                                ) : qrCode ? (
                                    <img
                                        src={(() => {
                                            const clean = qrCode.replace(/\s/g, '');
                                            return clean.startsWith('data:image') ? clean : `data:image/png;base64,${clean}`;
                                        })()}
                                        className="w-full h-full object-contain"
                                        alt="QR Code"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-sm">QR Code indisponível</span>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 text-center mb-6 px-4">
                                Abra o WhatsApp no seu celular, vá em <span className="font-bold">Aparelhos Conectados {'>'} Conectar Aparelho</span> e aponte a câmera.
                            </p>

                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setQrCode(null);
                                        setRetryCount(prev => prev + 1); // Trigger re-fetch
                                    }}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    <span className="material-icons text-sm">refresh</span>
                                    Atualizar QR Code
                                </button>

                                <button
                                    onClick={() => setMode('PAIRING')}
                                    className="text-primary hover:text-emerald-600 text-sm font-bold underline decoration-dotted underline-offset-4 transition text-center"
                                >
                                    Minha câmera não funciona (Usar Código)
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {pairingCode ? (
                                <div className="animate-fade-in flex flex-col items-center w-full">
                                    <div className="bg-gray-100 dark:bg-zinc-800 p-6 rounded-2xl border-2 border-dashed border-primary mb-6 w-full text-center">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Código de Pareamento</p>
                                        <div className="text-4xl font-mono font-black tracking-[0.2em] text-gray-900 dark:text-white select-all">
                                            {pairingCode.toUpperCase()}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 text-center mb-6">
                                        No WhatsApp, digite este código quando solicitado.
                                    </p>
                                    <button
                                        onClick={() => { setPairingCode(null); setMode('QR'); }}
                                        className="text-gray-400 hover:text-gray-600 text-sm"
                                    >
                                        Voltar
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full animate-fade-in">
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Número do WhatsApp</label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="5511999999999"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-lg font-mono tracking-wide"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            Digite o código do país (55) + DDD + Número. Ex: 5511998765432
                                        </p>
                                    </div>

                                    <button
                                        onClick={handlePairing}
                                        disabled={isLoading || phoneNumber.length < 10}
                                        className="w-full bg-primary hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none mb-4 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <span className="material-icons animate-spin text-sm">sync</span> : null}
                                        Receber Código
                                    </button>

                                    <button
                                        onClick={() => setMode('QR')}
                                        className="w-full text-gray-400 hover:text-gray-600 text-sm py-2"
                                    >
                                        Cancelar e usar QR Code
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConnectModal;
