import React, { useRef, useState, useEffect } from 'react';
import { X, Coins } from '@phosphor-icons/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { loyaltyService } from '../services/loyaltyService';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any; // Using any for flexibility with extended mock data
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ isOpen, onClose, appointment }) => {
    const modalContentRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [useLoyalty, setUseLoyalty] = useState(false);

    const [loyaltyBalance, setLoyaltyBalance] = useState(0);

    useEffect(() => {
        async function fetchBalance() {
            if (isOpen && appointment?.clientId) { // Assuming appointment object has clientId
                // Check if `appointment.clientId` exists in mock, if not, we might need to rely on name or add it.
                // For safety with current mocks which might not have it:
                const clientId = appointment.clientId || 'c1'; // Fallback to 'c1' for demo if missing
                const { balance } = await loyaltyService.getClientBalance(clientId);
                setLoyaltyBalance(balance);
            }
        }
        fetchBalance();
    }, [isOpen, appointment]);

    // Parse value safely
    const numericValue = appointment ? (typeof appointment.value === 'string'
        ? parseFloat(appointment.value.replace('R$', '').replace('.', '').replace(',', '.'))
        : (appointment.value || 850)) : 0;

    const finalValue = useLoyalty ? Math.max(0, numericValue - loyaltyBalance) : numericValue;

    const handleConfirmPayment = async () => {
        const clientId = appointment?.clientId || 'c1';
        const studioId = 'mock-studio-id'; // Replace with real context

        // 1. If used loyalty (DEBIT)
        if (useLoyalty && loyaltyBalance > 0) {
            const debitAmount = Math.min(loyaltyBalance, numericValue);
            await loyaltyService.createTransaction({
                client_id: clientId,
                studio_id: studioId,
                amount: debitAmount,
                type: 'DEBIT',
                description: `Resgate em atendimento #${appointment.id}`
            });
        }

        // 2. Generate new Cashback (CREDIT)
        // Calculate reward based on net value paid (finalValue)
        // Assuming 10% for now (should fetch from config)
        // For MVP let's fetch config or just assume 10%
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
                description: `Cashback sessão #${appointment.id}`,
                expires_at: expirationDate.toISOString()
            });
        }

        alert(`Pagamento Confirmado: R$ ${finalValue.toFixed(2)}\nCashback utilizado: ${useLoyalty ? 'Sim' : 'Não'}\nNovo Cashback Gerado: R$ ${creditAmount.toFixed(2)}`);
        onClose();
    };

    if (!isOpen || !appointment) return null;

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
            const pdfImgWidth = pdfWidth;
            const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfImgWidth, pdfImgHeight);

            pdf.save(`atendimento-${appointment.id}.pdf`);
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            // Show the actual error message
            alert(`Erro ao gerar PDF: ${error?.message || String(error)}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const cardStyle = "rounded-lg border border-gray-200 dark:border-zinc-800 p-6 text-sm text-[#000000] dark:text-zinc-50 bg-white dark:bg-zinc-900";
    const labelStyle = "font-bold mr-1";

    return (
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
                        <p className="text-slate-500 dark:text-zinc-400 mt-1" style={{ fontSize: '12px' }}>ID: #{appointment.id}</p>
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
                                <p><span className={labelStyle}>Nome completo:</span> {appointment.clientName}</p>
                                <p><span className={labelStyle}>CPF:</span> {appointment.clientCpf}</p>
                            </div>
                        </div>

                        {/* 2. Studio Card */}
                        <div className={cardStyle}>
                            <h3 className="font-bold mb-2">Estúdio</h3>
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <p><span className={labelStyle}>Nome do estúdio:</span> SafeTatt Studio</p>
                                    <p><span className={labelStyle}>CNPJ do Estúdio:</span> 12.345.678/0001-90</p>
                                    <p><span className={labelStyle}>Nome do Profissional:</span> {appointment.artist}</p>
                                </div>
                                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center border border-gray-100 ml-4">
                                    <img src="/logo-safetatt.png" alt="Logo" className="w-10 opacity-90" />
                                </div>
                            </div>
                        </div>

                        {/* 3. Tattoo Card */}
                        <div className={cardStyle}>
                            <h3 className="font-bold mb-4">Tatuagem</h3>
                            <div className="flex gap-6">
                                <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4">
                                    <p><span className={labelStyle}>Data:</span> {appointment.dateObj.toLocaleDateString('pt-BR')} às {appointment.time}</p>
                                    <p><span className={labelStyle}>Título:</span> {appointment.title}</p>
                                    <p><span className={labelStyle}>Local do corpo:</span> {appointment.bodyPart || 'Antebraço'}</p>
                                    <p><span className={labelStyle}>Tamanho:</span> {appointment.size || '15cm x 10cm'}</p>
                                    <p><span className={labelStyle}>Colorida ou Preta:</span> {appointment.colorType || 'Preta'}</p>
                                    <p><span className={labelStyle}>Valor:</span> {appointment.value || 'R$ 850,00'}</p>
                                    <p className="col-span-2"><span className={labelStyle}>Descrição:</span> {appointment.description || 'Tatuagem blackwork com elementos florais...'}</p>
                                    <p><span className={labelStyle}>Sessão:</span> {appointment.session || '1/1'}</p>
                                </div>
                                <div className="shrink-0 w-32 h-32 bg-slate-100 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                                    {appointment.tattooImage ? (
                                        <img src={appointment.tattooImage} alt="Desenho" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-400">Sem foto</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. Anamnesis Card */}
                        <div className={cardStyle}>
                            <h3 className="font-bold mb-2">Anamnese</h3>
                            <div className="flex flex-col gap-1">
                                <p><span className={labelStyle}>Anamnese:</span> {appointment.anamnesisAlert || 'Nenhuma alergia relatada.'}</p>
                                <p><span className={labelStyle}>Observações:</span> {appointment.notes || 'Sem observações adicionais.'}</p>
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
                        <button
                            onClick={() => setIsCheckingOut(true)}
                            className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold transition-all shadow-lg shadow-green-500/20 hover:scale-105 flex items-center gap-2"
                        >
                            <span className="material-icons">payments</span>
                            Finalizar Atendimento
                        </button>

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
    );
};

export default AppointmentDetailsModal;
