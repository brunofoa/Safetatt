
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UpdatePassword = () => {
    const { updatePassword, session } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const navigate = useNavigate();

    // If no session, they might have clicked a link but it hasn't processed/exchanged yet, 
    // or the link is invalid. Supabase usually handles the hash processing automatically.
    // If after a moment there is still no session, maybe show error? 
    // Usually auth listener picks it up.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        setLoading(true);
        const { error } = await updatePassword(password);
        setLoading(false);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso! Redirecionando...' });
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    };

    return (
        <main className="min-h-screen w-full bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Nova Senha</h1>
                    <p className="text-sm text-gray-500">Digite sua nova senha abaixo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {message && (
                        <div className={`p-3 rounded-xl border text-xs font-bold text-center ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-900 ml-1">Nova Senha</label>
                        <input
                            className="w-full bg-transparent border border-[#333333] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#5CDFF0] focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-900 ml-1">Confirmar Nova Senha</label>
                        <input
                            className="w-full bg-transparent border border-[#333333] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#5CDFF0] focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-gray-900 font-bold shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                        >
                            {loading ? 'Atualizando...' : 'Definir Nova Senha'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default UpdatePassword;
