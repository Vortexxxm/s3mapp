import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface Storage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

class WebStorage implements Storage {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  async deleteItemAsync(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

class NativeStorage implements Storage {
  async getItemAsync(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async deleteItemAsync(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

export const storage: Storage = Platform.OS === 'web' ? new WebStorage() : new NativeStorage();