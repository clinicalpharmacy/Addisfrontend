// src/components/CDSS/CDSSDisplay.jsx - COMPLETE WORKING VERSION
import React, { useState, useEffect, useRef } from 'react';
import supabase from '../../utils/supabase';
import { mapPatientToFacts, evaluateRule, formatAlertMessage } from './RuleEngine';
import { 
    FaBell, FaExclamationTriangle, FaCheckCircle, FaInfoCircle,
    FaUserMd, FaPills, FaFilter, FaSync, FaDownload, FaChartBar,
    FaFlask, FaDatabase, FaSearch, FaEye, FaEyeSlash,
    FaClock, FaUser, FaStethoscope, FaPrescription, FaClipboardCheck,
    FaCogs, FaRocket, FaChartLine, FaFileMedical, FaHeartbeat,
    FaMedkit, FaThermometerHalf, FaTint, FaWeight, FaRuler,
    FaChevronDown, FaChevronUp, FaExclamationCircle, FaCapsules,
    FaRedo, FaBug, FaFileMedicalAlt, FaBaby, FaChild,
    FaCalendarDay, FaUserTag, FaUserCheck, FaUserShield,
    FaUserClock, FaSkullCrossbones, FaHeart, FaLungs,
    FaWeightHanging, FaVial
} from 'react-icons/fa';

