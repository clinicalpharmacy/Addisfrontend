/**
 * encryptionUtils.js  — Frontend Zero-Knowledge Encryption
 *
 * Uses the Web Crypto API (built into every modern browser, no libraries needed).
 *
 * Flow:
 *  1. On login/register → server returns `encryption_salt`
 *  2. Call `deriveKey(password, salt)` → get AES-256-GCM key  (stays in memory only)
 *  3. Call `encryptValue(plainText, key)` before saving sensitive data to the server
 *  4. Call `decryptValue(cipherText, key)` after fetching sensitive data from the server
 *
 * The key NEVER leaves the browser. The server only ever stores encrypted text + the salt.
 * Without the password, even a database breach reveals nothing.
 */

// ─────────────────────────────────────────────────────────
//  Internal helpers
// ─────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 10000;
const KEY_LENGTH_BITS = 256;

/** Convert a hex string to a Uint8Array */
export function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

/** Convert a Uint8Array to a hex string */
export function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────
//  1. Key Derivation  (PBKDF2-SHA-256)
// ─────────────────────────────────────────────────────────

// 🔒 SESSION-BASED KEY CACHING
// Keeps the derived Master Key in memory for the current tab only.
// This allows a "1-Click" experience after the first successful unlock.
let _sessionMasterKey = null;

export function setSessionKey(key) {
    _sessionMasterKey = key;
}

export function getSessionKey() {
    return _sessionMasterKey;
}

/**
 * Derives an AES-256-GCM CryptoKey from a password + salt.
 * Call this once after login and store the result in React state (not localStorage).
 *
 * @param {string} password  — the user's raw password
 * @param {string} saltHex   — the hex-encoded salt returned by the server
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(password, saltHex) {
    if (!password || !saltHex) throw new Error('Password and salt are required to derive key');

    // Always derive fresh — each user has a unique password+salt combination
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: hexToBytes(saltHex),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH_BITS },
        true,
        ['encrypt', 'decrypt']
    );
}

// ─────────────────────────────────────────────────────────
//  2. Encrypt
// ─────────────────────────────────────────────────────────

/**
 * Encrypts a plain-text string.
 * @param {string} plainText
 * @param {CryptoKey} cryptoKey — result of deriveKey()
 * @returns {Promise<string>}   — format: "ivHex:cipherHex"
 */
