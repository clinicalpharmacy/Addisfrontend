import React, { useEffect } from 'react';
import {
    getSessionKey, decryptPatient,
    loadPrivateKey, decryptWithPrivateKey, hexToBytes
} from '../utils/encryptionUtils';
import api from '../utils/api';

/**
 * PatientUnlocker — silently attempts decryption using cached keys.
 * No vault password prompt is shown; children are always rendered.
 */
const PatientUnlocker = ({ patientData, userSalt, onUnlocked, children }) => {

    useEffect(() => {
        if (!patientData?.id) return;
        silentUnlock();
    }, [patientData?.id]);

    const silentUnlock = async () => {
        try {
            // Already decrypted (no IV prefix)
            if (patientData?.full_name && !String(patientData.full_name).includes(':')) {
                onUnlocked(patientData);
                return;
            }

            // Try owner master key
            const masterKey = getSessionKey();
            if (masterKey) {
                const decrypted = await decryptPatient(patientData, masterKey);
                if (decrypted?.full_name && !String(decrypted.full_name).includes(':')) {
                    onUnlocked(decrypted);
                    return;
                }
            }

            // Try admin support session key
            try {
                // We need the admin's master key to unwrap their private key
                if (masterKey) {
                    const res = await api.get(`/access/granted?patient_id=${patientData.id}`);
                    if (res?.success && res?.request?.encrypted_key) {
                        const privKey = await loadPrivateKey(masterKey);
                        if (privKey) {
                            const patientKeyHex = await decryptWithPrivateKey(res.request.encrypted_key, privKey);
                            
                            // IMPORT HEX AS CRYPTOKEY
                            const rawKeyBytes = hexToBytes(patientKeyHex);
                            const sharedMasterKey = await crypto.subtle.importKey(
                                'raw',
                                rawKeyBytes,
                                { name: 'AES-GCM' },
                                true,
                                ['decrypt']
                            );

                            const decrypted = await decryptPatient(patientData, sharedMasterKey);
                            if (decrypted?.full_name && !String(decrypted.full_name).includes(':')) {
                                onUnlocked(decrypted);
                                return;
                            }
                        }
                    }
                }
            } catch (_) {}

            // Fallback: pass through as-is
            onUnlocked(patientData);

        } catch (err) {
            console.warn('PatientUnlocker silent decrypt failed:', err);
            onUnlocked(patientData);
        }
    };

    // Always render children — no blocking prompt
    return <>{children}</>;
};

export default PatientUnlocker;
