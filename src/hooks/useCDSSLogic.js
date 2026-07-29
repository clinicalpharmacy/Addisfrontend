import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import supabase from '../utils/supabase';
import { mapPatientToFacts, evaluateRule, formatAlertMessage } from '../components/CDSS/RuleEngine';
import { sampleTestRules } from '../constants/cdssRules';
import { getEncryptionKey, decryptPatient, decryptValue } from '../utils/encryptionUtils';

export const useCDSSLogic = (patientData) => {
    const [alerts, setAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    const [severityFilter, setSeverityFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [patientFacts, setPatientFacts] = useState(null);
    const [analysisStats, setAnalysisStats] = useState(null);
    const [clinicalRules, setClinicalRules] = useState([]);
    const [medications, setMedications] = useState([]);
    const [expandedAlert, setExpandedAlert] = useState(null);
    const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isTestingRules, setIsTestingRules] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [rulesLoading, setRulesLoading] = useState(false);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [decryptionFailed, setDecryptionFailed] = useState(false);
    const [decryptedPatient, setDecryptedPatient] = useState(null);
    const [forceReanalysisKey, setForceReanalysisKey] = useState(0);
    const [medicationsFetched, setMedicationsFetched] = useState(false);

    const previousPatientIdRef = useRef(null);
    const analyzePatientRef = useRef(null);

    const fetchClinicalRules = useCallback(async () => {
        try {
            console.log('📋 Fetching clinical rules from backend API...');
            let debugText = '📋 Fetching clinical rules...\n';
            setDebugInfo(prev => prev + debugText);
            setRulesLoading(true);

            const result = await api.get('/clinical-rules');

            if (!result.success) {
                console.error('❌ Error fetching rules:', result.error);
                debugText += `❌ Error fetching rules: ${result.error || 'Unknown error'}\n`;
                setDebugInfo(prev => prev + debugText);
                setClinicalRules(sampleTestRules);
                return;
            }

            const data = result.rules || [];
            console.log(`✅ Loaded ${data.length} active rules`);
            debugText += `✅ Loaded ${data.length} active rules\n`;

            if (data && data.length > 0) {
                setClinicalRules(data);
                debugText += `\n✅ Loaded ${data.length} rules from database\n`;
            } else {
                console.log('⚠️ No rules in database, using sample test rules');
                setClinicalRules(sampleTestRules);
                debugText += `⚠️ Using ${sampleTestRules.length} sample test rules (Database returned ${data ? '0' : 'null'} rules)\n`;
            }

            setDebugInfo(prev => prev + debugText);
        } catch (error) {
            console.error('❌ Error fetching rules:', error);
            setDebugInfo(prev => prev + `❌ Exception fetching rules: ${error.message}\n`);
            setClinicalRules(sampleTestRules);
        } finally {
            setRulesLoading(false);
        }
    }, []);

    const fetchPatientMedications = useCallback(async () => {
        let fallbackMedications = [];
        if (patientData?.medication_history && Array.isArray(patientData.medication_history)) {
            fallbackMedications = patientData.medication_history;
        }

        if (!patientData?.id) {
            console.log('⚠️ No patient id provided for medication fetch, using fallback if available');
            setMedications(fallbackMedications);
            setMedicationsFetched(true);
            return;
        }

        try {
            console.log('💊 Fetching medications for:', patientData.id);
            let debugText = `💊 Fetching medications for ${patientData.id}...\n`;
            setDebugInfo(prev => prev + debugText);

            const result = await api.get(`/medication-history/patient/${patientData.id}`);

            if (!result.success) {
                console.error('❌ Error fetching medications:', result.error);
                debugText += `❌ Error fetching medications: ${result.error || 'Unknown error'}\n`;
                setDebugInfo(prev => prev + debugText);
                setMedications(fallbackMedications);
                return;
            }

            const data = result.medications || [];
            console.log(`✅ Loaded ${data.length} medications from API`);
            debugText += `✅ Loaded ${data.length} medications from API\n`;
            
            let medsResult = data;
            const encKey = await getEncryptionKey();
            if (encKey && medsResult.length > 0) {
                try {
                    medsResult = await Promise.all(medsResult.map(async (m) => {
                        const decryptedMed = { ...m };
                        const sensitiveMedsFields = ['drug_name', 'dose', 'frequency', 'route', 'indication', 'notes', 'medical_condition'];
                        for (const field of sensitiveMedsFields) {
                            if (decryptedMed[field] && typeof decryptedMed[field] === 'string' && decryptedMed[field].includes(':')) {
                                decryptedMed[field] = await decryptValue(decryptedMed[field], encKey);
                            }
                        }
                        return decryptedMed;
                    }));
                    console.log('💎 [CDSS] Medications decrypted for UI');
                    debugText += '💎 Medications decrypted for display\n';
                } catch (decErr) {
                    console.error('❌ [CDSS] Medication decryption failed:', decErr);
                }
            }

            if (medsResult.length > 0) {
                setMedications(medsResult);
            } else {
                console.log('⚠️ No medications in history table, checking patient record...');
                debugText += '⚠️ No medications in history table, checking patient record...\n';
                
                if (fallbackMedications.length > 0) {
                    console.log(`✅ Found ${fallbackMedications.length} medications in patient record. Decrypting...`);
                    
                    let decryptedFallback = fallbackMedications;
                    if (encKey) {
                        try {
                            decryptedFallback = await Promise.all(fallbackMedications.map(async (m) => {
                                const d = { ...m };
                                const sensitiveMedsFields = ['drug_name', 'dose', 'frequency', 'route', 'indication', 'notes', 'medical_condition'];
                                for (const field of sensitiveMedsFields) {
                                    if (d[field] && typeof d[field] === 'string' && d[field].includes(':')) {
                                        d[field] = await decryptValue(d[field], encKey);
                                    }
                                }
                                return d;
                            }));
                            debugText += `💎 Fallback medications (${decryptedFallback.length}) decrypted\n`;
                        } catch (e) {
                            console.error('Fallback decryption failed', e);
                        }
                    }
                    setMedications(decryptedFallback);
                } else {
                    setMedications([]);
                }
            }

            setDebugInfo(prev => prev + debugText);
        } catch (error) {
            console.error('❌ Error in fetchPatientMedications:', error);
            setDebugInfo(prev => prev + `❌ Exception fetching medications: ${error.message}\n`);
            setMedications(fallbackMedications);
        } finally {
            setMedicationsFetched(true);
        }
    }, [patientData?.patient_code, patientData?.medication_history]);

    // ===== KEY FUNCTION: Extract name and effect from rule =====
    const extractInteractionData = (rule) => {
        let name = '';
        let effect = '';
        
        // Method 1: Direct from rule top level (if your JSON has it at root)
        if (rule.name) {
            name = rule.name;
        }
        if (rule.effect) {
            effect = rule.effect;
        }
        
        // Method 2: From rule.any array (your JSON structure)
        // Your JSON: { "any": [ { "all": [...], "name": "Warfarin + Aspirin", "effect": "Increased bleeding risk" } ] }
        if (!name && rule.any && Array.isArray(rule.any)) {
            for (const item of rule.any) {
                // Check if the item has name/effect
                if (item.name) {
                    name = item.name;
                }
                if (item.effect) {
                    effect = item.effect;
                }
                // Also check inside all arrays
                if (item.all && Array.isArray(item.all)) {
                    for (const subItem of item.all) {
                        if (subItem.name) {
                            name = subItem.name;
                        }
                        if (subItem.effect) {
                            effect = subItem.effect;
                        }
                    }
                }
            }
        }
        
        // Method 3: From rule_action
        if (!name && rule.rule_action) {
            let action = rule.rule_action;
            if (typeof action === 'string') {
                try { action = JSON.parse(action); } catch (e) {}
            }
            if (action.name) name = action.name;
            if (action.effect) effect = action.effect;
        }
        
        return { name, effect };
    };

    const analyzePatient = useCallback(async (overrideRules = null, overrideMedications = null) => {
        if (!patientData?.id) {
            console.warn('⚠️ Cannot analyze: Patient ID missing');
            return;
        }

        setLoading(true);
        setAnalysisError(null);
        
        setAlerts([]);
        setFilteredAlerts([]);
        setAnalysisStats(null);

        let debug = '🚀 === CDSS ANALYSIS STARTED ===\n';
        const rulesToUse = overrideRules || clinicalRules || [];
        const medsToUse = overrideMedications || medications || [];

        debug += `Patient: ${patientData.id}\n`;
        debug += `Rules: ${rulesToUse.length}\n`;
        debug += `Meds: ${medsToUse.length}\n\n`;
        setDebugInfo(debug);

        try {
            setHasAnalyzed(true);
            let currentPatient = { ...patientData };
            let currentMedications = [...medsToUse];
            
            const encKey = await getEncryptionKey();
            if (encKey) {
                try {
                    currentPatient = await decryptPatient(currentPatient, encKey);
                    setDecryptedPatient(currentPatient);
                    setDecryptionFailed(false);

                    currentMedications = await Promise.all(medsToUse.map(async (m) => {
                        const d = { ...m };
                        const sensitiveMedsFields = ['drug_name', 'dose', 'frequency', 'roa', 'route', 'indication', 'notes', 'medical_condition'];
                        for (const field of sensitiveMedsFields) {
                            const val = d[field];
                            if (val && typeof val === 'string' && val.includes(':')) {
                                try { d[field] = await decryptValue(val, encKey); } catch (e) {}
                            }
                        }
                        return d;
                    }));
                    setDecryptionFailed(false);
                } catch (decErr) { 
                    console.error('Decryption failed', decErr); 
                    setDecryptionFailed(true);
                }
            } else {
                setDecryptionFailed(true);
            }

            const facts = mapPatientToFacts(currentPatient, currentMedications);
            setPatientFacts(facts);

            const triggeredAlerts = [];
            let rulesEvaluated = 0;
            let rulesTriggered = 0;

            const rulesSrc = rulesToUse.length > 0 ? rulesToUse : sampleTestRules;

            for (const rule of rulesSrc) {
                rulesEvaluated++;
                try {
                    const evalResult = evaluateRule(rule, facts, true);
                    if (evalResult.triggered) {
                        rulesTriggered++;
                        
                        let action = {};
                        try {
                            action = typeof rule.rule_action === 'string' ? JSON.parse(rule.rule_action) : (rule.rule_action || {});
                        } catch (e) { action = {}; }

                        // ===== EXTRACT THE NAME AND EFFECT FROM THE RULE =====
                        const { name: interactionName, effect } = extractInteractionData(rule);
                        
                        // If still no name, build from matched medications
                        let finalName = interactionName;
                        if (!finalName && evalResult.matchedMedications.length >= 2) {
                            finalName = evalResult.matchedMedications.join(' + ');
                        }
                        if (!finalName) {
                            finalName = rule.rule_name || '';
                        }

                        const profMsg = formatAlertMessage(action.message_professional || action.message || rule.rule_name, facts);
                        const clientMsg = formatAlertMessage(action.message_client || action.message || rule.rule_name, facts);
                        const profRec = formatAlertMessage(action.recommendation_professional || action.recommendation || rule.rule_description || '', facts);
                        const clientRec = formatAlertMessage(action.recommendation_client || action.recommendation || rule.rule_description || '', facts);

                        // ===== CREATE THE ALERT WITH THE EXTRACTED DATA =====
                        triggeredAlerts.push({
                            id: `${rule.id}-${Date.now()}-${rulesEvaluated}`,
                            rule_id: rule.id,
                            rule_name: rule.rule_name,
                            rule_type: rule.rule_type,
                            severity: action.severity || rule.severity || 'moderate',
                            message: profMsg,
                            professional_message: profMsg + (evalResult.matchedMedications.length > 0 ? ` [Matched: ${evalResult.matchedMedications.join(', ')}]` : ''),
                            client_message: clientMsg,
                            professional_recommendation: profRec,
                            client_recommendation: clientRec,
                            details: profRec || rule.rule_description,
                            // ===== STORE THE DATA FOR DISPLAY =====
                            interaction_name: finalName,
                            effect: effect || '',
                            rule: {
                                ...rule,
                                name: finalName,
                                effect: effect || ''
                            },
                            evidence: {
                                facts,
                                matched_medications: evalResult.matchedMedications,
                                interaction_name: finalName,
                                effect: effect || ''
                            },
                            timestamp: new Date().toISOString(),
                            acknowledged: false,
                            processed: false,
                            patient_id: patientData.id
                        });
                    }
                } catch (e) { console.error(`Rule ${rule.id} failed`, e); }
            }

            const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
            triggeredAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

            setAlerts(triggeredAlerts);
            
            if (severityFilter === 'all') {
                setFilteredAlerts(triggeredAlerts);
            } else {
                setFilteredAlerts(triggeredAlerts.filter(a => a.severity === severityFilter));
            }

            setAnalysisStats({
                totalRules: rulesSrc.length,
                rulesTriggered,
                alertsGenerated: triggeredAlerts.length,
                bySeverity: {
                    critical: triggeredAlerts.filter(a => a.severity === 'critical').length,
                    high: triggeredAlerts.filter(a => a.severity === 'high').length,
                    moderate: triggeredAlerts.filter(a => a.severity === 'moderate').length,
                    low: triggeredAlerts.filter(a => a.severity === 'low').length
                }
            });
            setLastAnalysisTime(new Date().toISOString());
            console.log(`✅ CDSS: Analysis complete. ${triggeredAlerts.length} issues found.`);

        } catch (error) {
            setAnalysisError(error.message);
        } finally {
            setLoading(false);
        }
    }, [patientData, clinicalRules, medications, severityFilter]);

    const runFullAnalysis = useCallback(async () => {
        if (!patientData?.id) return;
        setLoading(true);
        console.log('🚀 Running full clinical analysis refresh...');
        
        try {
            const [rulesRes, medsRes] = await Promise.all([
                api.get('/clinical-rules'),
                api.get(`/medication-history/patient/${patientData.id}`)
            ]);
            
            const freshRules = rulesRes.success ? (rulesRes.rules || []) : clinicalRules;
            const freshMeds = medsRes.success ? (medsRes.medications || []) : medications;

            if (rulesRes.success) setClinicalRules(freshRules);
            if (medsRes.success) {
                let decrypted = freshMeds;
                const encKey = await getEncryptionKey();
                if (encKey && freshMeds.length > 0) {
                    decrypted = await Promise.all(freshMeds.map(async (m) => {
                        const d = { ...m };
                        const fields = ['drug_name', 'dose', 'frequency', 'roa', 'indication'];
                        for (const f of fields) {
                            if (d[f] && d[f].includes(':')) {
                                try { d[f] = await decryptValue(d[f], encKey); } catch (e) {}
                            }
                        }
                        return d;
                    }));
                }
                setMedications(decrypted);
                setMedicationsFetched(true);
            }

            await analyzePatient(freshRules, freshMeds);
            
        } catch (error) {
            console.error('Refresh analysis failed', error);
        } finally {
            setLoading(false);
        }
    }, [patientData?.id, clinicalRules, medications, analyzePatient]);

    const handleFilterChange = useCallback((severity) => {
        setSeverityFilter(severity);
        if (severity === 'all') {
            setFilteredAlerts(alerts);
        } else {
            setFilteredAlerts(alerts.filter(alert => alert.severity === severity));
        }
    }, [alerts]);

    const acknowledgeAlert = useCallback((alertId, isProcessed = null) => {
        setAlerts(prev => {
            const updated = prev.map(a => a.id === alertId ? { 
                ...a, 
                processed: isProcessed !== null ? isProcessed : a.processed,
                acknowledged: isProcessed !== null ? (isProcessed ? true : a.acknowledged) : true
            } : a);
            
            const filtered = severityFilter === 'all' ? updated : updated.filter(u => u.severity === severityFilter);
            setFilteredAlerts(filtered);
            return updated;
        });
    }, [severityFilter]);

    const acknowledgeAll = useCallback(() => {
        const updated = alerts.map(a => ({ ...a, acknowledged: true, processed: true }));
        setAlerts(updated);
        setFilteredAlerts(updated);
    }, [alerts]);

    const toggleExpandAlert = useCallback((alertId) => {
        setExpandedAlert(prev => prev === alertId ? null : alertId);
    }, []);

    useEffect(() => {
        analyzePatientRef.current = analyzePatient;
    });

    const initializeCDSS = useCallback(async () => {
        if (!patientData?.id) return;
        setLoading(true);
        console.log('🔄 Initializing CDSS data (Single-Pass)...');
        setHasAnalyzed(true);

        try {
            const [rulesRes, medsRes] = await Promise.all([
                api.get('/clinical-rules'),
                api.get(`/medication-history/patient/${patientData.id}`)
            ]);

            const freshRules = rulesRes.success ? (rulesRes.rules || []) : sampleTestRules;
            const freshMeds = medsRes.success ? (medsRes.medications || []) : (patientData?.medication_history || []);

            if (rulesRes.success && freshRules.length > 0) {
                setClinicalRules(freshRules);
            } else {
                setClinicalRules(sampleTestRules);
            }

            let decryptedMeds = freshMeds;
            let currentPatient = { ...patientData };
            const encKey = await getEncryptionKey();
            
            if (encKey) {
                try {
                    currentPatient = await decryptPatient(currentPatient, encKey);
                    setDecryptedPatient(currentPatient);

                    if (freshMeds.length > 0) {
                        decryptedMeds = await Promise.all(freshMeds.map(async (m) => {
                            const d = { ...m };
                            const fields = ['drug_name', 'dose', 'frequency', 'roa', 'route', 'indication', 'notes', 'medical_condition'];
                            for (const f of fields) {
                                if (d[f] && typeof d[f] === 'string' && d[f].includes(':')) {
                                    try { d[f] = await decryptValue(d[f], encKey); } catch (e) {}
                                }
                            }
                            return d;
                        }));
                    }
                    setDecryptionFailed(false);
                } catch (e) {
                    console.error('Decryption failed on init', e);
                    setDecryptionFailed(true);
                }
            } else {
                console.warn('⚠️ No encryption key found during initialization');
                setDecryptionFailed(true);
            }
            
            setMedications(decryptedMeds);
            setMedicationsFetched(true);

            await analyzePatient(rulesRes.success && freshRules.length > 0 ? freshRules : sampleTestRules, decryptedMeds);

        } catch (error) {
            console.error('❌ Error during CDSS initialization:', error);
            setAnalysisError('Initialization failed.');
        } finally {
            setLoading(false);
        }
    }, [patientData, analyzePatient]);

    useEffect(() => {
        const currentId = patientData?.id;
        
        if (currentId && currentId !== previousPatientIdRef.current) {
            console.log(`🎯 Patient switched to ${currentId}. Resetting and initializing CDSS...`);
            
            setAlerts([]);
            setFilteredAlerts([]);
            setMedications([]);
            setMedicationsFetched(false);
            setAnalysisStats(null);
            setHasAnalyzed(false);
            
            setDebugInfo(`🔄 Loading clinical rules for Patient ${currentId}...\n`);
            
            previousPatientIdRef.current = currentId;
            
            initializeCDSS();
        }
    }, [patientData?.id, initializeCDSS]);

    useEffect(() => {
        if (patientData && medicationsFetched && hasAnalyzed) {
            const hasKeyData = patientData.gender || patientData.age || patientData.age_in_days || patientData.diagnosis;
            if (hasKeyData) {
                console.log('⚡ Facts update detected (Demographics/Dx). Re-analyzing...');
                analyzePatient(clinicalRules, medications);
            }
        }
    }, [patientData?.gender, patientData?.age, patientData?.age_in_days, patientData?.diagnosis, medicationsFetched, hasAnalyzed]);

    const testSampleRules = useCallback(() => {
        if (!patientData) {
            alert('Please select a patient first');
            return;
        }

        setIsTestingRules(true);
        setAlerts([]);
        setFilteredAlerts([]);
        setAnalysisStats(null);
        setAnalysisError(null);
        setExpandedAlert(null);

        let debug = '🧪 === TESTING SAMPLE AGE-IN-DAYS RULES ===\n';
        setDebugInfo(debug);

        try {
            const currentPatient = patientData;
            const facts = mapPatientToFacts(currentPatient, medications);
            setPatientFacts(facts);

            const triggeredAlerts = [];
            let rulesEvaluated = 0;
            let rulesTriggered = 0;

            for (const rule of sampleTestRules) {
                rulesEvaluated++;
                const evalResult = evaluateRule(rule, facts, true);

                if (evalResult.triggered) {
                    rulesTriggered++;
                    
                    // Extract interaction data
                    const { name, effect } = extractInteractionData(rule);
                    let finalName = name;
                    if (!finalName && evalResult.matchedMedications.length >= 2) {
                        finalName = evalResult.matchedMedications.join(' + ');
                    }
                    if (!finalName) {
                        finalName = rule.rule_name || '';
                    }
                    
                    const professional_message = rule.rule_action?.message_professional || rule.rule_action?.message || rule.rule_name;
                    const client_message = rule.rule_action?.message_client || rule.rule_action?.message || rule.rule_name;
                    const professional_recommendation = rule.rule_action?.recommendation_professional || rule.rule_action?.recommendation || rule.rule_description;
                    const client_recommendation = rule.rule_action?.recommendation_client || rule.rule_action?.recommendation || rule.rule_description;
                    const details = rule.rule_action?.recommendation || rule.rule_description;
                    const severity = rule.rule_action?.severity || rule.severity || 'moderate';

                    let professional_message_formatted = formatAlertMessage(professional_message, facts);

                    if (evalResult.matchedMedications.length > 0) {
                        professional_message_formatted += ` [Drug(s): ${evalResult.matchedMedications.join(', ')}]`;
                    }

                    triggeredAlerts.push({
                        id: `test-${rule.id}-${Date.now()}`,
                        rule_id: rule.id,
                        rule_name: rule.rule_name,
                        rule_type: rule.rule_type,
                        severity: severity,
                        message: professional_message_formatted,
                        professional_message: professional_message_formatted,
                        client_message: formatAlertMessage(client_message, facts),
                        details: formatAlertMessage(details, facts),
                        professional_recommendation: formatAlertMessage(professional_recommendation, facts),
                        client_recommendation: formatAlertMessage(client_recommendation, facts),
                        interaction_name: finalName,
                        effect: effect || '',
                        rule: {
                            ...rule,
                            name: finalName,
                            effect: effect || ''
                        },
                        evidence: {
                            facts: facts,
                            age_in_days: facts.age_in_days,
                            medications: facts.medication_names,
                            matched_medications: evalResult.matchedMedications,
                            interaction_name: finalName,
                            effect: effect || ''
                        },
                        timestamp: new Date().toISOString(),
                        acknowledged: false,
                        processed: false,
                        is_test_rule: true
                    });
                }
            }

            const stats = {
                totalRules: sampleTestRules.length,
                rulesEvaluated,
                rulesTriggered,
                alertsGenerated: triggeredAlerts.length,
                bySeverity: {
                    critical: triggeredAlerts.filter(a => a.severity === 'critical').length,
                    high: triggeredAlerts.filter(a => a.severity === 'high').length,
                    moderate: triggeredAlerts.filter(a => a.severity === 'moderate').length,
                    low: triggeredAlerts.filter(a => a.severity === 'low').length
                },
                timestamp: new Date().toISOString(),
                isTestRun: true
            };

            setAlerts(triggeredAlerts);
            setFilteredAlerts(triggeredAlerts);
            setDebugInfo(debug);
            setAnalysisStats(stats);
            setLastAnalysisTime(new Date().toISOString());
            setTestResults({
                passed: rulesTriggered > 0,
                message: triggeredAlerts.length > 0 ? `Successfully triggered ${triggeredAlerts.length} rules!` : 'No rules triggered'
            });

        } catch (error) {
            setAnalysisError(error.message);
        } finally {
            setIsTestingRules(false);
        }
    }, [patientData, medications]);

    return {
        alerts,
        filteredAlerts,
        loading,
        debugInfo,
        analysisStats,
        clinicalRules,
        medications,
        analysisError,
        testResults,
        severityFilter,
        setSeverityFilter: handleFilterChange,
        fetchClinicalRules,
        fetchPatientMedications,
        testSampleRules,
        analyzePatient,
        runFullAnalysis,
        acknowledgeAlert,
        acknowledgeAll,
        toggleExpandAlert,
        expandedAlert,
        lastAnalysisTime,
        patientFacts,
        rulesLoading: loading,
        decryptedPatient,
        decryptionFailed
    };
};
