import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { signInWithPassword, signUpWithPassword, resetPassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (isRecovery) {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccessMessage("Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
      setLoading(false);
    } else if (isRegistering) {
      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await signUpWithPassword(email, password);

      if (authError) {
        if (authError.message.includes("User already registered")) {
          setError("Este e-mail já possui cadastro. Tente fazer login.");
        } else {
          setError(authError.message);
        }
      } else if (data?.user && !data.session) {
        setSuccessMessage("Conta criada com sucesso! Verifique seu e-mail para confirmar.");
      } else if (data?.user && data.session) {
        setSuccessMessage("Conta criada e logada com sucesso!");
      }
      setLoading(false);
    } else {
      const { error: authError } = await signInWithPassword(email, password);

      if (authError) {
        setError(authError.message);
        setLoading(false);
      } else {
        onLogin();
      }
    }
  };

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRegistering(!isRegistering);
    setIsRecovery(false);
    setError(null);
    setSuccessMessage(null);
  };

  const toggleRecovery = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRecovery(!isRecovery);
    setIsRegistering(false);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <main className="min-h-screen w-full bg-white flex items-center justify-center p-4">

      {/* Card Centralizado */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

        {/* Header Image (35% height approx) */}
        <div className="h-48 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
          <img
            src="/login-header.png"
            alt="Studio Artist"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Card Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isRecovery ? 'Recuperar Senha' : isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRecovery ? 'Digite seu email para receber o link de recuperação.' : isRegistering ? 'Preencha seus dados para começar.' : 'Acesse sua conta para continuar.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-xs font-bold text-center">
                {successMessage}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-900 ml-1">Email</label>
              <input
                className="w-full bg-transparent border border-[#333333] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#5CDFF0] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                placeholder="seu@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {!isRecovery && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-900 ml-1">Senha</label>
                  {!isRegistering && (
                    <button onClick={toggleRecovery} className="text-xs text-[#059669] font-bold hover:underline" type="button">
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    className="w-full bg-transparent border border-[#333333] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#5CDFF0] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </button>
                </div>
              </div>
            )}

            {isRegistering && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-900 ml-1">Confirmar Senha</label>
                <input
                  className="w-full bg-transparent border border-[#333333] rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#5CDFF0] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <div className="pt-2 space-y-3">
              {/* Botão Principal */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-12 rounded-xl bg-gradient-to-r from-[#92FFAD] to-[#5CDFF0] text-gray-900 font-bold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>{isRecovery ? 'Enviar Link' : isRegistering ? 'Criar Conta' : 'Entrar'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Rodapé */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {isRecovery ? 'Lembrou sua senha?' : isRegistering ? 'Já tem uma conta?' : 'Não tem conta?'}
              <button onClick={isRecovery ? toggleRecovery : toggleMode} className="ml-1 text-[#059669] font-bold hover:underline">
                {isRecovery ? 'Voltar para Login' : isRegistering ? 'Fazer Login' : 'Cadastre-se'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Login;
