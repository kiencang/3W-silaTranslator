const DB_NAME = 'secure_key_db';
const STORE_NAME = 'crypto_keys';
const KEY_ID = 'master_aes_gcm_key';

const ENCRYPTED_KEY_STORAGE = 'encrypted_api_key';
const IV_STORAGE = 'api_key_iv';
const LEGACY_PLAINTEXT_STORAGE = 'user_gemini_api_key';

function isBrowserSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined' &&
    typeof window.indexedDB !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined'
  );
}

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getOrCreateMasterKey(): Promise<CryptoKey> {
  const db = await openKeyDatabase();
  try {
    const existingKey = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_ID);
      req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
      req.onerror = () => reject(req.error);
    });

    if (existingKey) {
      return existingKey;
    }

    const newKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // extractable = false: khóa chặt trong nhân bảo mật của trình duyệt
      ['encrypt', 'decrypt']
    );

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newKey, KEY_ID);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return newKey;
  } finally {
    db.close();
  }
}

async function getExistingMasterKey(): Promise<CryptoKey | undefined> {
  const db = await openKeyDatabase();
  try {
    return await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_ID);
      req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binary = window.atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function saveSecureApiKey(rawKey: string): Promise<void> {
  if (!isBrowserSupported()) return;

  const trimmed = rawKey.trim();
  if (!trimmed) {
    await removeSecureApiKey();
    return;
  }

  const masterKey = await getOrCreateMasterKey();
  const ivBuffer = new ArrayBuffer(12);
  const iv = new Uint8Array(ivBuffer);
  window.crypto.getRandomValues(iv);

  const encodedText = new TextEncoder().encode(trimmed);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    encodedText
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  window.localStorage.setItem(ENCRYPTED_KEY_STORAGE, uint8ArrayToBase64(encryptedBytes));
  window.localStorage.setItem(IV_STORAGE, uint8ArrayToBase64(iv));

  // Luôn xóa sạch key dạng rõ cũ nếu có
  window.localStorage.removeItem(LEGACY_PLAINTEXT_STORAGE);
}

export async function getSecureApiKey(): Promise<string> {
  if (!isBrowserSupported()) return '';

  try {
    // Tự động chuyển đổi (Auto-Migrate) nếu còn key dạng rõ cũ trong localStorage
    const legacyPlaintextKey = window.localStorage.getItem(LEGACY_PLAINTEXT_STORAGE);
    if (legacyPlaintextKey) {
      const cleanLegacy = legacyPlaintextKey.trim();
      window.localStorage.removeItem(LEGACY_PLAINTEXT_STORAGE);
      if (cleanLegacy) {
        await saveSecureApiKey(cleanLegacy);
        return cleanLegacy;
      }
    }

    const encryptedBase64 = window.localStorage.getItem(ENCRYPTED_KEY_STORAGE);
    const ivBase64 = window.localStorage.getItem(IV_STORAGE);

    if (!encryptedBase64 || !ivBase64) {
      return '';
    }

    const masterKey = await getExistingMasterKey();
    if (!masterKey) {
      await removeSecureApiKey();
      return '';
    }

    const encryptedBytes = base64ToUint8Array(encryptedBase64);
    const iv = base64ToUint8Array(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    // Cơ chế Tự hủy khi phát hiện can thiệp (Tamper Detection)
    await removeSecureApiKey();
    return '';
  }
}

export async function removeSecureApiKey(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (window.localStorage) {
      window.localStorage.removeItem(ENCRYPTED_KEY_STORAGE);
      window.localStorage.removeItem(IV_STORAGE);
      window.localStorage.removeItem(LEGACY_PLAINTEXT_STORAGE);
    }

    if (window.indexedDB) {
      const db = await openKeyDatabase();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } finally {
        db.close();
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}
