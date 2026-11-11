import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { translateAuthError } from '../../utils/authMessages.js';

const HIGHLIGHTS = [
  {
    icon: 'check_circle',
    title: 'Tarefas e prazos unificados',
    description: 'Controle entregas, subtarefas e alertas de atraso em uma linha do tempo única.',
  },
  {
    icon: 'calculate',
    title: 'Simulador de média e IRA',
    description: 'Descubra exatamente quanto precisa nas próximas avaliações para atingir sua meta.',
  },
  {
    icon: 'auto_awesome',
    title: 'Assistente IA com validação humana',
    description: 'Consulte suas matérias com o Gemini e revise cada operação antes de gravar no banco.',
  },
];

export default function AuthGate({ children }) {
  const {
    session,
    configured,
    passwordRecovery,
    authCallbackError,
    clearAuthCallbackError,
    enabledProviders,
    signIn,
    signInWithMagicLink,
    signInWithProvider,
    signUp,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'magic' | 'signup' | 'recovery'
  const [fullName, setFullName] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (authCallbackError) {
      setError(authCallbackError);
    }
  }, [authCallbackError]);

  if (!configured) return children;

  if (session === undefined) {
    return (
      <main className="min-h-screen grid place-items-center bg-surface p-6">
        <div className="flex flex-col items-center gap-3 bg-surface-container-lowest px-8 py-6 rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center shadow-xs animate-pulse">
            <span className="material-symbols-outlined text-secondary text-2xl">psychology</span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">
            Verificando sua sessão…
          </p>
        </div>
      </main>
    );
  }

  if (session && !passwordRecovery) return children;

  const effectiveMode = passwordRecovery ? 'new-password' : mode;

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setNotice('');
    setNeedsConfirmation(false);
    clearAuthCallbackError();
  };

  const handleResendConfirmation = async () => {
    if (!email.trim() || isResending) return;
    setIsResending(true);
    setError('');
    setNotice('');
    try {
      const result = await resendConfirmation(email);
      if (result.error) {
        setError(translateAuthError(result.error).message);
      } else {
        setNeedsConfirmation(false);
        setNotice(`Reenviamos o link de confirmação para ${email.trim()}. Verifique sua caixa de entrada e spam.`);
      }
    } finally {
      setIsResending(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setNotice('');
    setNeedsConfirmation(false);
    clearAuthCallbackError();

    if ((effectiveMode === 'signup' || effectiveMode === 'new-password') && password !== confirmPassword) {
      setError('As senhas informadas não conferem.');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (effectiveMode === 'login') {
        result = await signIn(email, password);
      } else if (effectiveMode === 'magic') {
        result = await signInWithMagicLink(email);
      } else if (effectiveMode === 'signup') {
        result = await signUp(email, password, { fullName, course, semester });
      } else if (effectiveMode === 'recovery') {
        result = await requestPasswordReset(email);
      } else {
        result = await updatePassword(password);
      }

      if (result?.error) {
        const translated = translateAuthError(result.error);
        setError(translated.message);
        setNeedsConfirmation(translated.needsConfirmation);
      } else if (effectiveMode === 'signup') {
        if (result?.data?.session) {
          setNotice('Conta criada e autenticada!');
        } else {
          setNotice(
            `Cadastro criado! Enviamos um link de confirmação para ${email.trim()}. Confirme o e-mail para entrar.`
          );
          setPassword('');
          setConfirmPassword('');
        }
      } else if (effectiveMode === 'magic') {
        setNotice(
          `Enviamos um link mágico de acesso para ${email.trim()}. Abra o link no seu e-mail para entrar sem senha.`
        );
      } else if (effectiveMode === 'recovery') {
        setNotice('Se a conta existir, enviamos um link de redefinição de senha para o seu e-mail.');
      } else if (effectiveMode === 'new-password') {
        setNotice('Senha atualizada com sucesso!');
        setPassword('');
        setConfirmPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const titles = {
    login: {
      heading: 'Bem-vindo de volta',
      subtitle: 'Entre na sua conta para acessar suas tarefas, notas e o assistente IA.',
      submit: isSubmitting ? 'Entrando…' : 'Entrar no TaskMind',
    },
    magic: {
      heading: 'Acesso rápido sem senha',
      subtitle: 'Receba um link único no seu e-mail e entre com um clique.',
      submit: isSubmitting ? 'Enviando link…' : 'Enviar link mágico',
    },
    signup: {
      heading: 'Crie sua conta acadêmica',
      subtitle: 'Comece a organizar seu semestre com sincronização segura na nuvem.',
      submit: isSubmitting ? 'Criando conta…' : 'Criar minha conta',
    },
    recovery: {
      heading: 'Recupere seu acesso',
      subtitle: 'Informe seu e-mail cadastrado para receber o link de redefinição.',
      submit: isSubmitting ? 'Enviando…' : 'Enviar link de recuperação',
    },
    'new-password': {
      heading: 'Defina uma nova senha',
      subtitle: 'Escolha uma nova senha com pelo menos 6 caracteres para sua conta.',
      submit: isSubmitting ? 'Salvando senha…' : 'Atualizar senha',
    },
  }[effectiveMode];

  const hasOAuth = enabledProviders.google || enabledProviders.github;

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary-fixed/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-surface-container-high/80 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl bg-surface-container-lowest shadow-2xl border border-outline-variant/30 overflow-hidden relative z-10">
        {/* Left Academic Showcase Panel */}
        <section className="lg:col-span-5 bg-primary-container text-on-primary p-7 sm:p-9 flex flex-col justify-between gap-8 relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-secondary/25 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/10 border border-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary-fixed text-2xl">psychology</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-md font-bold tracking-tight text-white">
                  TaskMind
                </span>
                <span className="font-code-sm text-code-sm text-secondary-fixed uppercase tracking-wider">
                  Academic Intelligence
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="font-headline-lg text-headline-lg text-white leading-snug">
                Sua rotina universitária com clareza e foco.
              </h1>
              <p className="font-body-md text-body-md text-inverse-primary leading-relaxed">
                Centralize prazos, acompanhe sua frequência e conte com um agente Gemini autenticado para planejar seus estudos.
              </p>
            </div>

            <div className="hidden lg:flex flex-col gap-4 pt-2">
              {HIGHLIGHTS.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-secondary-fixed text-lg">{item.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="font-body-sm text-body-sm text-inverse-primary">
                      {item.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between pt-4 border-t border-white/10 font-code-sm text-code-sm text-inverse-primary relative z-10">
            <span>Autenticação Supabase • RLS Ativo</span>
            <span className="inline-flex items-center gap-1.5 text-secondary-fixed">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Seguro
            </span>
          </div>
        </section>

        {/* Right Interactive Auth Form */}
        <section className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center gap-6">
          {/* Segmented Mode Tabs */}
          {!passwordRecovery && effectiveMode !== 'recovery' && (
            <div
              role="tablist"
              aria-label="Modos de acesso"
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-container-low border border-surface-container-high"
            >
              {[
                { id: 'login', label: 'Entrar', icon: 'login' },
                { id: 'magic', label: 'Link mágico', icon: 'mail' },
                { id: 'signup', label: 'Criar conta', icon: 'person_add' },
              ].map((tab) => {
                const active = effectiveMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchMode(tab.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                      active
                        ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-base ${active ? 'text-secondary' : ''}`}>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
              {titles.heading}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {titles.subtitle}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-error-container text-on-error-container flex flex-col gap-2 border border-error/20"
            >
              <div className="flex items-start gap-2 font-body-md text-body-md">
                <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
              {needsConfirmation && email.trim() && (
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendConfirmation}
                  className="self-start ml-7 px-3 py-1.5 rounded-lg bg-error text-on-error font-label-sm text-label-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {isResending ? 'Reenviando…' : 'Reenviar e-mail de confirmação'}
                </button>
              )}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-start gap-2.5 font-body-md text-body-md"
            >
              <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">
                mark_email_read
              </span>
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
            {effectiveMode === 'signup' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-fullname" className="font-label-md text-label-md font-semibold text-on-surface">
                    Nome completo
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
                      badge
                    </span>
                    <input
                      id="auth-fullname"
                      required
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex.: Mariana Silva"
                      className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface border border-transparent focus:outline-none focus:bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-course" className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                      Curso (opcional)
                    </label>
                    <input
                      id="auth-course"
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="Ex.: Eng. de Software"
                      className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface border border-transparent focus:outline-none focus:bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-semester" className="font-label-sm text-label-sm font-semibold text-on-surface-variant">
                      Semestre (opcional)
                    </label>
                    <input
                      id="auth-semester"
                      type="text"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="Ex.: 2026.2"
                      className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface border border-transparent focus:outline-none focus:bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/30"
                    />
                  </div>
                </div>
              </>
            )}

            {effectiveMode !== 'new-password' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-email" className="font-label-md text-label-md font-semibold text-on-surface">
                  E-mail acadêmico ou pessoal
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
                    alternate_email
                  </span>
                  <input
                    id="auth-email"
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@universidade.edu.br"
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface border border-transparent focus:outline-none focus:bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>
            )}

            {effectiveMode !== 'recovery' && effectiveMode !== 'magic' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password" className="font-label-md text-label-md font-semibold text-on-surface">
                    {effectiveMode === 'new-password' ? 'Nova senha' : 'Senha'}
                  </label>
                  {effectiveMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('recovery')}
                      className="font-label-sm text-label-sm text-secondary hover:underline cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
                    lock
                  </span>
                  <input
                    id="auth-password"
                    required
                    minLength={6}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={effectiveMode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 6 caracteres"
                    className="w-full h-11 pl-11 pr-11 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface border border-transparent focus:outline-none focus:bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {(effectiveMode === 'signup' || effectiveMode === 'new-password') && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-confirm-password" className="font-label-md text-label-md font-semibold text-on-surface">
                  Confirmar senha
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
                    verified_user
                  </span>
                  <input
                    id="auth-confirm-password"
                    required
                    minLength={6}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low font-body-md text-body-md text-on-surface border border-transparent focus:outline-none focus:bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 mt-1 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              <span>{titles.submit}</span>
            </button>
          </form>

          {hasOAuth && !passwordRecovery && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="h-px bg-surface-container-high flex-1" />
                <span className="font-code-sm text-code-sm text-on-surface-variant uppercase">
                  ou continue com
                </span>
                <span className="h-px bg-surface-container-high flex-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {enabledProviders.google && (
                  <button
                    type="button"
                    onClick={() => signInWithProvider('google')}
                    className="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-medium border border-outline-variant/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-secondary">account_circle</span>
                    <span>Google</span>
                  </button>
                )}
                {enabledProviders.github && (
                  <button
                    type="button"
                    onClick={() => signInWithProvider('github')}
                    className="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-medium border border-outline-variant/40 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">code</span>
                    <span>GitHub</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {effectiveMode === 'recovery' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="self-start inline-flex items-center gap-1.5 font-label-md text-label-md text-secondary hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Voltar ao login</span>
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
