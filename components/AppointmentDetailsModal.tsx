import React, { useRef, useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { X, Coins } from '@phosphor-icons/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { loyaltyService } from '../services/loyaltyService';
import { anamnesisService } from '../services/anamnesisService';
import { studioService } from '../services/studioService';
import { appointmentService } from '../services/appointmentService';
import { sessionService } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any; // Using any for flexibility with extended mock data
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ isOpen, onClose, appointment }) => {
    const modalContentRef = useRef<HTMLDivElement>(null);
    const { currentStudio } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [useLoyalty, setUseLoyalty] = useState(false);

    const [displayAppointment, setDisplayAppointment] = useState(appointment);
    const [loyaltyBalance, setLoyaltyBalance] = useState(0);

    // Anamnesis State
    const [anamnesisQuestions, setAnamnesisQuestions] = useState<string[]>([]);
    const [anamnesisAnswers, setAnamnesisAnswers] = useState<Record<string, boolean>>({});
    const [anamnesisObs, setAnamnesisObs] = useState('');
    const [loadingAnamnesis, setLoadingAnamnesis] = useState(false);
    const [showAllAnamnesis, setShowAllAnamnesis] = useState(false);

    const [fullStudio, setFullStudio] = useState<any>(null);
    const [currentStatus, setCurrentStatus] = useState(appointment?.status);

    useEffect(() => {
        setCurrentStatus(appointment?.status);
    }, [appointment]);

    useEffect(() => {
        async function loadData() {
            if (isOpen && appointment) {
                // Reset State to prevent stale data
                setAnamnesisObs('');
                setAnamnesisAnswers({});
                setFullStudio(null);
                setFullStudio(null);
                setCurrentStatus(appointment?.status);
                setDisplayAppointment(appointment); // Reset to prop first
                setIsCheckingOut(false); // Reset checkout state
                setUseLoyalty(false); // Reset loyalty toggle

                // 0. Fetch FRESH Status/Data from DB (Critical for persistence)
                const freshSession = await sessionService.getSessionById(appointment.id);
                if (freshSession) {
                    setCurrentStatus(freshSession.status);

                    // Merge fresh data for display
                    setDisplayAppointment(prev => ({
                        ...prev,
                        ...freshSession,
                        clientName: freshSession.clients?.full_name || prev.clientName,
                        clientCpf: freshSession.clients?.cpf || prev.clientCpf,
                        artistName: freshSession.profiles?.full_name || prev.artistName,
                        body_location: freshSession.body_location,
                        size: freshSession.size,
                        art_color: freshSession.art_color,
                        session_number: freshSession.session_number,
                        description: freshSession.description,
                        photos_url: freshSession.photos_url,
                        price: freshSession.price,
                        performed_date: freshSession.performed_date
                    }));
                }

                // 1. Loyalty Balance
                const clientId = appointment.clientId || appointment.client_id || 'c1';
                const { balance } = await loyaltyService.getClientBalance(clientId);
                setLoyaltyBalance(balance);

                // 2. Load full studio settings/details
                const studioId = appointment.studio_id || currentStudio?.id;
                if (studioId) {
                    const settings = await studioService.getStudioSettings(studioId);
                    setFullStudio(settings || null);
                }

                // 3. Anamnesis Data
                setLoadingAnamnesis(true);
                // b. Fetch Answers (Record)
                const record = await anamnesisService.getRecord(appointment.id);
                if (record) {
                    setAnamnesisAnswers(record.answers || {});
                    setAnamnesisObs(record.observations || '');
                } else {
                    setAnamnesisAnswers({});
                    setAnamnesisObs('');
                }
                setLoadingAnamnesis(false);
            }
        }
        loadData();
    }, [isOpen, appointment, currentStudio]);

    const handleToggleAnamnesis = async (question: string) => {
        const newAnswers = { ...anamnesisAnswers, [question]: !anamnesisAnswers[question] };
        setAnamnesisAnswers(newAnswers);
        const studioId = displayAppointment.studio_id || currentStudio?.id;
        if (studioId) {
            // Auto-save
            await anamnesisService.saveAnswers(displayAppointment.id, newAnswers, anamnesisObs, studioId);
        }
    };

    const handleObsChange = async (obs: string) => {
        setAnamnesisObs(obs);
        // Debounce save ideally, but for now save on blur or specific button?
        // Let's rely on onBlur for the textarea to save to DB
    };

    const handleSaveObs = async () => {
        const studioId = displayAppointment.studio_id || currentStudio?.id;
        if (studioId) {
            await anamnesisService.saveAnswers(displayAppointment.id, anamnesisAnswers, anamnesisObs, studioId);
        }
    };


    // Parse value safely
    const numericValue = displayAppointment ? (
        displayAppointment.price !== undefined ? Number(displayAppointment.price) :
            (typeof displayAppointment.value === 'string'
                ? parseFloat(displayAppointment.value.replace('R$', '').replace('.', '').replace(',', '.'))
                : (displayAppointment.value || 0))
    ) : 0;

    const finalValue = useLoyalty ? Math.max(0, numericValue - loyaltyBalance) : numericValue;

    // Helper for safe date formatting
    const safeDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
    };

    const handleConfirmPayment = async () => {
        const clientId = displayAppointment?.client_id || displayAppointment?.clientId;
        const studioId = displayAppointment?.studio_id || currentStudio?.id;

        if (!clientId || !studioId) {
            alert('Erro: Dados do cliente ou estúdio incompletos.');
            return;
        }

        try {
            // 1. If used loyalty (DEBIT)
            if (useLoyalty && loyaltyBalance > 0) {
                const debitAmount = Math.min(loyaltyBalance, numericValue);
                await loyaltyService.createTransaction({
                    client_id: clientId,
                    studio_id: studioId,
                    amount: debitAmount,
                    type: 'DEBIT',
                    description: `Resgate em atendimento #${displayAppointment.id}`
                });
            }

            // 2. Generate new Cashback (CREDIT)
            const rewardPercent = 10;
            const creditAmount = finalValue * (rewardPercent / 100);

            if (creditAmount > 0) {
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 90); // 90 days validity

                await loyaltyService.createTransaction({
                    client_id: clientId,
                    studio_id: studioId,
                    amount: creditAmount,
                    type: 'CREDIT',
                    description: `Cashback sessão #${displayAppointment.id}`,
                    expires_at: expirationDate.toISOString()
                });
            }

            // 3. Update Session Status (Targeting SESSIONS table)
            if (displayAppointment.id) {
                const { error } = await sessionService.updateSession(displayAppointment.id, {
                    status: 'completed',
                    payment_status: 'paid',
                    price: numericValue
                });

                if (error) throw error;

                setCurrentStatus('completed');
                setIsCheckingOut(false); // Close checkout overlay, keep modal open to show status

                // Trigger Global Refresh
                window.dispatchEvent(new Event('refreshGlobalData'));
            }

            alert(`Pagamento Confirmado: R$ ${finalValue.toFixed(2)}\nCashback utilizado: ${useLoyalty ? 'Sim' : 'Não'}\nNovo Cashback Gerado: R$ ${creditAmount.toFixed(2)}`);

        } catch (error: any) {
            console.error('Erro ao processar pagamento:', error);
            alert(`Erro ao salvar status: ${error?.message || 'Erro desconhecido'}`);
        }
    };

    if (!isOpen || !appointment || !displayAppointment) return null;

    const handleGeneratePDF = async () => {
        if (!modalContentRef.current) return;

        try {
            setIsGenerating(true);

            // Wait for images to load (optional but safer)
            const images = modalContentRef.current.getElementsByTagName('img');
            await Promise.all(Array.from(images).map((img) => {
                const imageElement = img as HTMLImageElement;
                if (imageElement.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    imageElement.onload = () => resolve(null);
                    imageElement.onerror = () => resolve(null);
                });
            }));

            const dataUrl = await toPng(modalContentRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff'
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(dataUrl);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`atendimento-${displayAppointment.id}.pdf`);
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            // Show the actual error message
            alert(`Erro ao gerar PDF: ${error?.message || String(error)}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const cardStyle = "rounded-2xl border border-[#333333] p-6 text-sm text-[#000000] dark:text-zinc-50 bg-white dark:bg-zinc-900";
    const labelStyle = "font-bold mr-1";

    return (
        <ErrorBoundary>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header Actions - Valid only for the modal view, not printable */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <div>
                            <h2 className="font-bold text-[#000000] dark:text-zinc-50" style={{ fontSize: '18px' }}>
                                Atendimento
                            </h2>
                            <p className="text-slate-500 dark:text-zinc-400 mt-1" style={{ fontSize: '12px' }}>ID: #{displayAppointment.id}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-slate-400 dark:text-zinc-400 hover:text-red-500"
                        >
                            <X size={24} weight="bold" />
                        </button>
                    </div>

                    {/* Content - Scrollable & Printable Area */}
                    <div className="overflow-y-auto custom-scrollbar flex-1 relative bg-white dark:bg-zinc-900">
                        <div ref={modalContentRef} className="p-8 bg-white dark:bg-zinc-900 flex flex-col gap-4 min-w-[700px]">

                            {/* 1. Client Card */}
                            <div className={cardStyle}>
                                <h3 className="font-bold mb-2">Cliente</h3>
                                <div className="flex flex-col gap-1">
                                    <p><span className={labelStyle}>Nome completo:</span> {displayAppointment.clientName}</p>
                                    <p><span className={labelStyle}>CPF:</span> {displayAppointment.clientCpf || '-'}</p>
                                </div>
                            </div>

                            {/* 2. Studio Card */}
                            <div className={cardStyle}>
                                <h3 className="font-bold mb-2">Estúdio</h3>
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <p><span className={labelStyle}>Nome do estúdio:</span> {fullStudio?.name || (currentStudio as any)?.name || 'SafeTatt Studio'}</p>
                                        <p><span className={labelStyle}>CNPJ:</span> {fullStudio?.cnpj || (currentStudio as any)?.cnpj || '-'}</p>
                                        <p><span className={labelStyle}>Nome do Profissional:</span> {displayAppointment.artistName || displayAppointment.artist}</p>
                                    </div>
                                    <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center border border-gray-100 ml-4 overflow-hidden">
                                        {(fullStudio?.logo_url || currentStudio?.logo_url) ? (
                                            <img src={fullStudio?.logo_url || currentStudio?.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white font-bold">ST</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Atendimento Card (Renamed from Tatuagem) */}
                            <div className={cardStyle}>
                                <h3 className="font-bold mb-4">Atendimento</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                        <p><span className={labelStyle}>Data:</span> {safeDate(displayAppointment.performed_date || displayAppointment.created_at)}</p>
                                        <p><span className={labelStyle}>Título:</span> {displayAppointment.title}</p>
                                        <p><span className={labelStyle}>Local do corpo:</span> {displayAppointment.body_location || displayAppointment.bodyPart || '-'}</p>
                                        <p><span className={labelStyle}>Tamanho:</span> {displayAppointment.size || '-'}</p>
                                        <p><span className={labelStyle}>Valor:</span> R$ {(displayAppointment.price || 0).toFixed(2).replace('.', ',')}</p>
                                        <p><span className={labelStyle}>Cor da Arte:</span> {displayAppointment.art_color || '-'}</p>
                                        <p><span className={labelStyle}>Sessão:</span> {displayAppointment.session_number ? `${displayAppointment.session_number}ª` : '-'}</p>
                                        <p className="col-span-2"><span className={labelStyle}>Descrição:</span> {displayAppointment.description || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="font-bold mb-2 text-xs uppercase text-gray-400">Fotos do Atendimento</p>
                                        {displayAppointment.photos_url && displayAppointment.photos_url.length > 0 ? (
                                            <div className="flex gap-2 flex-wrap">
                                                {displayAppointment.photos_url.map((photo: string, idx: number) => (
                                                    <div key={idx} className="shrink-0 w-32 h-32 bg-slate-100 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-90">
                                                        <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 bg-slate-100 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                                                <span className="text-xs text-slate-400">Sem foto</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 4. Anamnesis Card (Read-Only) */}
                            <div className={cardStyle}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold">Ficha de Anamnese</h3>
                                    {loadingAnamnesis && <span className="text-xs text-gray-400">Carregando...</span>}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {Object.keys(anamnesisAnswers).filter(k => anamnesisAnswers[k]).map((question, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                                            <span className="material-icons text-red-500 text-sm">check_box</span>
                                            <span className="text-sm font-bold text-red-700 dark:text-red-400">
                                                {question}
                                            </span>
                                        </div>
                                    ))}
                                    {!loadingAnamnesis && Object.values(anamnesisAnswers).every(v => !v) && (
                                        <p className="col-span-2 text-center text-gray-400 text-xs italic py-4">Nenhum item marcado na anamnese.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-1 block uppercase">Observações de Saúde</label>
                                    <div className="w-full text-sm p-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 min-h-[60px]">
                                        {anamnesisObs || 'Nenhuma observação registrada.'}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions */}


                    {/* Checkout Overlay */}
                    {isCheckingOut && (
                        <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-zinc-900 p-6 border-t border-gray-100 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 animate-in slide-in-from-bottom duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-bold dark:text-zinc-50">Pagamento & Finalização</h3>
                                <button onClick={() => setIsCheckingOut(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Loyalty Card */}
                            <div className="flex items-center justify-between mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                        <Coins size={24} weight="fill" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-green-800 dark:text-green-400">Saldo Cashback Disponível</p>
                                        <p className="text-xs text-green-600 dark:text-green-500/80">O cliente possui R$ {loyaltyBalance.toFixed(2).replace('.', ',')} para uso.</p>
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <span className="text-sm font-bold text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-zinc-50 transition-colors">Usar Saldo</span>
                                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-200 dark:bg-zinc-700 has-[:checked]:bg-green-500">
                                        <input
                                            type="checkbox"
                                            className="peer absolute opacity-0 w-full h-full cursor-pointer"
                                            checked={useLoyalty}
                                            onChange={() => setUseLoyalty(!useLoyalty)}
                                        />
                                        <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-sm"></span>
                                    </div>
                                </label>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 dark:text-zinc-500">Valor do Serviço</p>
                                    <p className="font-bold text-lg dark:text-zinc-50">R$ {numericValue.toFixed(2).replace('.', ',')}</p>
                                </div>
                                {useLoyalty && (
                                    <div className="text-center">
                                        <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">Desconto</p>
                                        <p className="font-bold text-lg text-red-500">- R$ {Math.min(loyaltyBalance, numericValue).toFixed(2).replace('.', ',')}</p>
                                    </div>
                                )}
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 dark:text-zinc-500">Total a Receber</p>
                                    <p className="text-2xl font-extrabold text-primary">R$ {finalValue.toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setIsCheckingOut(false)} className="flex-1 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    className="flex-[2] py-4 rounded-xl btn-gradient text-black font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex justify-center items-center gap-2"
                                >
                                    <span className="material-icons">check_circle</span>
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions (Hidden when checkout is open) */}
                    {!isCheckingOut && (
                        <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between gap-3 z-10 transition-all">
                            {currentStatus === 'completed' ? (
                                <button
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#333333] to-[#000000] text-white font-bold cursor-default shadow-lg shadow-black/20 flex items-center gap-2"
                                >
                                    <span className="material-icons">check_circle</span>
                                    Finalizado
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsCheckingOut(true)}
                                    className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold transition-all shadow-lg shadow-green-500/20 hover:scale-105 flex items-center gap-2"
                                >
                                    <span className="material-icons">payments</span>
                                    Finalizar Atendimento
                                </button>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={isGenerating}
                                    className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-black font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isGenerating ? 'Gerando...' : 'Gerar PDF'}
                                </button>
                                <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-black dark:text-zinc-50">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </ErrorBoundary>
    );
};

export default AppointmentDetailsModal;


