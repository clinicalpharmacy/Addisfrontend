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

    // Use refs to prevent infinite loops
    const previousPatientId = useRef(null);
    // Stable ref to analyzePatient to avoid it being a useEffect dependency
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

                // If database error, use sample test rules
                console.log('⚠️ Using sample test rules due to database error');
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
        // Initialize with patientData medications if available (fallback)
        let fallbackMedications = [];
        if (patientData?.medication_history && Array.isArray(patientData.medication_history)) {
            fallbackMedications = patientData.medication_history;
        }

        if (!patientData?.id) {
            console.log('⚠️ No patient id provided for medication fetch, using fallback if available');
            setMedications(fallbackMedications);
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
            
            // 🔐 ZERO-KNOWLEDGE: Decrypt medications for display and analysis
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

            // Use API data if available, otherwise fallback
            if (medsResult.length > 0) {
                setMedications(medsResult);
            } else {
                console.log('⚠️ No medications in history table, checking patient record...');
                debugText += '⚠️ No medications in history table, checking patient record...\n';
                if (fallbackMedications.length > 0) {
                    console.log(`✅ Found ${fallbackMedications.length} medications in patient record`);
                    debugText += `✅ Found ${fallbackMedications.length} medications in patient record\n`;
                    setMedications(fallbackMedications);
                } else {
                    setMedications([]);
                }
            }

            setDebugInfo(prev => prev + debugText);
        } catch (error) {
            console.error('❌ Error in fetchPatientMedications:', error);
            setDebugInfo(prev => prev + `❌ Exception fetching medications: ${error.message}\n`);
            setMedications(fallbackMedications);
        }
    }, [patientData?.patient_code, patientData?.medication_history]);

    const analyzePatient = useCallback(async () => {
        if (!patientData?.id) {
            alert('❌ Please select a patient first');
            return;
        }

        setLoading(true);
        setAlerts([]);
        setFilteredAlerts([]);
        setAnalysisStats(null);
        setAnalysisError(null);
        setExpandedAlert(null);
        setTestResults(null);

        let debug = '🚀 === CDSS ANALYSIS STARTED ===\n';
        debug += `Patient: ${patientData.id}\n`;
        debug += `Time: ${new Date().toLocaleString()}\n`;
        debug += `Active Rules: ${clinicalRules.length}\n`;
        debug += `Active Medications: ${medications.length}\n\n`;
        setDebugInfo(debug);

        try {
            // 🔐 ZERO-KNOWLEDGE: Decrypt data before analysis
            let currentPatient = patientData;
            let currentMedications = [...medications];
            
            const encKey = await getEncryptionKey();
            if (encKey) {
                try {
                    // Decrypt patient demographic and lab fields
                    currentPatient = await decryptPatient(currentPatient, encKey);
                    
                    // Decrypt medications (drug_name, dose, frequency, etc.)
                    currentMedications = await Promise.all(currentMedications.map(async (m) => {
                        const decryptedMed = { ...m };
                        const sensitiveMedsFields = ['drug_name', 'dose', 'frequency', 'route', 'indication', 'notes', 'medical_condition'];
                        for (const field of sensitiveMedsFields) {
                            if (decryptedMed[field]) {
                                decryptedMed[field] = await decryptValue(decryptedMed[field], encKey);
                            }
                        }
                        return decryptedMed;
                    }));
                    console.log('💎 [CDSS] Clinical data decrypted for analysis');
                } catch (decErr) {
                    console.error('❌ [CDSS] Decryption failed:', decErr);
                }
            }

            // Map to facts
            debug += '\n🔍 === CREATING PATIENT FACTS ===\n';
            const facts = mapPatientToFacts(currentPatient, currentMedications);
            setPatientFacts(facts);

            debug += `  Age: ${facts.age} years\n`;
            debug += `  Age in Days: ${facts.age_in_days || 'N/A'}\n`;
            debug += `  Medications: ${facts.medication_names.length} drugs\n`;

            if (clinicalRules.length === 0) {
                debug += '\n⚠️ === NO ACTIVE RULES FOUND ===\n';
                debug += 'Using sample test rules for demonstration.\n';
            }

            // Evaluate rules
            debug += '\n⚡ === EVALUATING CLINICAL RULES ===\n';
            const triggeredAlerts = [];
            let rulesEvaluated = 0;
            let rulesTriggered = 0;

            const rulesToEvaluate = clinicalRules.length > 0 ? clinicalRules : sampleTestRules;

            for (const rule of rulesToEvaluate) {
                rulesEvaluated++;

                try {
                    console.log(`🎯 Evaluating rule: "${rule.rule_name}"`);
                    const evalResult = evaluateRule(rule, facts, true);

                    if (evalResult.triggered) {
                        rulesTriggered++;
                        debug += `[${rulesEvaluated}] "${rule.rule_name}": ✅ TRIGGERED\n`;
                        if (evalResult.matchedMedications.length > 0) {
                            debug += `    💊 Matched: ${evalResult.matchedMedications.join(', ')}\n`;
                        }

                        // Create alert
                        let professional_message = '';
                        let client_message = '';
                        let professional_recommendation = '';
                        let client_recommendation = '';
                        let details = '';
                        let severity = rule.severity || 'moderate';

                        if (rule.rule_action) {
                            try {
                                const actionData = typeof rule.rule_action === 'string'
                                    ? JSON.parse(rule.rule_action)
                                    : rule.rule_action;

                                professional_message = actionData.message_professional || actionData.message || rule.rule_name;
                                client_message = actionData.message_client || actionData.message || rule.rule_name;
                                professional_recommendation = actionData.recommendation_professional || actionData.recommendation || '';
                                client_recommendation = actionData.recommendation_client || actionData.recommendation || '';
                                details = professional_recommendation || actionData.recommendation || '';
                                severity = actionData.severity || rule.severity || 'moderate';
                            } catch (e) {
                                debug += `    ⚠️ Could not parse rule_action: ${e.message}\n`;
                                if (rule.rule_description) {
                                    details = rule.rule_description;
                                }
                            }
                        } else if (rule.rule_description) {
                            details = rule.rule_description;
                        }

                        // Format messages with actual values
                        professional_message = formatAlertMessage(professional_message, facts);
                        client_message = formatAlertMessage(client_message, facts);
                        professional_recommendation = formatAlertMessage(professional_recommendation, facts);
                        client_recommendation = formatAlertMessage(client_recommendation, facts);
                        details = formatAlertMessage(details, facts);

                        // Append matched medications to professional message
                        if (evalResult.matchedMedications.length > 0) {
                            professional_message += ` [Drug(s): ${evalResult.matchedMedications.join(', ')}]`;
                        }

                        const alert = {
                            id: `${rule.id}-${Date.now()}`,
                            rule_id: rule.id,
                            rule_name: rule.rule_name,
                            rule_type: rule.rule_type,
                            rule_description: rule.rule_description,
                            severity: severity,
                            message: professional_message || rule.rule_name, // Fallback for list view
                            professional_message,
                            client_message,
                            details: details,
                            professional_recommendation: professional_recommendation,
                            client_recommendation: client_recommendation,
                            evidence: {
                                facts: facts,
                                age_in_days: facts.age_in_days,
                                patient_type: facts.patient_type,
                                is_pediatric: facts.is_pediatric,
                                medications: facts.medication_names,
                                matched_medications: evalResult.matchedMedications,
                                labs: facts.labs
                            },
                            timestamp: new Date().toISOString(),
                            acknowledged: false,
                            processed: false,
                            patient_id: patientData.id,
                            patient_name: currentPatient.full_name,
                            patient_age_in_days: facts.age_in_days,
                            patient_type: facts.patient_type,
                            is_pediatric: facts.is_pediatric,
                            is_test_rule: clinicalRules.length === 0
                        };

                        triggeredAlerts.push(alert);
                    } else {
                        debug += `[${rulesEvaluated}] "${rule.rule_name}": ❌ Not triggered\n`;
                    }
                } catch (ruleError) {
                    debug += `[${rulesEvaluated}] "${rule.rule_name}": ❌ Error: ${ruleError.message}\n`;
                    console.error(`Rule evaluation error:`, ruleError, rule);
                }
            }

            // Sort alerts by severity
            const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
            triggeredAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

            // Calculate statistics
            const stats = {
                totalRules: rulesToEvaluate.length,
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
                patientId: patientData.id,
                medicationCount: medications.length
            };

            setAlerts(triggeredAlerts);
            setFilteredAlerts(triggeredAlerts);
            setDebugInfo(debug);
            setAnalysisStats(stats);
            setLastAnalysisTime(new Date().toISOString());

        } catch (error) {
            console.error('❌ Analysis error:', error);
            debug += `\n❌ ERROR: ${error.message}\n`;
            setDebugInfo(debug);
            setAnalysisError(error.message);
        } finally {
            setLoading(false);
        }
    }, [patientData, clinicalRules, medications]);

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
                    const professional_message = rule.rule_action?.message_professional || rule.rule_action?.message || rule.rule_name;
                    const client_message = rule.rule_action?.message_client || rule.rule_action?.message || rule.rule_name;
                    const professional_recommendation = rule.rule_action?.recommendation_professional || rule.rule_action?.recommendation || rule.rule_description;
                    const client_recommendation = rule.rule_action?.recommendation_client || rule.rule_action?.recommendation || rule.rule_description;
                    const details = rule.rule_action?.recommendation || rule.rule_description;
                    const severity = rule.rule_action?.severity || rule.severity || 'moderate';

                    // Format message
                    // Format professional message
                    let professional_message_formatted = formatAlertMessage(professional_message, facts);

                    // Append matched medications
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
                        evidence: {
                            facts: facts,
                            age_in_days: facts.age_in_days,
                            medications: facts.medication_names,
                            matched_medications: evalResult.matchedMedications
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

    // Cleanup effects
    // 1. Initial global rules load - only once
    useEffect(() => {
        fetchClinicalRules();
    }, [fetchClinicalRules]);

    // 2. Patient-specific data updates
    useEffect(() => {
        // Only clear analysis if we have a GENUINE patient change and the new ID is valid
        if (patientData?.id && patientData?.id !== previousPatientId.current) {
            console.log('🔄 Patient ID changed, clearing analysis state');
            setAlerts([]);
            setFilteredAlerts([]);
            setAnalysisStats(null);
            setDebugInfo('');
            setAnalysisError(null);
            setMedications([]);
            setPatientFacts(null);
            setTestResults(null);
            previousPatientId.current = patientData?.id;
        }

        if (patientData && patientData.id) {
            fetchPatientMedications();
        }

        // ✅ REAL-TIME RULES INTEGRATION:
        // Automatically trigger rules refresh when admin changes rules
        const rulesSubscription = supabase
            .channel('clinical_rules_changes')
            .on('postgres_changes', {
                event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'clinical_rules'
            }, (payload) => {
                console.log('🔔 Clinical rules changed in real-time, refreshing...', payload);
                fetchClinicalRules();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(rulesSubscription);
        };
    }, [patientData?.id, fetchClinicalRules, fetchPatientMedications]);

    // Keep the ref up to date with the latest analyzePatient callback
    useEffect(() => {
        analyzePatientRef.current = analyzePatient;
    });

    // Full refresh: fetch fresh rules + meds, then run analysis via the always-current ref
    const runFullAnalysis = useCallback(async () => {
        if (!patientData?.id) {
            alert('❌ Please select a patient first');
            return;
        }
        await fetchClinicalRules();
        await fetchPatientMedications();
        // Give React time to commit the new state before running analysis
        setTimeout(() => {
            analyzePatientRef.current?.();
        }, 700);
    }, [patientData?.id, fetchClinicalRules, fetchPatientMedications]);

    // Auto-analyze ONLY when patient, rules count, or medication count genuinely changes.
    // ✅ FIX: Do NOT include `loading` or `analyzePatient` in deps — those change every
    // cycle and caused an infinite loop where alerts were cleared before they could display.
    useEffect(() => {
        if (patientData?.id && clinicalRules.length > 0) {
            const timer = setTimeout(() => {
                console.log('🔄 Data updated, triggering clinical analysis...');
                analyzePatientRef.current?.();
            }, 600);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientData?.id, clinicalRules.length, medications.length]);

    const handleFilterChange = useCallback((severity) => {
        setSeverityFilter(severity);
        if (severity === 'all') {
            setFilteredAlerts(alerts);
        } else {
            setFilteredAlerts(alerts.filter(alert => alert.severity === severity));
        }
    }, [alerts]);

    const acknowledgeAlert = useCallback((alertId, isProcessed = null) => {
        const updatedAlerts = alerts.map(alert => {
            if (alert.id === alertId) {
                // If it's being marked as processed, it should also be marked as seen
                const newProcessed = isProcessed !== null ? isProcessed : alert.processed;
                const newAcknowledged = isProcessed !== null ? (isProcessed ? true : alert.acknowledged) : true;

                return {
                    ...alert,
                    acknowledged: newAcknowledged,
                    processed: newProcessed
                };
            }
            return alert;
        });
        setAlerts(updatedAlerts);
        setFilteredAlerts(updatedAlerts.filter(alert =>
            severityFilter === 'all' || alert.severity === severityFilter
        ));
    }, [alerts, severityFilter]);

    const acknowledgeAll = useCallback(() => {
        const updatedAlerts = alerts.map(alert => ({ ...alert, acknowledged: true, processed: true }));
        setAlerts(updatedAlerts);
        setFilteredAlerts(updatedAlerts);
    }, [alerts]);

    const toggleExpandAlert = useCallback((alertId) => {
        setExpandedAlert(expandedAlert === alertId ? null : alertId);
    }, [expandedAlert]);

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
        rulesLoading
    };
};
