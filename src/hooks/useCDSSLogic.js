import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { mapPatientToFacts, evaluateRule, formatAlertMessage } from '../components/CDSS/RuleEngine';
import { sampleTestRules } from '../constants/cdssRules';

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

    // Use refs to prevent infinite loops
    const previousPatientCode = useRef(null);

    const fetchClinicalRules = useCallback(async () => {
        try {
            console.log('📋 Fetching clinical rules from backend API...');
            let debugText = '📋 Fetching clinical rules...\n';
            setDebugInfo(prev => prev + debugText);

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
                debugText += '\n📋 Available Rules:\n';
                data.forEach((rule, index) => {
                    debugText += `  ${index + 1}. "${rule.rule_name}" (${rule.rule_type}) - ${rule.severity}\n`;
                });
            } else {
                console.log('⚠️ No rules in database, using sample test rules');
                setClinicalRules(sampleTestRules);
                debugText += '⚠️ Using sample test rules (no rules in database)\n';
            }

            setDebugInfo(prev => prev + debugText);
        } catch (error) {
            console.error('❌ Error fetching rules:', error);
            setDebugInfo(prev => prev + `❌ Exception fetching rules: ${error.message}\n`);
            setClinicalRules(sampleTestRules);
        }
    }, []);

    const fetchPatientMedications = useCallback(async () => {
        if (!patientData?.patient_code) {
            console.log('⚠️ No patient code provided for medication fetch');
            setMedications([]);
            return;
        }

        try {
            console.log('💊 Fetching medications for:', patientData.patient_code);
            let debugText = `💊 Fetching medications for ${patientData.patient_code}...\n`;
            setDebugInfo(prev => prev + debugText);

            const result = await api.get(`/medication-history/patient/${patientData.patient_code}`);

            if (!result.success) {
                console.error('❌ Error fetching medications:', result.error);
                debugText += `❌ Error fetching medications: ${result.error || 'Unknown error'}\n`;
                setDebugInfo(prev => prev + debugText);
                setMedications([]);
                return;
            }

            const data = result.medications || [];
            console.log(`✅ Loaded ${data.length} medications`);
            debugText += `✅ Loaded ${data.length} medications\n`;

            setDebugInfo(prev => prev + debugText);
            setMedications(data);
        } catch (error) {
            console.error('❌ Error in fetchPatientMedications:', error);
            setDebugInfo(prev => prev + `❌ Exception fetching medications: ${error.message}\n`);
            setMedications([]);
        }
    }, [patientData?.patient_code]);

    const analyzePatient = useCallback(async () => {
        if (!patientData?.patient_code) {
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
        debug += `Patient: ${patientData.patient_code}\n`;
        debug += `Time: ${new Date().toLocaleString()}\n`;
        debug += `Active Rules: ${clinicalRules.length}\n`;
        debug += `Active Medications: ${medications.length}\n\n`;
        setDebugInfo(debug);

        try {
            // Use provided patient data
            const currentPatient = patientData;

            // Map to facts
            debug += '\n🔍 === CREATING PATIENT FACTS ===\n';
            const facts = mapPatientToFacts(currentPatient, medications);
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
                    const isTriggered = evaluateRule(rule, facts);

                    if (isTriggered) {
                        rulesTriggered++;
                        debug += `[${rulesEvaluated}] "${rule.rule_name}": ✅ TRIGGERED\n`;

                        // Create alert
                        let message = rule.rule_name;
                        let details = '';
                        let severity = rule.severity || 'moderate';

                        if (rule.rule_action) {
                            try {
                                const actionData = typeof rule.rule_action === 'string'
                                    ? JSON.parse(rule.rule_action)
                                    : rule.rule_action;

                                message = actionData.message || rule.rule_name;
                                details = actionData.recommendation || '';
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

                        // Format message with actual values
                        message = formatAlertMessage(message, facts);
                        details = formatAlertMessage(details, facts);

                        const alert = {
                            id: `${rule.id}-${Date.now()}`,
                            rule_id: rule.id,
                            rule_name: rule.rule_name,
                            rule_type: rule.rule_type,
                            rule_description: rule.rule_description,
                            severity: severity,
                            message: message,
                            details: details,
                            evidence: {
                                facts: facts,
                                age_in_days: facts.age_in_days,
                                patient_type: facts.patient_type,
                                is_pediatric: facts.is_pediatric,
                                medications: facts.medication_names,
                                labs: facts.labs
                            },
                            timestamp: new Date().toISOString(),
                            acknowledged: false,
                            confidence: 95,
                            patient_code: patientData.patient_code,
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
                patientCode: patientData.patient_code,
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
                const isTriggered = evaluateRule(rule, facts);

                if (isTriggered) {
                    rulesTriggered++;
                    const message = rule.rule_action?.message || rule.rule_name;
                    const details = rule.rule_action?.recommendation || rule.rule_description;
                    const severity = rule.rule_action?.severity || rule.severity || 'moderate';

                    triggeredAlerts.push({
                        id: `test-${rule.id}-${Date.now()}`,
                        rule_id: rule.id,
                        rule_name: rule.rule_name,
                        rule_type: rule.rule_type,
                        severity: severity,
                        message: formatAlertMessage(message, facts),
                        details: formatAlertMessage(details, facts),
                        evidence: {
                            facts: facts,
                            age_in_days: facts.age_in_days,
                            medications: facts.medication_names
                        },
                        timestamp: new Date().toISOString(),
                        acknowledged: false,
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
    useEffect(() => {
        if (patientData?.patient_code !== previousPatientCode.current) {
            setAlerts([]);
            setFilteredAlerts([]);
            setAnalysisStats(null);
            setDebugInfo('');
            setAnalysisError(null);
            setMedications([]);
            setPatientFacts(null);
            setTestResults(null);
            previousPatientCode.current = patientData?.patient_code;
            setIsInitialLoad(true);
        }

        if (patientData && patientData.patient_code) {
            fetchPatientMedications();
            if (isInitialLoad) {
                fetchClinicalRules();
                setIsInitialLoad(false);
            }
        }
    }, [patientData, isInitialLoad, fetchClinicalRules, fetchPatientMedications]);

    // Auto-analyze when data is ready
    useEffect(() => {
        if (patientData && clinicalRules.length > 0 && !lastAnalysisTime && !loading) {
            console.log('🔄 Auto-triggering clinical analysis...');
            analyzePatient();
        }
    }, [patientData, clinicalRules, medications, analyzePatient, lastAnalysisTime, loading]);

    const handleFilterChange = useCallback((severity) => {
        setSeverityFilter(severity);
        if (severity === 'all') {
            setFilteredAlerts(alerts);
        } else {
            setFilteredAlerts(alerts.filter(alert => alert.severity === severity));
        }
    }, [alerts]);

    const acknowledgeAlert = useCallback((alertId) => {
        const updatedAlerts = alerts.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
        );
        setAlerts(updatedAlerts);
        setFilteredAlerts(updatedAlerts.filter(alert =>
            severityFilter === 'all' || alert.severity === severityFilter
        ));
    }, [alerts, severityFilter]);

    const acknowledgeAll = useCallback(() => {
        const updatedAlerts = alerts.map(alert => ({ ...alert, acknowledged: true }));
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
        acknowledgeAlert,
        acknowledgeAll,
        toggleExpandAlert,
        expandedAlert,
        lastAnalysisTime,
        patientFacts
    };
};