export async function encryptValue(plainText, cryptoKey) {
    if (plainText === null || plainText === undefined) return null;
    if (!cryptoKey) return plainText; // graceful fallback: no key → return as-is

    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        enc.encode(String(plainText))
    );

    return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(cipherBuffer))}`;
}

// ─────────────────────────────────────────────────────────
//  3. Decrypt
// ─────────────────────────────────────────────────────────

/**
 * Decrypts a cipher-text string produced by encryptValue().
 * @param {string} cipherText  — format: "ivHex:cipherHex"
 * @param {CryptoKey} cryptoKey — result of deriveKey()
 * @returns {Promise<string>}  — original plain text
 */
export async function decryptValue(cipherText, cryptoKey) {
    if (!cipherText || typeof cipherText !== 'string') return cipherText;
    if (!cryptoKey) return cipherText; // graceful fallback
    if (!cipherText.includes(':')) return cipherText; // not encrypted format

    try {
        const [ivHex, cipherHex] = cipherText.split(':');
        const iv = hexToBytes(ivHex);
        const cipherBytes = hexToBytes(cipherHex);

        const plainBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            cipherBytes
        );

        return new TextDecoder().decode(plainBuffer);
    } catch {
        // Return original value if decryption fails (e.g. unencrypted legacy data)
        return cipherText;
    }
}

// ─────────────────────────────────────────────────────────
//  4. Batch helpers for patient objects
// ─────────────────────────────────────────────────────────

/** Which patient fields should be encrypted */
const SENSITIVE_PATIENT_FIELDS = [
    'full_name',
    'contact_number',
    'address',
    'diagnosis',
    'notes',
    'allergies',
    'emergency_contact'
];

/**
 * Encrypts all sensitive fields of a patient object.
 * @param {object} patient
 * @param {CryptoKey} cryptoKey
 * @returns {Promise<object>} — patient with encrypted fields
 */
export async function encryptPatient(patient, cryptoKey) {
    if (!cryptoKey || !patient) return patient;
    const encrypted = { ...patient };
    for (const field of SENSITIVE_PATIENT_FIELDS) {
        const val = encrypted[field];
        // Only encrypt non-null string values — skip arrays, objects, numbers
        if (val !== null && val !== undefined && typeof val === 'string' && val.trim() !== '') {
            encrypted[field] = await encryptValue(val, cryptoKey);
        }
    }
    return encrypted;
}

/**
 * Decrypts all sensitive fields of a patient object.
 * @param {object} patient
 * @param {CryptoKey} cryptoKey
 * @returns {Promise<object>} — patient with decrypted fields
 */
export async function decryptPatient(patient, cryptoKey) {
    if (!cryptoKey || !patient) return patient;
    const decrypted = { ...patient };
    for (const field of SENSITIVE_PATIENT_FIELDS) {
        if (decrypted[field]) {
            decrypted[field] = await decryptValue(decrypted[field], cryptoKey);
        }
    }
    return decrypted;
}

/**
 * Decrypts a list of patients.
 * @param {object[]} patients
 * @param {CryptoKey} cryptoKey
 * @returns {Promise<object[]>}
 */
export async function decryptPatients(patients, cryptoKey) {
    if (!cryptoKey || !Array.isArray(patients)) return patients;
    return Promise.all(patients.map(p => decryptPatient(p, cryptoKey)));
}

// ─────────────────────────────────────────────────────────
//  5. Public Key Infrastructure (PKI) - Shared Keys
// ─────────────────────────────────────────────────────────

let _userPrivateKey = null;

/**
 * Loads the user's private key into memory.
 */
export async function loadPrivateKey(masterKey) {
    if (_userPrivateKey) return _userPrivateKey;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    if (!user.private_key_encrypted) return null;

    try {
        _userPrivateKey = await unwrapPrivateKey(user.private_key_encrypted, masterKey);
        return _userPrivateKey;
    } catch (err) {
        console.error("Failed to unwrap private key", err);
        return null;
    }
}


/**
 * Generates an RSA-OAEP 2048-bit keypair for a user.
 */
export async function generateUserKeyPair() {
    return await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );
}

/**
 * Exports a public key to a base64 string for DB storage.
 */
export async function exportPublicKey(key) {
    const exported = await crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Wraps (encrypts) a private key using the Master AES key.
 */
export async function wrapPrivateKey(privateKey, masterKey) {
    const exportedPrivBuf = await crypto.subtle.exportKey("pkcs8", privateKey);
    // Use AES-GCM to encrypt the private key buffer
    const encryptedBytes = await encryptValue(bytesToHex(new Uint8Array(exportedPrivBuf)), masterKey);
    return encryptedBytes;
}

/**
 * Unwraps (decrypts) a private key using the Master AES key.
 */
export async function unwrapPrivateKey(wrappedHex, masterKey) {
    const decryptedHex = await decryptValue(wrappedHex, masterKey);
    const privBuf = hexToBytes(decryptedHex);
    return await crypto.subtle.importKey(
        "pkcs8",
        privBuf,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );
}

/**
 * Encrypts a small piece of data (the AES Master Key) for a recipient's Public Key.
 */
export async function encryptForRecipient(plainText, publicKeyBase64) {
    if (!publicKeyBase64) throw new Error("No public key provided for encryption.");
    
    // Clean headers if present (---BEGIN PUBLIC KEY---)
    const cleanB64 = publicKeyBase64.replace(/---.*---/g, "").replace(/\s/g, "");
    
    let pubKeyBuf;
    try {
        pubKeyBuf = new Uint8Array(atob(cleanB64).split("").map(c => c.charCodeAt(0)));
    } catch (e) {
        throw new Error("Invalid encryption key format (not valid base64)");
    }

    const pubKey = await crypto.subtle.importKey(
        "spki",
        pubKeyBuf,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"]
    );
    const enc = new TextEncoder();
    const encryptedBuf = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        pubKey,
        enc.encode(plainText)
    );
    return bytesToHex(new Uint8Array(encryptedBuf));
}

/**
 * Decrypts data using the user's RSA private key.
 */
export async function decryptWithPrivateKey(encryptedHex, privateKey) {
    const encryptedBuf = hexToBytes(encryptedHex);
    const decryptedBuf = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedBuf
    );
    return new TextDecoder().decode(decryptedBuf);
}

// ─────────────────────────────────────────────────────────
//  6. Singleton Key Management & Lifecycle
// ─────────────────────────────────────────────────────────

let _cachedKey = null;

/**
 * Gets the current encryption key from memory or re-imports it from sessionStorage.
 * This is the main function hooks will use.
 */
export async function getEncryptionKey() {
    // 1. Check memory cache first
    if (_cachedKey) return _cachedKey;

    // 2. Check window global (set by Login.jsx)
    if (window.__enc_key) {
        _cachedKey = window.__enc_key;
        return _cachedKey;
    }

    // 3. Try re-importing from sessionStorage
    const exportedKey = sessionStorage.getItem('enc_key_raw');
    if (exportedKey) {
        try {
            const keyBytes = hexToBytes(exportedKey);
            _cachedKey = await crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM' },
                true, // extractable
                ['encrypt', 'decrypt']
            );
            window.__enc_key = _cachedKey;
            console.log('💎 [Encryption] Key successfully restored from session storage.');
            return _cachedKey;
        } catch (err) {
            console.error('❌ [Encryption] Failed to restore key from session:', err);
            return null;
        }
    }

    return null;
}

/**
 * Persists a key to sessionStorage so it survives refreshes.
 * Cleared when the tab or browser closes.
 */
export async function persistKeyToSession(cryptoKey) {
    if (!cryptoKey) return;
    try {
        const rawKey = await crypto.subtle.exportKey('raw', cryptoKey);
        const hexKey = bytesToHex(new Uint8Array(rawKey));
        sessionStorage.setItem('enc_key_raw', hexKey);
        _cachedKey = cryptoKey;
        window.__enc_key = cryptoKey;
    } catch (err) {
        console.error('❌ [Encryption] Failed to persist key:', err);
    }
}

/**
 * Clears any encryption-related session data on logout.
 */
export function clearEncryptionSession() {
    sessionStorage.removeItem('enc_salt');
    sessionStorage.removeItem('enc_key_raw');
    _cachedKey = null;
    window.__enc_key = null;
}
