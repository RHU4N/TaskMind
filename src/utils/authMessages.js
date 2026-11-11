/**
 * @file authMessages.js
 * Pure authentication error translation and URL callback parsing helpers.
 */

export function translateAuthError(errorOrMessage) {
  const raw =
    typeof errorOrMessage === 'string'
      ? errorOrMessage
      : errorOrMessage?.message || errorOrMessage?.error_description || '';
  const lower = raw.toLowerCase();

  if (!raw) {
    return { message: 'Não foi possível concluir a autenticação.', needsConfirmation: false };
  }
  if (lower.includes('invalid login credentials')) {
    return {
      message: 'E-mail ou senha incorretos. Confira seus dados ou entre usando o link mágico.',
      needsConfirmation: false,
    };
  }
  if (lower.includes('email not confirmed')) {
    return {
      message: 'Seu e-mail ainda não foi confirmado. Confira sua caixa de entrada ou reenvie o link abaixo.',
      needsConfirmation: true,
    };
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return {
      message: 'Este e-mail já está cadastrado. Tente entrar ou usar "Esqueci minha senha".',
      needsConfirmation: false,
    };
  }
  if (lower.includes('password should be at least')) {
    return {
      message: 'A senha deve ter pelo menos 6 caracteres.',
      needsConfirmation: false,
    };
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return {
      message: 'Informe um endereço de e-mail válido.',
      needsConfirmation: false,
    };
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('only request this after') ||
    lower.includes('too many requests')
  ) {
    return {
      message: 'Muitas tentativas em sequência. Aguarde cerca de 1 minuto antes de tentar novamente.',
      needsConfirmation: false,
    };
  }
  if (lower.includes('otp_expired') || lower.includes('expired') || lower.includes('invalid or has expired')) {
    return {
      message: 'O link expirou ou já foi utilizado. Solicite um novo link para continuar.',
      needsConfirmation: false,
    };
  }
  if (lower.includes('different from the old password')) {
    return {
      message: 'A nova senha precisa ser diferente da senha anterior.',
      needsConfirmation: false,
    };
  }
  if (lower.includes('signups not allowed')) {
    return {
      message: 'Novos cadastros estão desativados no momento.',
      needsConfirmation: false,
    };
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return {
      message: 'Falha de conexão com o serviço de login. Verifique sua internet e tente novamente.',
      needsConfirmation: false,
    };
  }

  return { message: raw, needsConfirmation: false };
}

export function parseAuthUrlError(href) {
  if (!href) return null;
  try {
    const parsed = new URL(href);
    const hashParams = new URL(`https://local.invalid/?${parsed.hash.replace(/^#/, '')}`).searchParams;
    const errorCode = parsed.searchParams.get('error_code') || hashParams.get('error_code') || '';
    const errorDesc =
      parsed.searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      parsed.searchParams.get('error') ||
      hashParams.get('error') ||
      '';

    if (!errorCode && !errorDesc) return null;
    const combined = `${errorCode} ${errorDesc}`.trim();
    return translateAuthError(combined).message;
  } catch {
    return null;
  }
}
