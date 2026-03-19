'use client';

// OAuth Configuration
export const oauthConfig = {
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    scopes: ['email', 'profile'],
  },
  facebook: {
    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    scopes: ['email', 'public_profile'],
  },
  apple: {
    clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
    redirectUrl: typeof window !== 'undefined' 
      ? `${window.location.origin}/api/auth/callback/apple` 
      : '',
  },
};

// Check if OAuth providers are configured
export function isOAuthConfigured(provider: 'google' | 'apple' | 'facebook'): boolean {
  switch (provider) {
    case 'google':
      return !!oauthConfig.google.clientId;
    case 'facebook':
      return !!oauthConfig.facebook.appId;
    case 'apple':
      return !!oauthConfig.apple.clientId;
    default:
      return false;
  }
}

// Initialize Google Sign-In
export async function initGoogleSignIn(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.accounts) {
      resolve();
      return;
    }

    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}

// Google Sign-In
export async function signInWithGoogle(): Promise<{ idToken: string }> {
  if (!oauthConfig.google.clientId) {
    throw new Error('Google OAuth não está configurado');
  }

  await initGoogleSignIn();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Sign-In não carregado'));
      return;
    }

    let resolved = false;

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: oauthConfig.google.clientId,
      scope: 'email profile openid',
      callback: async (tokenResponse: { access_token?: string; error?: string }) => {
        if (resolved) return;
        resolved = true;
        if (tokenResponse.error) {
          reject(new Error('Login cancelado'));
          return;
        }
        if (tokenResponse.access_token) {
          resolve({ idToken: tokenResponse.access_token });
        } else {
          reject(new Error('Login cancelado'));
        }
      },
      error_callback: (error: { type: string }) => {
        if (resolved) return;
        resolved = true;
        // popup_closed = user closed the consent window
        if (error.type === 'popup_closed') {
          reject(new Error('Login cancelado'));
        } else {
          console.error('Google OAuth error:', error);
          reject(new Error('Erro no login com Google'));
        }
      },
    });
    
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}

// Initialize Facebook SDK
export async function initFacebookSDK(): Promise<void> {
  if (typeof window === 'undefined') return;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.FB) {
      resolve();
      return;
    }

    // Define fbAsyncInit before loading SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: oauthConfig.facebook.appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
      resolve();
    };

    // Load Facebook SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.head.appendChild(script);
  });
}

// Facebook Sign-In
export async function signInWithFacebook(): Promise<{ accessToken: string }> {
  if (!oauthConfig.facebook.appId) {
    throw new Error('Facebook OAuth não está configurado');
  }

  await initFacebookSDK();

  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK não carregado'));
      return;
    }

    window.FB.login(
      (response: { authResponse?: { accessToken: string } }) => {
        if (response.authResponse) {
          resolve({ accessToken: response.authResponse.accessToken });
        } else {
          reject(new Error('Login cancelado'));
        }
      },
      { scope: oauthConfig.facebook.scopes.join(',') }
    );
  });
}

// Apple Sign-In
export async function signInWithApple(): Promise<{ idToken: string; userData?: { firstName?: string; lastName?: string } }> {
  if (!oauthConfig.apple.clientId) {
    throw new Error('Apple Sign-In não está configurado');
  }

  // Apple Sign-In for Web using redirect
  return new Promise((resolve, reject) => {
    // Check if AppleID JS is loaded
    if (typeof window !== 'undefined' && !window.AppleID) {
      // Load AppleID JS
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.onload = () => performAppleSignIn(resolve, reject);
      script.onerror = () => reject(new Error('Failed to load Apple Sign-In'));
      document.head.appendChild(script);
    } else {
      performAppleSignIn(resolve, reject);
    }
  });
}

function performAppleSignIn(
  resolve: (value: { idToken: string; userData?: { firstName?: string; lastName?: string } }) => void,
  reject: (error: Error) => void
) {
  if (!window.AppleID) {
    reject(new Error('Apple Sign-In não disponível'));
    return;
  }

  window.AppleID.auth.init({
    clientId: oauthConfig.apple.clientId,
    scope: 'name email',
    redirectURI: oauthConfig.apple.redirectUrl,
    usePopup: true,
  });

  window.AppleID.auth.signIn()
    .then((response: { authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }) => {
      resolve({
        idToken: response.authorization.id_token,
        userData: response.user?.name ? {
          firstName: response.user.name.firstName,
          lastName: response.user.name.lastName,
        } : undefined,
      });
    })
    .catch((error: Error) => {
      reject(error);
    });
}

// Type declarations for global window
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          prompt: (callback: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: { client_id: string; scope: string; callback: (response: { access_token: string }) => void }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
    FB?: {
      init: (config: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
      login: (callback: (response: { authResponse?: { accessToken: string } }) => void, options: { scope: string }) => void;
    };
    fbAsyncInit?: () => void;
    AppleID?: {
      auth: {
        init: (config: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void;
        signIn: () => Promise<{ authorization: { id_token: string }; user?: { name?: { firstName?: string; lastName?: string } } }>;
      };
    };
  }
}

export {};
