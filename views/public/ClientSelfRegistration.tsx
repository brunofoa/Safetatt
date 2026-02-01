
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Studio } from '../../types';

const ClientSelfRegistration: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [studio, setStudio] = useState<Studio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        cpf: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchStudio = async () => {
            if (!slug) {
                setError('Link inválido');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('studios')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error || !data) {
                setError('Estúdio não encontrado');
            } else {
                setStudio(data);
            }
            setLoading(false);
        };

        fetchStudio();
    }, [slug]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studio) return;
        setSubmitting(true);
        setError('');

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Erro ao criar usuário');

            const userId = authData.user.id;

            // 2. Insert into Profiles (Trigger might do this, but being safe/explicit if needed, 
            // usually better to rely on trigger OR check if it exists. 
            // Assuming the system relies on triggers usually? 
            // Let's assume we need to update/insert profile details like phone/cpf.

            // Wait a moment for trigger (if any) or upsert manually
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: formData.email,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    cpf: formData.cpf,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name)}&background=random`
                });

            if (profileError) console.error('Profile upsert error:', profileError);

            // 3. Insert into Clients (LINK TO STUDIO)
            const { error: clientError } = await supabase
                .from('clients')
                .insert({
                    profile_id: userId,
                    studio_id: studio.id,
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    cpf: formData.cpf,
                    // address, birth_date can be empty for now
                });

            if (clientError) throw clientError;

            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            navigate('/login');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <span className="material-icons animate-spin text-3xl">sync</span>
            </div>
        );
    }

    if (error || !studio) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white p-4 text-center">
                <span className="material-icons text-6xl text-zinc-800 mb-4">error_outline</span>
                <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
                <p className="text-zinc-500 mb-8">{error || 'Estúdio desconhecido'}</p>
                <button onClick={() => navigate('/')} className="text-primary hover:underline font-bold">Voltar ao Início</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
                <div className="text-center mb-8">
                    {studio.logo_url && (
                        <div className="w-20 h-20 bg-zinc-800 rounded-2xl mx-auto mb-4 overflow-hidden border border-zinc-700">
                            <img src={studio.logo_url} alt={studio.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Cadastre-se em</h2>
                    <h1 className="text-2xl font-bold text-white">{studio.name}</h1>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-400 mb-1 block uppercase">Nome Completo</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all"
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="Seu nome"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-400 mb-1 block uppercase">E-mail</label>
                        <input
                            required
                            type="email"
                            className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-400 mb-1 block uppercase">Senha</label>
                        <input
                            required
                            type="password"
                            className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-400 mb-1 block uppercase">Telefone / Whats</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-400 mb-1 block uppercase">CPF</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-zinc-800 border-zinc-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary transition-all"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Criando conta...' : 'Criar Conta'}
                    </button>

                    <p className="text-center text-xs text-zinc-500 mt-4">
                        Já tem uma conta? <a href="/login" className="text-white font-bold hover:underline">Fazer Login</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ClientSelfRegistration;