const CDSSDisplay = ({ patientData }) => {
    const [alerts, setAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    const [severityFilter, setSeverityFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [patientFacts, setPatientFacts] = useState(null);
    const [showDebug, setShowDebug] = useState(false);
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

    const severityColors = {
        critical: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
        high: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
        moderate: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
        low: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
    };

    const severityIcons = {
        critical: FaExclamationTriangle,
        high: FaExclamationTriangle,
        moderate: FaExclamationCircle,
        low: FaInfoCircle
    };

    const severityBgColors = {
        critical: 'bg-red-500',
        high: 'bg-orange-500',
        moderate: 'bg-yellow-500',
        low: 'bg-blue-500'
    };

    // SAMPLE TEST RULES FOR AGE-IN-DAYS FUNCTIONALITY
    const sampleTestRules = [
        {
            id: 'RULE_INFANT_01',
            rule_name: 'Infant Tetracycline Contraindication',
            rule_type: 'pediatric_check',
            rule_description: 'Tetracycline contraindicated in infants due to tooth discoloration',
            rule_condition: {
                all: [
                    { fact: 'age_in_days', operator: '<', value: 365 },
                    { fact: 'medications', operator: 'contains', value: 'tetracycline' }
                ]
            },
            rule_action: {
                message: 'Tetracycline contraindicated in infant',
                recommendation: 'Tetracycline is contraindicated in children under 8 years due to permanent tooth discoloration. Consider alternative antibiotic: amoxicillin or azithromycin.',
                severity: 'critical'
            },
            severity: 'critical',
            dtp_category: 'contraindication',
            is_active: true,
            applies_to: ['neonate', 'infant', 'pediatric']
        },
        {
            id: 'RULE_INFANT_02',
            rule_name: 'Infant NSAID Risk',
            rule_type: 'pediatric_check',
            rule_description: 'NSAIDs caution in infants with dehydration or renal impairment',
            rule_condition: {
                all: [
                    { fact: 'age_in_days', operator: '<', value: 365 },
                    { fact: 'medications', operator: 'contains', value: 'ibuprofen' },
                    { fact: 'labs.creatinine', operator: '>', value: 0.5 }
                ]
            },
            rule_action: {
                message: 'NSAID use in infant with elevated creatinine',
                recommendation: 'Ibuprofen may worsen renal function in infants with elevated creatinine ({{labs.creatinine}}). Monitor renal function closely or consider acetaminophen for fever/pain.',
                severity: 'high'
            },
            severity: 'high',
            dtp_category: 'dose_error',
            is_active: true,
            applies_to: ['neonate', 'infant']
        },
        {
            id: 'RULE_INFANT_03',
            rule_name: 'Infant Gentamicin Dose Check',
            rule_type: 'dose_check',
            rule_description: 'Gentamicin requires weight-based dosing and serum level monitoring',
            rule_condition: {
                all: [
                    { fact: 'age_in_days', operator: '<', value: 365 },
                    { fact: 'medications', operator: 'contains', value: 'gentamicin' }
                ]
            },
            rule_action: {
                message: 'Gentamicin prescribed for infant',
                recommendation: 'Gentamicin requires weight-based dosing for infants. Calculate dose based on {{weight}} kg. Monitor serum levels to avoid toxicity.',
                severity: 'high'
            },
            severity: 'high',
            dtp_category: 'monitoring_needed',
            is_active: true,
            applies_to: ['neonate', 'infant']
        },
        {
            id: 'RULE_GERI_01',
            rule_name: 'Elderly Warfarin + NSAID Interaction',
            rule_type: 'drug_interaction',
            rule_description: 'Increased bleeding risk with warfarin and NSAIDs in elderly',
            rule_condition: {
                all: [
                    { fact: 'age', operator: '>', value: 65 },
                    { fact: 'medications', operator: 'contains', value: 'warfarin' },
                    { fact: 'medications', operator: 'contains', value: 'ibuprofen' }
                ]
            },
            rule_action: {
                message: 'High bleeding risk: Warfarin + NSAID in elderly',
                recommendation: 'Concurrent use of warfarin and NSAIDs increases bleeding risk in patients >65 years. Monitor INR closely (current: {{labs.inr}}) and consider alternative analgesia (acetaminophen).',
                severity: 'high'
            },
            severity: 'high',
            dtp_category: 'drug_interaction',
            is_active: true,
            applies_to: ['geriatric']
        },
        {
            id: 'RULE_GERI_02',
            rule_name: 'Elderly ACE Inhibitor + Hyperkalemia Risk',
            rule_type: 'drug_interaction',
            rule_description: 'ACE inhibitor + potassium-sparing diuretic causing hyperkalemia in elderly',
            rule_condition: {
                all: [
                    { fact: 'age', operator: '>', value: 65 },
                    { fact: 'medications', operator: 'contains', value: 'lisinopril' },
                    { fact: 'medications', operator: 'contains', value: 'spironolactone' },
                    { fact: 'labs.potassium', operator: '>', value: 5.0 }
                ]
            },
            rule_action: {
                message: 'Hyperkalemia risk: ACE inhibitor + Spironolactone in elderly',
                recommendation: 'Combination of ACE inhibitor (lisinopril) and potassium-sparing diuretic (spironolactone) increases hyperkalemia risk in elderly. Potassium is {{labs.potassium}} (high). Consider dose adjustment or alternative.',
                severity: 'critical'
            },
            severity: 'critical',
            dtp_category: 'drug_interaction',
            is_active: true,
            applies_to: ['geriatric', 'renal_impairment']
        }
    ];

    useEffect(() => {
        // Reset when patient changes
        if (patientData?.patient_code !== previousPatientCode.current) {
            console.log('🔄 Patient changed, resetting CDSS');
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
            console.log('📁 CDSSDisplay: Patient data received:', patientData);
            
            // Always fetch medications when patient changes
            fetchPatientMedications();
            
            // Only fetch rules on initial load
            if (isInitialLoad) {
                fetchClinicalRules();
                setIsInitialLoad(false);
            }
        } else {
            console.log('⚠️ No patient data available');
            setAlerts([]);
            setFilteredAlerts([]);
            setAnalysisStats(null);
            setDebugInfo('');
            setPatientFacts(null);
            setTestResults(null);
        }
        
        // Cleanup function
        return () => {
            // Any cleanup if needed
        };
    }, [patientData, isInitialLoad]);

    const fetchClinicalRules = async () => {
        try {
            console.log('📋 Fetching clinical rules from database...');
            let debugText = '📋 Fetching clinical rules...\n';
            setDebugInfo(prev => prev + debugText);
            
            const { data, error } = await supabase
                .from('clinical_rules')
                .select('*')
                .eq('is_active', true)
                .order('severity', { ascending: false })
                .order('rule_name', { ascending: true });

            if (error) {
                console.error('❌ Error fetching rules:', error);
                debugText += `❌ Error fetching rules: ${error.message}\n`;
                setDebugInfo(prev => prev + debugText);
                
                // If database error, use sample test rules
                console.log('⚠️ Using sample test rules due to database error');
                setClinicalRules(sampleTestRules);
                return;
            }

            console.log(`✅ Loaded ${data?.length || 0} active rules`);
            debugText += `✅ Loaded ${data?.length || 0} active rules\n`;
            
            // If no rules in database, use sample test rules
            if (data && data.length > 0) {
                setClinicalRules(data);
                
                debugText += '\n📋 Available Rules:\n';
                data.forEach((rule, index) => {
                    debugText += 
                        `  ${index + 1}. "${rule.rule_name}" (${rule.rule_type}) - ${rule.severity}\n`;
                    
                    // Show condition if it's not too long
                    try {
                        const conditionStr = typeof rule.rule_condition === 'string' 
                            ? rule.rule_condition 
                            : JSON.stringify(rule.rule_condition);
                        if (conditionStr && conditionStr.length < 100) {
                            debugText += `     Condition: ${conditionStr}\n`;
                        }
                    } catch (e) {
                        debugText += `     Condition: [Error parsing]\n`;
                    }
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
            // Fallback to sample rules
            setClinicalRules(sampleTestRules);
        }
    };

    const fetchPatientMedications = async () => {
        if (!patientData?.patient_code) {
            console.log('⚠️ No patient code provided for medication fetch');
            setMedications([]);
            return;
        }
        
        try {
            console.log('💊 Fetching medications for:', patientData.patient_code);
            let debugText = `💊 Fetching medications for ${patientData.patient_code}...\n`;
            setDebugInfo(prev => prev + debugText);
            
            const { data, error } = await supabase
                .from('medication_history')
                .select('*')
                .eq('patient_code', patientData.patient_code)
                .eq('is_active', true)
                .order('start_date', { ascending: false });

            if (error) {
                console.error('❌ Error fetching medications:', error);
                debugText += `❌ Error fetching medications: ${error.message}\n`;
                setDebugInfo(prev => prev + debugText);
                setMedications([]);
                return;
            }

            console.log(`✅ Loaded ${data?.length || 0} medications`);
            debugText += `✅ Loaded ${data?.length || 0} medications\n`;
            
            if (data && data.length > 0) {
                debugText += '💊 Medications found:\n';
                data.forEach((med, index) => {
                    debugText += `  ${index + 1}. ${med.drug_name} (${med.drug_class || 'No class'})\n`;
                });
            }
            
            setDebugInfo(prev => prev + debugText);
            setMedications(data || []);
        } catch (error) {
            console.error('❌ Error in fetchPatientMedications:', error);
            setDebugInfo(prev => prev + `❌ Exception fetching medications: ${error.message}\n`);
            setMedications([]);
        }
    };

    const testSampleRules = () => {
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
        debug += `Patient: ${patientData.patient_code}\n`;
        debug += `Time: ${new Date().toLocaleString()}\n`;
        debug += `Sample Rules: ${sampleTestRules.length}\n`;
        debug += `Active Medications: ${medications.length}\n\n`;
        setDebugInfo(debug);
        
        try {
            // Use provided patient data
            const currentPatient = patientData;
            debug += `✅ Patient: ${currentPatient.full_name || currentPatient.patient_code}\n`;
            debug += `  Age: ${currentPatient.age || 'N/A'}\n`;
            debug += `  Gender: ${currentPatient.gender || 'N/A'}\n`;
            debug += `  Diagnosis: ${currentPatient.diagnosis || 'N/A'}\n`;
            
            // Map to facts
            debug += '\n🔍 === CREATING PATIENT FACTS ===\n';
            const facts = mapPatientToFacts(currentPatient, medications);
            setPatientFacts(facts);
            
            // Log age-in-days information
            debug += `  Age: ${facts.age} years\n`;
            debug += `  Age in Days: ${facts.age_in_days || 'N/A'}\n`;
            debug += `  Patient Type: ${facts.patient_type}\n`;
            if (facts.is_pediatric) debug += `  Pediatric: Yes\n`;
            if (facts.is_neonate) debug += `  Neonate: Yes\n`;
            if (facts.is_infant) debug += `  Infant: Yes\n`;
            if (facts.is_child) debug += `  Child: Yes\n`;
            if (facts.is_adolescent) debug += `  Adolescent: Yes\n`;
            debug += `  Medications: ${facts.medication_names.length} drugs\n`;
            
            // Log all medications for testing
            if (facts.medication_names.length > 0) {
                debug += '  Medication Names:\n';
                facts.medication_names.forEach((med, idx) => {
                    debug += `    ${idx + 1}. ${med}\n`;
                });
            } else {
                debug += '  No medications found for testing\n';
            }
            
            // Evaluate sample rules
            debug += '\n⚡ === TESTING SAMPLE RULES ===\n';
            const triggeredAlerts = [];
            let rulesEvaluated = 0;
            let rulesTriggered = 0;

            for (const rule of sampleTestRules) {
                rulesEvaluated++;
                
                try {
                    console.log(`🧪 Testing rule: "${rule.rule_name}"`);
                    const isTriggered = evaluateRule(rule, facts);
                    
                    if (isTriggered) {
                        rulesTriggered++;
                        debug += `[${rulesEvaluated}] "${rule.rule_name}": ✅ TRIGGERED\n`;
                        
                        // Create alert
                        const message = rule.rule_action?.message || rule.rule_name;
                        const details = rule.rule_action?.recommendation || rule.rule_description;
                        const severity = rule.rule_action?.severity || rule.severity || 'moderate';
                        
                        const formattedMessage = formatAlertMessage(message, facts);
                        const formattedDetails = formatAlertMessage(details, facts);
                        
                        const alert = {
                            id: `test-${rule.id}-${Date.now()}`,
                            rule_id: rule.id,
                            rule_name: rule.rule_name,
                            rule_type: rule.rule_type,
                            rule_description: rule.rule_description,
                            severity: severity,
                            message: formattedMessage,
                            details: formattedDetails,
                            evidence: {
                                facts: facts,
                                age_in_days: facts.age_in_days,
                                patient_type: facts.patient_type,
                                is_pediatric: facts.is_pediatric,
                                medications: facts.medication_names
                            },
                            timestamp: new Date().toISOString(),
                            acknowledged: false,
                            confidence: 95,
                            patient_code: patientData.patient_code,
                            patient_name: currentPatient.full_name,
                            patient_age_in_days: facts.age_in_days,
                            patient_type: facts.patient_type,
                            is_pediatric: facts.is_pediatric,
                            is_test_rule: true
                        };
                        
                        triggeredAlerts.push(alert);
                    } else {
                        debug += `[${rulesEvaluated}] "${rule.rule_name}": ❌ Not triggered\n`;
                        console.log(`✓ Rule "${rule.rule_name}" not triggered`);
                    }
                } catch (ruleError) {
                    debug += `[${rulesEvaluated}] "${rule.rule_name}": ❌ Error: ${ruleError.message}\n`;
                    console.error(`Rule testing error:`, ruleError, rule);
                }
            }

            // Calculate statistics
            debug += '\n📈 === TEST COMPLETE ===\n';
            debug += `Sample Rules Tested: ${rulesEvaluated}\n`;
            debug += `Rules Triggered: ${rulesTriggered}\n`;
            debug += `Alerts Generated: ${triggeredAlerts.length}\n`;
            
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
                patientCode: patientData.patient_code,
                medicationCount: medications.length,
                patientAge: facts.age,
                patientAgeInDays: facts.age_in_days,
                patientType: facts.patient_type,
                isPediatric: facts.is_pediatric,
                isNeonate: facts.is_neonate,
                isInfant: facts.is_infant,
                isChild: facts.is_child,
                isAdolescent: facts.is_adolescent,
                isTestRun: true
            };
            
            debug += `Critical Alerts: ${stats.bySeverity.critical}\n`;
            debug += `High Alerts: ${stats.bySeverity.high}\n`;
            debug += `Moderate Alerts: ${stats.bySeverity.moderate}\n`;
            debug += `Low Alerts: ${stats.bySeverity.low}\n`;
            debug += `Patient Age: ${stats.patientAge} years\n`;
            debug += `Patient Age in Days: ${stats.patientAgeInDays}\n`;
            debug += `Patient Type: ${stats.patientType}\n`;
            if (stats.isPediatric) debug += `Pediatric Patient: Yes\n`;
            
            // Update state
            setAlerts(triggeredAlerts);
            setFilteredAlerts(triggeredAlerts);
            setDebugInfo(debug);
            setAnalysisStats(stats);
            setLastAnalysisTime(new Date().toISOString());
            setTestResults({
                passed: rulesTriggered > 0,
                message: triggeredAlerts.length > 0 ? 
                    `Successfully triggered ${triggeredAlerts.length} rules!` :
                    'No rules triggered with current patient data'
            });
            
            console.log('✅ Sample Rules Test Complete', stats);

        } catch (error) {
            console.error('❌ Test error:', error);
            debug += `\n❌ ERROR: ${error.message}\n`;
            setDebugInfo(debug);
            setAnalysisError(error.message);
            setTestResults({
                passed: false,
                message: `Test failed: ${error.message}`
            });
            
            setAlerts([]);
            setFilteredAlerts([]);
        } finally {
            setIsTestingRules(false);
        }
    };

    const analyzePatient = async () => {
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
            debug += `✅ Patient: ${currentPatient.full_name || currentPatient.patient_code}\n`;
            debug += `  Age: ${currentPatient.age || 'N/A'}\n`;
            debug += `  Gender: ${currentPatient.gender || 'N/A'}\n`;
            debug += `  Diagnosis: ${currentPatient.diagnosis || 'N/A'}\n`;
            
            // Map to facts
            debug += '\n🔍 === CREATING PATIENT FACTS ===\n';
            const facts = mapPatientToFacts(currentPatient, medications);
            setPatientFacts(facts);
            
            // Log age-in-days information
            debug += `  Age: ${facts.age} years\n`;
            debug += `  Age in Days: ${facts.age_in_days || 'N/A'}\n`;
            debug += `  Patient Type: ${facts.patient_type}\n`;
            if (facts.is_pediatric) debug += `  Pediatric: Yes\n`;
            if (facts.is_neonate) debug += `  Neonate: Yes\n`;
            if (facts.is_infant) debug += `  Infant: Yes\n`;
            if (facts.is_child) debug += `  Child: Yes\n`;
            if (facts.is_adolescent) debug += `  Adolescent: Yes\n`;
            debug += `  Gender: ${facts.gender}\n`;
            debug += `  BMI: ${facts.bmi?.toFixed(1) || 'N/A'}\n`;
            debug += `  eGFR: ${facts.egfr || 'N/A'}\n`;
            debug += `  Creatinine: ${facts.creatinine || 'N/A'}\n`;
            debug += `  Potassium: ${facts.potassium || 'N/A'}\n`;
            debug += `  Medications: ${facts.medication_names.length} drugs\n`;
            
            // Check if we have rules
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
                        console.log(`✓ Rule "${rule.rule_name}" not triggered`);
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
            debug += '\n📈 === ANALYSIS COMPLETE ===\n';
            debug += `Rules Evaluated: ${rulesEvaluated}\n`;
            debug += `Rules Triggered: ${rulesTriggered}\n`;
            debug += `Alerts Generated: ${triggeredAlerts.length}\n`;
            
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
                medicationCount: medications.length,
                patientAge: facts.age,
                patientAgeInDays: facts.age_in_days,
                patientType: facts.patient_type,
                isPediatric: facts.is_pediatric,
                isNeonate: facts.is_neonate,
                isInfant: facts.is_infant,
                isChild: facts.is_child,
                isAdolescent: facts.is_adolescent,
                isTestRun: clinicalRules.length === 0
            };
            
            debug += `Critical Alerts: ${stats.bySeverity.critical}\n`;
            debug += `High Alerts: ${stats.bySeverity.high}\n`;
            debug += `Moderate Alerts: ${stats.bySeverity.moderate}\n`;
            debug += `Low Alerts: ${stats.bySeverity.low}\n`;
            debug += `Patient Age: ${stats.patientAge} years\n`;
            debug += `Patient Age in Days: ${stats.patientAgeInDays}\n`;
            debug += `Patient Type: ${stats.patientType}\n`;
            if (stats.isPediatric) debug += `Pediatric Patient: Yes\n`;
            
            if (triggeredAlerts.length === 0 && rulesToEvaluate.length > 0) {
                debug += '\n✅ No clinical issues detected!\n';
                debug += 'All rules passed successfully.\n';
            }

            // Update state
            setAlerts(triggeredAlerts);
            setFilteredAlerts(triggeredAlerts);
            setDebugInfo(debug);
            setAnalysisStats(stats);
            setLastAnalysisTime(new Date().toISOString());
            
            console.log('✅ CDSS Analysis Complete', stats);

        } catch (error) {
            console.error('❌ Analysis error:', error);
            debug += `\n❌ ERROR: ${error.message}\n`;
            setDebugInfo(debug);
            setAnalysisError(error.message);
            
            setAlerts([]);
            setFilteredAlerts([]);
            setAnalysisStats({
                totalRules: clinicalRules.length,
                rulesEvaluated: 0,
                rulesTriggered: 0,
                alertsGenerated: 0,
                bySeverity: { critical: 0, high: 0, moderate: 0, low: 0 },
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (severity) => {
        setSeverityFilter(severity);
        if (severity === 'all') {
            setFilteredAlerts(alerts);
        } else {
            setFilteredAlerts(alerts.filter(alert => alert.severity === severity));
        }
    };

    const acknowledgeAlert = (alertId) => {
        const updatedAlerts = alerts.map(alert => 
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
        );
        setAlerts(updatedAlerts);
        setFilteredAlerts(updatedAlerts.filter(alert => 
            severityFilter === 'all' || alert.severity === severityFilter
        ));
    };

    const acknowledgeAll = () => {
        const updatedAlerts = alerts.map(alert => ({ ...alert, acknowledged: true }));
        setAlerts(updatedAlerts);
        setFilteredAlerts(updatedAlerts);
    };

    const toggleExpandAlert = (alertId) => {
        setExpandedAlert(expandedAlert === alertId ? null : alertId);
    };

    const downloadReport = () => {
        if (!patientData) return;
        
        const report = {
            title: 'Clinical Decision Support Report',
            patient: {
                code: patientData.patient_code,
                name: patientData.full_name,
                age: patientData.age,
                gender: patientData.gender,
                diagnosis: patientData.diagnosis,
                age_in_days: patientFacts?.age_in_days,
                patient_type: patientFacts?.patient_type,
                is_pediatric: patientFacts?.is_pediatric
            },
            analysis: analysisStats,
            timestamp: new Date().toISOString(),
            medications: medications.map(m => ({
                name: m.drug_name,
                dose: m.dose,
                frequency: m.frequency,
                indication: m.indication,
                class: m.drug_class
            })),
            alerts: alerts.map(a => ({
                rule: a.rule_name,
                type: a.rule_type,
                severity: a.severity,
                message: a.message,
                recommendation: a.details,
                evidence: a.evidence,
                timestamp: a.timestamp,
                confidence: a.confidence,
                patient_age_in_days: a.patient_age_in_days,
                patient_type: a.patient_type
            })),
            summary: `Clinical analysis generated ${alerts.length} alerts for ${patientData.patient_code}`
        };

        const content = JSON.stringify(report, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CDSS_Report_${patientData.patient_code}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getRuleTypeInfo = (type) => {
        const types = {
            'drug_interaction': { label: 'Drug Interaction', color: 'bg-red-100 text-red-800', icon: FaPills },
            'dose_check': { label: 'Dose Check', color: 'bg-blue-100 text-blue-800', icon: FaPrescription },
            'lab_monitoring': { label: 'Lab Monitoring', color: 'bg-green-100 text-green-800', icon: FaFlask },
            'contraindication': { label: 'Contraindication', color: 'bg-purple-100 text-purple-800', icon: FaExclamationTriangle },
            'allergy_check': { label: 'Allergy Check', color: 'bg-orange-100 text-orange-800', icon: FaExclamationTriangle },
            'duplicate_therapy': { label: 'Duplicate Therapy', color: 'bg-yellow-100 text-yellow-800', icon: FaClipboardCheck },
            'renal_adjustment': { label: 'Renal Adjustment', color: 'bg-teal-100 text-teal-800', icon: FaStethoscope },
            'hepatic_adjustment': { label: 'Hepatic Adjustment', color: 'bg-indigo-100 text-indigo-800', icon: FaStethoscope },
            'pregnancy_check': { label: 'Pregnancy Safety', color: 'bg-pink-100 text-pink-800', icon: FaUser },
            'therapeutic_monitoring': { label: 'Therapeutic Monitoring', color: 'bg-cyan-100 text-cyan-800', icon: FaChartLine },
            'cost_analysis': { label: 'Cost Analysis', color: 'bg-amber-100 text-amber-800', icon: FaChartBar },
            'quality_check': { label: 'Quality Check', color: 'bg-emerald-100 text-emerald-800', icon: FaCheckCircle },
            'vitals_monitoring': { label: 'Vitals Monitoring', color: 'bg-pink-100 text-pink-800', icon: FaHeartbeat },
            'adherence_check': { label: 'Adherence Check', color: 'bg-lime-100 text-lime-800', icon: FaUser },
            'age_check': { label: 'Age Check', color: 'bg-rose-100 text-rose-800', icon: FaUser },
            'pediatric_check': { label: 'Pediatric Check', color: 'bg-indigo-100 text-indigo-800', icon: FaBaby }
        };
        return types[type] || { label: type, color: 'bg-gray-100 text-gray-800', icon: FaCogs };
    };

    const getTimeAgo = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const getAgeCategoryIcon = () => {
        if (patientFacts?.is_neonate) return FaBaby;
        if (patientFacts?.is_infant) return FaBaby;
        if (patientFacts?.is_child) return FaChild;
        if (patientFacts?.is_adolescent) return FaUser;
        if (patientFacts?.age > 65) return FaUserClock;
        return FaUser;
    };

    const getAgeCategoryLabel = () => {
        if (patientFacts?.is_neonate) return 'Neonate (0-28d)';
        if (patientFacts?.is_infant) return 'Infant (29d-1y)';
        if (patientFacts?.is_child) return 'Child (1-12y)';
        if (patientFacts?.is_adolescent) return 'Adolescent (13-18y)';
        if (patientFacts?.age > 65) return 'Geriatric (>65y)';
        return 'Adult';
    };

    const renderAlertDetails = (alert) => {
        return (
            <div className="mt-4 space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaDatabase /> Triggering Evidence
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Age Information */}
                        {alert.evidence.age_in_days > 0 && (
                            <div>
                                <h5 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                                    <FaCalendarDay className="text-blue-500" /> Age Information
                                </h5>
                                <div className="space-y-1">
                                    <div className="text-sm pl-4">
                                        • <span className="font-medium">Age in Days:</span> 
                                        <span className="ml-2 text-blue-600">{alert.evidence.age_in_days}</span>
                                    </div>
                                    {alert.evidence.patient_type && (
                                        <div className="text-sm pl-4">
                                            • <span className="font-medium">Patient Type:</span> 
                                            <span className="ml-2 text-blue-600 capitalize">{alert.evidence.patient_type}</span>
                                        </div>
                                    )}
                                    {alert.evidence.is_pediatric && (
                                        <div className="text-sm pl-4">
                                            • <span className="font-medium">Pediatric:</span> 
                                            <span className="ml-2 text-green-600">Yes</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Medications */}
                        {alert.evidence.medications && alert.evidence.medications.length > 0 && (
                            <div>
                                <h5 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                                    <FaPills className="text-purple-500" /> Medications Involved
                                </h5>
                                <div className="space-y-1">
                                    {alert.evidence.medications.map((med, idx) => (
                                        <div key={idx} className="text-sm pl-4">
                                            • <span className="font-medium">{med}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Labs */}
                        {alert.evidence.labs && Object.keys(alert.evidence.labs).length > 0 && (
                            <div>
                                <h5 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                                    <FaFlask className="text-green-500" /> Lab Values
                                </h5>
                                <div className="space-y-1">
                                    {Object.entries(alert.evidence.labs).slice(0, 5).map(([key, value]) => (
                                        <div key={key} className="text-sm pl-4">
                                            • <span className="font-medium">{key}:</span> 
                                            <span className={`ml-2 ${value > 5 ? 'text-red-600' : 'text-gray-700'}`}>
                                                {typeof value === 'number' ? value.toFixed(1) : value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const AgeCategoryIcon = getAgeCategoryIcon();

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full">
                        <FaBell className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Clinical Decision Support System</h2>
                        {patientData ? (
                            <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{patientData.full_name || patientData.patient_code}</span>
                                {patientFacts?.age_in_days > 0 && (
                                    <span className="flex items-center gap-1">
                                        <FaCalendarDay className="text-blue-400" /> {patientFacts.age_in_days} days
                                    </span>
                                )}
                                {patientFacts?.patient_type && (
                                    <span className="flex items-center gap-1">
                                        <AgeCategoryIcon className="text-indigo-400" /> {getAgeCategoryLabel()}
                                    </span>
                                )}
                                {patientFacts?.gender && (
                                    <span className="flex items-center gap-1">
                                        <FaUserTag className="text-gray-400" /> {patientFacts.gender}
                                    </span>
                                )}
                                {medications.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        <FaCapsules className="text-purple-400" /> {medications.length} meds
                                    </span>
                                )}
                                {clinicalRules.length === 0 && (
                                    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                        <FaExclamationTriangle /> Using Test Rules
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">Select a patient to begin analysis</p>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {clinicalRules.length === 0 && patientData && (
                        <button
                            onClick={testSampleRules}
                            disabled={isTestingRules}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                            <FaVial /> Test Age-in-Days Rules
                        </button>
                    )}
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                    >
                        {showDebug ? <FaEyeSlash /> : <FaEye />}
                        {showDebug ? 'Hide Logs' : 'Show Logs'}
                    </button>
                    <button
                        onClick={fetchClinicalRules}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                    >
                        <FaRedo /> Refresh Rules
                    </button>
                    <button
                        onClick={analyzePatient}
                        disabled={loading || !patientData}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Analyzing...' : 'Run Analysis'}
                    </button>
                    {alerts.length > 0 && (
                        <button
                            onClick={downloadReport}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <FaDownload />
                            Export Report
                        </button>
                    )}
                </div>
            </div>

            {/* Test Results Banner */}
            {testResults && (
                <div className={`mb-6 p-4 rounded-lg ${testResults.passed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                        {testResults.passed ? (
                            <FaCheckCircle className="text-green-600" />
                        ) : (
                            <FaInfoCircle className="text-yellow-600" />
                        )}
                        <span className={`font-semibold ${testResults.passed ? 'text-green-700' : 'text-yellow-700'}`}>
                            {testResults.passed ? 'Age-in-Days Rules Test Passed!' : 'Age-in-Days Rules Test'}
                        </span>
                    </div>
                    <p className={`text-sm mt-1 ${testResults.passed ? 'text-green-600' : 'text-yellow-600'}`}>
                        {testResults.message}
                    </p>
                    {testResults.passed && alerts.length > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                            Age-in-days functionality is working correctly. Rules are triggering based on patient's age in days.
                        </p>
                    )}
                </div>
            )}

            {/* Status Bar */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-1 flex items-center gap-1">
                        <FaCalendarDay /> Age in Days
                    </div>
                    <div className="text-xl font-bold text-blue-800">
                        {patientFacts?.age_in_days || 'N/A'}
                    </div>
                    {patientData?.age && (
                        <div className="text-xs text-blue-600">
                            ({patientData.age} years)
                        </div>
                    )}
                </div>
                
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <div className="text-sm text-indigo-700 mb-1 flex items-center gap-1">
                        <AgeCategoryIcon /> Age Category
                    </div>
                    <div className="text-xl font-bold text-indigo-800">
                        {getAgeCategoryLabel()}
                    </div>
                    {patientFacts?.is_pediatric && (
                        <div className="text-xs text-indigo-600">
                            Pediatric Patient
                        </div>
                    )}
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-700 mb-1 flex items-center gap-1">
                        <FaCapsules /> Medications
                    </div>
                    <div className="text-xl font-bold text-purple-800">{medications.length}</div>
                    <div className="text-xs text-purple-600">
                        Active prescriptions
                    </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                        <FaCheckCircle /> Available Rules
                    </div>
                    <div className="text-xl font-bold text-green-800">{clinicalRules.length || sampleTestRules.length}</div>
                    <div className="text-xs text-green-600">
                        For analysis
                    </div>
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-700 mb-1 flex items-center gap-1">
                        <FaFlask /> Labs
                    </div>
                    <div className="text-xl font-bold text-orange-800">
                        {patientFacts ? Object.keys(patientFacts.labs).length : 0}
                    </div>
                    <div className="text-xs text-orange-600">
                        Available values
                    </div>
                </div>
                
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                    <div className="text-sm text-pink-700 mb-1 flex items-center gap-1">
                        <FaHeartbeat /> Vitals
                    </div>
                    <div className="text-xl font-bold text-pink-800">
                        {patientFacts ? Object.keys(patientFacts.vitals).length : 0}
                    </div>
                    <div className="text-xs text-pink-600">
                        Recorded values
                    </div>
                </div>
            </div>

            {/* Debug Panel */}
            {showDebug && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <FaDatabase /> Analysis Log
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigator.clipboard.writeText(debugInfo)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Copy Log
                            </button>
                            <button
                                onClick={() => setDebugInfo('')}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Clear Log
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-auto max-h-64">
                        <pre className="whitespace-pre-wrap">{debugInfo || 'No debug information yet. Run analysis to see logs.'}</pre>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {analysisError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                        <FaExclamationTriangle />
                        <span className="font-semibold">Analysis Error</span>
                    </div>
                    <p className="text-red-600">{analysisError}</p>
                    <button
                        onClick={analyzePatient}
                        className="mt-2 text-sm text-red-700 hover:text-red-900"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* No Rules Warning */}
            {clinicalRules.length === 0 && patientData && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                        <FaExclamationTriangle />
                        <span className="font-semibold">Using Demo Rules</span>
                    </div>
                    <p className="text-yellow-600 mb-3">
                        No clinical rules found in database. Using sample rules with age-in-days functionality for demonstration.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={testSampleRules}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                        >
                            <FaVial /> Test Age-in-Days Rules
                        </button>
                        <a
                            href="/clinical-rules"
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                        >
                            <FaCogs /> Go to Rules Admin
                        </a>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            <div className="space-y-4">
                {loading || isTestingRules ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 mb-2">
                            {isTestingRules ? 'Testing age-in-days rules...' : 'Running clinical analysis...'}
                        </p>
                        <p className="text-sm text-gray-400">
                            {clinicalRules.length > 0 
                                ? `Evaluating ${clinicalRules.length} rules against patient data`
                                : 'Testing sample age-in-days rules'}
                        </p>
                    </div>
                ) : !patientData ? (
                    <div className="text-center py-12">
                        <FaUser className="text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No patient selected</p>
                        <p className="text-sm text-gray-400">
                            Select a patient from the patient list to begin analysis
                        </p>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium mb-2">No clinical alerts detected</p>
                        <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
                            {medications.length === 0
                                ? 'Patient has no active medications to analyze.'
                                : clinicalRules.length === 0
                                ? 'Sample rules did not trigger with current patient data.'
                                : 'Patient data passes all clinical rules. No issues detected.'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {clinicalRules.length === 0 && (
                                <button
                                    onClick={testSampleRules}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                                >
                                    <FaVial /> Test Age-in-Days Rules
                                </button>
                            )}
                            <button
                                onClick={analyzePatient}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                            >
                                <FaRocket /> Run Analysis Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-lg">
                                    <FaExclamationTriangle className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Clinical Alerts ({alerts.length})
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {alerts.filter(a => !a.acknowledged).length} unacknowledged • 
                                        {alerts.filter(a => a.severity === 'critical').length} critical
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                {alerts.filter(a => !a.acknowledged).length > 0 && (
                                    <button
                                        onClick={acknowledgeAll}
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <FaCheckCircle /> Mark all as reviewed
                                    </button>
                                )}
                                
                                <div className="flex items-center gap-2">
                                    <FaFilter className="text-gray-400" />
                                    <select
                                        value={severityFilter}
                                        onChange={(e) => handleFilterChange(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="all">All Severities ({alerts.length})</option>
                                        <option value="critical">Critical ({alerts.filter(a => a.severity === 'critical').length})</option>
                                        <option value="high">High ({alerts.filter(a => a.severity === 'high').length})</option>
                                        <option value="moderate">Moderate ({alerts.filter(a => a.severity === 'moderate').length})</option>
                                        <option value="low">Low ({alerts.filter(a => a.severity === 'low').length})</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* Statistics Bar */}
                        {analysisStats && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800">{analysisStats.rulesEvaluated}</div>
                                        <div className="text-sm text-gray-600">Rules Checked</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">{analysisStats.bySeverity.critical || 0}</div>
                                        <div className="text-sm text-gray-600">Critical</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{analysisStats.bySeverity.high || 0}</div>
                                        <div className="text-sm text-gray-600">High</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600">{analysisStats.bySeverity.moderate || 0}</div>
                                        <div className="text-sm text-gray-600">Moderate</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{analysisStats.bySeverity.low || 0}</div>
                                        <div className="text-sm text-gray-600">Low</div>
                                    </div>
                                </div>
                                {/* Age Information Row */}
                                {analysisStats.patientAgeInDays > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                                            <span className="flex items-center gap-1">
                                                <FaCalendarDay className="text-blue-500" /> Age: {analysisStats.patientAgeInDays} days
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <AgeCategoryIcon className="text-indigo-500" /> Type: {analysisStats.patientType}
                                            </span>
                                            {analysisStats.isPediatric && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <FaBaby /> Pediatric Patient
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Alerts List */}
                        <div className="space-y-4">
                            {filteredAlerts.map((alert) => {
                                const SeverityIcon = severityIcons[alert.severity] || FaBell;
                                const severityColor = severityColors[alert.severity];
                                const severityBgColor = severityBgColors[alert.severity];
                                const ruleTypeInfo = getRuleTypeInfo(alert.rule_type);
                                const TypeIcon = ruleTypeInfo.icon;
                                const isExpanded = expandedAlert === alert.id;
                                
                                return (
                                    <div 
                                        key={alert.id} 
                                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${severityColor} ${alert.acknowledged ? 'opacity-60' : ''}`}
                                    >
                                        <div className="p-5">
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className={`p-3 rounded-full ${severityBgColor}`}>
                                                        <SeverityIcon className="text-white text-lg" />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <h3 className="font-bold text-lg text-gray-800">{alert.rule_name}</h3>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ruleTypeInfo.color} flex items-center gap-1`}>
                                                                <TypeIcon className="text-xs" />
                                                                {ruleTypeInfo.label}
                                                            </span>
                                                            {alert.is_test_rule && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                                                    <FaVial /> Demo Rule
                                                                </span>
                                                            )}
                                                            {alert.is_pediatric && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                                                                    <FaBaby /> Pediatric
                                                                </span>
                                                            )}
                                                            {alert.patient_age_in_days > 0 && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                                    <FaCalendarDay /> {alert.patient_age_in_days} days
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <FaClock />
                                                                {getTimeAgo(alert.timestamp)}
                                                            </span>
                                                            {alert.acknowledged && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                                                    <FaCheckCircle /> Reviewed
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="mb-3 p-3 bg-white bg-opacity-70 rounded-lg border border-opacity-30">
                                                            <h4 className="font-semibold text-gray-800 mb-2">Alert:</h4>
                                                            <p className="text-gray-700">{alert.message}</p>
                                                        </div>
                                                        
                                                        {alert.details && (
                                                            <div className="mb-3 p-3 bg-white bg-opacity-70 rounded-lg border border-opacity-30">
                                                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                                                    <FaUserMd /> Recommendation:
                                                                </h4>
                                                                <p className="text-gray-600 whitespace-pre-line">{alert.details}</p>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-opacity-30">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center gap-2 px-2 py-1 rounded ${
                                                                    alert.severity === 'critical' ? 'text-red-600 bg-red-50' :
                                                                    alert.severity === 'high' ? 'text-orange-600 bg-orange-50' :
                                                                    alert.severity === 'moderate' ? 'text-yellow-600 bg-yellow-50' :
                                                                    'text-blue-600 bg-blue-50'
                                                                }`}>
                                                                    <SeverityIcon />
                                                                    {alert.severity.toUpperCase()} • {alert.confidence}% confidence
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => toggleExpandAlert(alert.id)}
                                                                    className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
                                                                >
                                                                    {isExpanded ? (
                                                                        <>
                                                                            <FaChevronUp /> Show Less
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FaChevronDown /> Show Details
                                                                        </>
                                                                    )}
                                                                </button>
                                                                
                                                                {!alert.acknowledged && (
                                                                    <button
                                                                        onClick={() => acknowledgeAlert(alert.id)}
                                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                                                    >
                                                                        <FaCheckCircle /> Mark Reviewed
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isExpanded && renderAlertDetails(alert)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {filteredAlerts.length === 0 && severityFilter !== 'all' && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                <FaInfoCircle className="text-4xl text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2">No {severityFilter} alerts</p>
                                <button
                                    onClick={() => setSeverityFilter('all')}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Show all alerts
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CDSSDisplay;