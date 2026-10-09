import { useEffect, useState, useCallback } from 'react';

// Declarations for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          secondary_bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
      };
    };
  }
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      setIsReady(true);
    }
  }, [tg]);

  const haptic = {
    light: useCallback(() => tg?.HapticFeedback?.impactOccurred('light'), [tg]),
    medium: useCallback(() => tg?.HapticFeedback?.impactOccurred('medium'), [tg]),
    heavy: useCallback(() => tg?.HapticFeedback?.impactOccurred('heavy'), [tg]),
    success: useCallback(() => tg?.HapticFeedback?.notificationOccurred('success'), [tg]),
    warning: useCallback(() => tg?.HapticFeedback?.notificationOccurred('warning'), [tg]),
    selection: useCallback(() => tg?.HapticFeedback?.selectionChanged(), [tg]),
  };

  return {
    tg,
    isReady,
    user: tg?.initDataUnsafe?.user,
    colorScheme: tg?.colorScheme || 'dark',
    haptic,
    expand: () => tg?.expand(),
    close: () => tg?.close(),
  };
}
