import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

// Custom URL scheme registered in Info.plist for OAuth deep links.
export const NATIVE_REDIRECT = 'riposte://auth/callback';
