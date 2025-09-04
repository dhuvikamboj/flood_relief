// Lightweight adapter that prefers Ionic Secure Storage / Capacitor plugin when available,
// and falls back to browser localStorage when not available (web).
// This avoids adding a hard dependency on the enterprise SDK while allowing
// the app to use Ionic Secure Storage when the runtime provides it.

import localforage from 'localforage';

type PluginLike = any;

function getNativePlugin(): PluginLike | null {
  if (typeof window === 'undefined') return null;
  const w: any = window as any;
  // Common plugin exposures (try a few candidates)
  return w.IonicSecureStorage || w.Ionic?.SecureStorage || w.Capacitor?.plugins?.SecureStorage || w.secureStorage || null;
}

export const isNativeSecureAvailable = (): boolean => !!getNativePlugin();

export const getItem = async (key: string): Promise<string | null> => {
  const plugin = getNativePlugin();
  if (plugin) {
    try {
      // Try several common method signatures
      if (typeof plugin.get === 'function') {
        // plugin.get(key) or plugin.get({ key })
        const r = await plugin.get(key).catch(async () => await plugin.get({ key }).catch(() => null));
        if (r && typeof r === 'object' && 'value' in r) return r.value;
        return typeof r === 'string' ? r : null;
      }
      if (typeof plugin.getItem === 'function') {
        return await plugin.getItem(key);
      }
    } catch (e) {
      // fallback to web storage
    }
  }

  try {
    return await localforage.getItem<string>(key) as string | null;
  } catch (e) {
    return null;
  }
};

export const setItem = async (key: string, value: string): Promise<void> => {
  const plugin = getNativePlugin();
  if (plugin) {
    try {
      if (typeof plugin.set === 'function') {
        // plugin.set(key, value) or plugin.set({ key, value })
        try {
          await plugin.set(key, value);
        } catch {
          await plugin.set({ key, value });
        }
        return;
      }
      if (typeof plugin.setItem === 'function') {
        await plugin.setItem(key, value);
        return;
      }
    } catch (e) {
      // ignore and fall through to localStorage
    }
  }

  try {
    await localforage.setItem(key, value);
  } catch (e) {
    // ignore
  }
};

export const removeItem = async (key: string): Promise<void> => {
  const plugin = getNativePlugin();
  if (plugin) {
    try {
      if (typeof plugin.remove === 'function') {
        try {
          await plugin.remove(key);
        } catch {
          await plugin.remove({ key });
        }
        return;
      }
      if (typeof plugin.removeItem === 'function') {
        await plugin.removeItem(key);
        return;
      }
    } catch (e) {
      // ignore and fall back
    }
  }

  try {
    await localforage.removeItem(key);
  } catch (e) {
    // ignore
  }
};

export default {
  isNativeSecureAvailable,
  getItem,
  setItem,
  removeItem,
};
