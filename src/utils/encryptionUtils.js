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

// 🔒 MASTER KEY CACHE
// Uses _cachedKey (singleton) + sessionStorage to survive refreshes.
// Access via getEncryptionKey() and set via persistKeyToSession().

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
    'age',
    'age_in_days',
    'date_of_birth',
    'gender',
    'contact_number',
    'address',
    'patient_type',
    'diagnosis',
    'allergies',
    'appointment_date',
    'is_active',
    'is_pregnant',
    'pregnancy_weeks',
    'pregnancy_trimester',
    'pregnancy_notes',
    'edd',
    'birth_weight',
    'birth_length',
    'feeding_method',
    'vaccination_status',
    'developmental_milestones',
    'special_instructions',
    'blood_pressure',
    'heart_rate',
    'temperature',
    'respiratory_rate',
    'oxygen_saturation',
    'weight',
    'height',
    'bmi',
    'last_measured',
    'hemoglobin',
    'hematocrit',
    'rbc',
    'mcv',
    'mch',
    'mchc',
    'rdw',
    'platelets',
    'wbc',
    'neutrophils',
    'lymphocytes',
    'monocytes',
    'eosinophils',
    'basophils',
    'sodium',
    'potassium',
    'chloride',
    'bicarbonate',
    'anion_gap',
    'alt',
    'ast',
    'alkaline_phosphatase',
    'total_bilirubin',
    'direct_bilirubin',
    'indirect_bilirubin',
    'total_protein',
    'albumin',
    'globulin',
    'ag_ratio',
    'ggt',
    'creatinine',
    'blood_urea_nitrogen',
    'bun_creatinine_ratio',
    'egfr',
    'troponin_i',
    'troponin_t',
    'ck_mb',
    'nt_pro_bnp',
    'myoglobin',
    'tsh',
    'free_t3',
    'free_t4',
    'crp',
    'esr',
    'ferritin',
    'procalcitonin',
    'pt',
    'inr',
    'aptt',
    'd_dimer',
    'fibrinogen',
    'urine_color',
    'urine_appearance',
    'urine_ph',
    'urine_specific_gravity',
    'urine_protein',
    'urine_glucose',
    'urine_ketones',
    'urine_blood',
    'urine_leucocytes',
    'urine_nitrites',
    'urine_bilirubin',
    'urine_urobilinogen',
    'urine_rbc',
    'urine_wbc',
    'urine_epithelial_cells',
    'urine_casts',
    'urine_crystals',
    'urine_bacteria',
    'fasting_glucose',
    'postprandial_glucose',
    'random_glucose',
    'insulin',
    'c_peptide',
    'hba1c',
    'total_cholesterol',
    'hdl_cholesterol',
    'ldl_cholesterol',
    'triglycerides',
    'vldl_cholesterol',
    'last_tested',
    'alp',
    'bilirubin_direct',
    'wbc_count',
    'rbc_count',
    'platelet_count',
    'blood_sugar',
    'urea',
    'uric_acid',
    'calcium',
    'magnesium',
    'phosphate',
    'bilirubin_total',
    'bilirubin_indirect',
    'troponin',
    'ldh',
    'total_t4',
    'total_t3',
    'ptt',
    'bun',
    'bilirubin_neonatal',
    'glucose_neonatal',
    'calcium_neonatal',
    'pku_result',
    'thyroid_screening',
    'urine_leukocytes',
    'urine_nitrite',
    'weight_percentile',
    'height_percentile',
    'head_circumference_percentile',
    'bmi_percentile',
    'labs',
    'is_lactating',
    'lactation_notes',
    'emergency_contact',
    'notes'
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
        
        // Encrypt any non-null value that is not an object/array
        if (val !== null && val !== undefined && typeof val !== 'object') {
            const strVal = String(val);
            if (strVal.trim() !== '') {
                encrypted[field] = await encryptValue(strVal, cryptoKey);
            }
        } else if (val && typeof val === 'object') {
            // Also encrypt JSON objects like 'labs'
            encrypted[field] = await encryptValue(JSON.stringify(val), cryptoKey);
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
        let val = decrypted[field];
        if (val && typeof val === 'string' && val.includes(':')) {
            const dec = await decryptValue(val, cryptoKey);
            
            // Attempt to restore original types
            if (dec === 'true') val = true;
            else if (dec === 'false') val = false;
            else if (!isNaN(dec) && dec.trim() !== '' && !field.includes('date') && !field.includes('measured') && !field.includes('tested')) {
                val = Number(dec);
            } else if ((dec.startsWith('{') && dec.endsWith('}')) || (dec.startsWith('[') && dec.endsWith(']'))) {
                try { val = JSON.parse(dec); } catch { val = dec; }
            } else {
                val = dec;
            }
            
            decrypted[field] = val;
        }
    }
    return decrypted;
}

/**
 * Decrypts a list of patients using either a master key or shared keys.
 * Handles owners (Master Key) and authorized support (Private Key + Shared Keys).
 * @param {object[]} patients
 * @param {CryptoKey} masterKey — Optional master AES key
 * @param {CryptoKey} privateKey — Optional user RSA private key
 * @returns {Promise<object[]>}
 */
export async function decryptPatientList(patients, masterKey, privateKey) {
    if (!Array.isArray(patients)) return patients;
    if (!masterKey && !privateKey) return patients;

    return Promise.all(patients.map(async (patient) => {
        // 1. If we have a Master Key (Owner / Admin with session), try direct decryption
        if (masterKey) {
            return decryptPatient(patient, masterKey);
        }

        // 2. If we have a Private Key (Support Staff), and the patient has a shared key
        if (privateKey && patient.shared_encryption_key) {
            try {
                // Unwrapped shared key is the patient's Master AES Key
                const decryptedMasterKeyHex = await decryptWithPrivateKey(patient.shared_encryption_key, privateKey);
                const rawKeyBytes = hexToBytes(decryptedMasterKeyHex);
                
                const sharedMasterKey = await crypto.subtle.importKey(
                    'raw',
                    rawKeyBytes,
                    { name: 'AES-GCM' },
                    true,
                    ['decrypt']
                );
                
                return decryptPatient(patient, sharedMasterKey);
            } catch (err) {
                console.warn(`⚠️ [Decryption] Failed to decrypt shared key for patient ${patient.id}:`, err);
                return patient; // Return encrypted if shared decryption fails
            }
        }

        return patient; // Return as-is if no applicable key
    }));
}

/**
 * @deprecated Use decryptPatientList instead
 */
export async function decryptPatients(patients, cryptoKey) {
    return decryptPatientList(patients, cryptoKey, null);
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
