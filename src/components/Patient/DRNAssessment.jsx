import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import supabase from '../../utils/supabase'; // Kept for auth fallback if needed
import { mapPatientToFacts, evaluateRule } from '../CDSS/RuleEngine';
import {
    FaStethoscope, FaEdit, FaDatabase, FaChevronUp, FaChevronDown,
    FaPills, FaUserMd, FaChartLine, FaDownload, FaSync,
    FaExclamationTriangle, FaCheckCircle, FaSpinner, FaSearch,
    FaHeartbeat, FaClipboardCheck, FaShieldAlt, FaUserCheck,
    FaMoneyBillWave, FaCapsules, FaTrash, FaPlus, FaFilter,
    FaSortAmountDown, FaFileMedical, FaClipboardList, FaRegCopy,
    FaCog, FaBell, FaFileAlt, FaVial, FaBalanceScale, FaSyringe,
    FaTint, FaUserInjured, FaHistory, FaNotesMedical, FaPrescription,
    FaMicroscope, FaBox, FaClock, FaProcedures, FaUser, FaExclamationCircle, FaSave
} from 'react-icons/fa';

const DRNAssessment = ({ patientCode }) => {
    const [assessments, setAssessments] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCauses, setSelectedCauses] = useState([]);
    const [writeUps, setWriteUps] = useState({});
    const [editId, setEditId] = useState(null);
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(true);
    const [patientData, setPatientData] = useState(null);
    const [medications, setMedications] = useState([]);
    const [labs, setLabs] = useState({});
    const [clinicalRules, setClinicalRules] = useState([]);
    const [activeRules, setActiveRules] = useState({});
    const [showRulesInfo, setShowRulesInfo] = useState(false);
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [userId, setUserId] = useState(null);
    const [patientId, setPatientId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState(null);

    // ✅ 9 DRN Categories matching original structure
    const drnCategories = {
        Indication: {
            icon: FaClipboardCheck,
            color: 'blue',
            ruleTypes: ['duplicate_therapy', 'no_medical_indication', 'nondrug_therapy_appropriate', 'addiction_or_recreational_medicine_use', 'treating_avoidable_ade', 'prophylaxis_needed', 'untreated_condition', 'synergistic_therapy_needed'],
            description: 'Appropriateness of indication'
        },
        Dosage: {
            icon: FaPills,
            color: 'teal',
            ruleTypes: ['low_dose', 'less_frequent', 'short_duration', 'improper_storage', 'high_dose', 'high_frequent', 'longer_duration', 'dose_titration_slow_or_fast'],
            description: 'Incorrect dose'
        },
        "Rule out Ineffective Drug Therapy": {
            icon: FaStethoscope,
            color: 'yellow',
            ruleTypes: ['more_effective_drug_available', 'condition_refractory_to_drug', 'dosage_form_inappropriate'],
            description: 'Ineffective drug therapy'
        },
        "Contraindication or Caution or ADE or SE or Allergy": {
            icon: FaExclamationTriangle,
            color: 'red',
            ruleTypes: ['undesirable_effect_ade_or_se', 'unsafe_drug_contraindication_or_caution', 'allergic_reaction'],
            description: 'Medication safety'
        },
        "Drug Interaction": {
            icon: FaDatabase,
            color: 'orange',
            ruleTypes: ['di_increase_dose', 'di_decrease_dose', 'di_linked_to_ade'],
            description: 'Drug interactions'
        },
        Administration: {
            icon: FaUserMd,
            color: 'purple',
            ruleTypes: ['incorrect_administration_decrease_dose_or_efficacy', 'incorrect_administration_linked_to_ade', 'patient_does_not_understand_instructions', 'cannot_swallow_or_administer_drug'],
            description: 'Administration related problems'
        },
        Monitoring: {
            icon: FaHeartbeat,
            color: 'pink',
            ruleTypes: ['need_monitoring_to_rule_out_effectiveness', 'need_monitoring_to_rule_out_safety'],
            description: 'Need for monitoring'
        },
        Adherence: {
            icon: FaUserCheck,
            color: 'indigo',
            ruleTypes: ['patient_prefers_not_to_take_drug', 'patient_forgets_to_take_drug', 'drug_not_available', 'more_cost_effective_drug_available', 'cannot_afford_drug'],
            description: 'Adherence to medication'
        },
        "Product Quality": {
            icon: FaCapsules,
            color: 'green',
            ruleTypes: ['product_quality_defect'],
            description: 'Product quality defect'
        }
    };

    // ✅ Menu items matching original structure with DTP Type included
    const menuItemsData = {
        Indication: [
            { name: 'Duplicate Therapy', ruleType: 'duplicate_therapy', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
            { name: 'No medical indication', ruleType: 'no_medical_indication', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
            { name: 'Nondrug therapy appropriate', ruleType: 'nondrug_therapy_appropriate', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
            { name: 'Addiction or recreational medicine use', ruleType: 'addiction_or_recreational_medicine_use', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
            { name: 'Treating avoidable ADE', ruleType: 'treating_avoidable_ade', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
            { name: 'Prophylaxis needed', ruleType: 'prophylaxis_needed', dtpType: 'Needs Additional Drug Therapy', drn: 'Indication' },
            { name: 'Untreated condition', ruleType: 'untreated_condition', dtpType: 'Needs Additional Drug Therapy', drn: 'Indication' },
            { name: 'Synergistic therapy needed', ruleType: 'synergistic_therapy_needed', dtpType: 'Needs Additional Drug Therapy', drn: 'Indication' },
        ],
        Dosage: [
            { name: 'Low Dose', ruleType: 'low_dose', dtpType: 'Low Dose', drn: 'Effectiveness' },
            { name: 'Less Frequent', ruleType: 'less_frequent', dtpType: 'Low Dose', drn: 'Effectiveness' },
            { name: 'Short Duration', ruleType: 'short_duration', dtpType: 'Low Dose', drn: 'Effectiveness' },
            { name: 'Improper Storage', ruleType: 'improper_storage', dtpType: 'Low Dose', drn: 'Effectiveness' },
            { name: 'High Dose', ruleType: 'high_dose', dtpType: 'High Dose', drn: 'Safety' },
            { name: 'More Frequent', ruleType: 'high_frequent', dtpType: 'High Dose', drn: 'Safety' },
            { name: 'Longer Duration', ruleType: 'longer_duration', dtpType: 'High Dose', drn: 'Safety' },
            { name: 'Dose Titration Slow or Fast', ruleType: 'dose_titration_slow_or_fast', dtpType: 'ADE', drn: 'Safety' },
        ],
        "Rule out Ineffective Drug Therapy": [
            { name: 'More effective drug available', ruleType: 'more_effective_drug_available', dtpType: 'Ineffective Drug Therapy', drn: 'Effectiveness' },
            { name: 'Condition refractory to drug', ruleType: 'condition_refractory_to_drug', dtpType: 'Ineffective Drug Therapy', drn: 'Effectiveness' },
            { name: 'Dosage form inappropriate', ruleType: 'dosage_form_inappropriate', dtpType: 'Ineffective Drug Therapy', drn: 'Effectiveness' },
        ],
        "Contraindication or Caution or ADE or SE or Allergy": [
            { name: 'Undesirable Effect (ADE or SE)', ruleType: 'undesirable_effect_ade_or_se', dtpType: 'ADE', drn: 'Safety' },
            { name: 'Unsafe Drug (Contraindication or Caution)', ruleType: 'unsafe_drug_contraindication_or_caution', dtpType: 'ADE', drn: 'Safety' },
            { name: 'Allergic Reaction', ruleType: 'allergic_reaction', dtpType: 'ADE', drn: 'Safety' },
        ],
        "Drug Interaction": [
            { name: 'DI increase dose', ruleType: 'di_increase_dose', dtpType: 'High Dose', drn: 'Safety' },
            { name: 'DI decrease dose', ruleType: 'di_decrease_dose', dtpType: 'Low Dose', drn: 'Effectiveness' },
            { name: 'DI linked to ADE', ruleType: 'di_linked_to_ade', dtpType: 'ADE', drn: 'Safety' },
        ],
        Administration: [
            { name: 'Incorrect administration decrease dose or efficacy', ruleType: 'incorrect_administration_decrease_dose_or_efficacy', dtpType: 'Low Dose', drn: 'Effectiveness' },
            { name: 'Incorrect administration linked to ADE', ruleType: 'incorrect_administration_linked_to_ade', dtpType: 'ADE', drn: 'Safety' },
            { name: 'Patient does not understand instructions', ruleType: 'patient_does_not_understand_instructions', dtpType: 'Non-Adherence', drn: 'Adherence' },
            { name: 'Cannot swallow or administer drug', ruleType: 'cannot_swallow_or_administer_drug', dtpType: 'Non-Adherence', drn: 'Adherence' },
        ],
        Monitoring: [
            { name: 'Need Monitoring to rule out effectiveness', ruleType: 'need_monitoring_to_rule_out_effectiveness', dtpType: 'Needs additional monitoring', drn: 'Effectiveness' },
            { name: 'Need Monitoring to rule out safety', ruleType: 'need_monitoring_to_rule_out_safety', dtpType: 'Needs additional monitoring', drn: 'Safety' },
        ],
        Adherence: [
            { name: 'Patient prefers not to take drug', ruleType: 'patient_prefers_not_to_take_drug', dtpType: 'Non-Adherence', drn: 'Adherence' },
            { name: 'Patient forgets to take drug', ruleType: 'patient_forgets_to_take_drug', dtpType: 'Non-Adherence', drn: 'Adherence' },
            { name: 'Drug not available', ruleType: 'drug_not_available', dtpType: 'Non-Adherence', drn: 'Adherence' },
            { name: 'More cost-effective drug available', ruleType: 'more_cost_effective_drug_available', dtpType: 'Cost', drn: 'Adherence' },
            { name: 'Cannot afford drug', ruleType: 'cannot_afford_drug', dtpType: 'Cost', drn: 'Adherence' },
        ],
        "Product Quality": [
            { name: 'Product Quality Defect', ruleType: 'product_quality_defect', dtpType: 'Product Quality Defect', drn: 'Product Quality' },
        ]
    };

    // Derived filtered findings
    const filteredFindings = useMemo(() => {
        return (analysisResults?.findings || []).filter(f =>
            filterSeverity === 'all' || f.severity?.toLowerCase() === filterSeverity.toLowerCase()
        );
    }, [analysisResults, filterSeverity]);

    // DTP Type colors for styling
    const getDTPTypeColor = (dtpType) => {
        const colors = {
            'Unnecessary Drug Therapy': 'bg-red-100 text-red-800 border-red-200',
            'Needs Additional Drug Therapy': 'bg-blue-100 text-blue-800 border-blue-200',
            'Low Dose': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'High Dose': 'bg-orange-100 text-orange-800 border-orange-200',
            'Ineffective Drug Therapy': 'bg-purple-100 text-purple-800 border-purple-200',
            'ADE': 'bg-red-100 text-red-800 border-red-200',
            'Non-Adherence': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'Cost': 'bg-gray-100 text-gray-800 border-gray-200',
            'Needs additional monitoring': 'bg-pink-100 text-pink-800 border-pink-200',
            'Product Quality Defect': 'bg-green-100 text-green-800 border-green-200'
        };
        return colors[dtpType] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Get user ID from JWT token
    const getUserIdFromToken = () => {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('pharmacare_token');
            if (!token) return null;

            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            const userId = payload.userId || payload.user_id || payload.sub || payload.id;
            return userId;
        } catch (error) {
            console.error('Error parsing JWT token:', error);
            return null;
        }
    };

    // Get user ID from session or localStorage
    const getUserIdFromSession = () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    if (user.id) return user.id;
                    if (user.userId) return user.userId;
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }

            const sessionUser = sessionStorage.getItem('user');
            if (sessionUser) {
                try {
                    const user = JSON.parse(sessionUser);
                    if (user.id || user.userId) return user.id || user.userId;
                } catch (e) {
                    console.error('Error parsing session data:', e);
                }
            }

            const authData = localStorage.getItem('auth');
            if (authData) {
                try {
                    const auth = JSON.parse(authData);
                    if (auth.user && (auth.user.id || auth.user.userId)) {
                        return auth.user.id || auth.user.userId;
                    }
                } catch (e) {
                    console.error('Error parsing auth data:', e);
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return null;
        }
    };

    // Initialize component
    useEffect(() => {
        const initializeComponent = async () => {
            if (!patientCode) {
                setAuthError('Patient code is required');
                return;
            }

            try {
                let currentUserId = getUserIdFromToken();
                if (!currentUserId) currentUserId = getUserIdFromSession();

                if (!currentUserId) {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) currentUserId = user.id;
                    } catch (authError) {
                        console.log('Supabase auth not available:', authError.message);
                    }
                }

                if (!currentUserId) {
                    setAuthError('Please log in to use DRN Assessment.');
                    return;
                }

                setUserId(currentUserId);
                setAuthError(null);
                await loadPatientData();
                await fetchClinicalRules();
            } catch (error) {
                console.error('Error initializing:', error);
                setAuthError('Failed to initialize. Please refresh.');
            }
        };

        initializeComponent();
    }, [patientCode]);

    // Fetch assessments when both IDs are available
    useEffect(() => {
        if (patientId && userId) fetchAssessments();
    }, [patientId, userId]);

    const loadPatientData = async () => {
        try {
            const res = await api.get(`/patients/code/${patientCode}`);

            if (res.success && res.patient) {
                setPatientData(res.patient);
                setPatientId(res.patient.id);
                if (res.patient.labs) setLabs(res.patient.labs);

                // Fetch Medications
                const mRes = await api.get(`/medication-history/patient/${patientCode}`);
                setMedications(mRes.success ? mRes.medications : (res.patient.medication_history || []));
            } else {
                setAuthError(`Patient not found: ${patientCode}`);
                return;
            }
        } catch (error) {
            console.error('Error loading patient:', error);
            setAuthError('Failed to load patient data.');
        }
    };

    const fetchClinicalRules = async () => {
        try {
            const res = await api.get('/clinical-rules');
            if (res.success && res.rules) {
                setClinicalRules(res.rules);
                const rulesByType = {};
                res.rules.forEach(rule => {
                    if (!rulesByType[rule.rule_type]) rulesByType[rule.rule_type] = [];
                    rulesByType[rule.rule_type].push(rule);
                });
                setActiveRules(rulesByType);
            }
        } catch (error) {
            console.error('Error fetching rules:', error);
        }
    };

    const fetchAssessments = async () => {
        if (!patientCode || !userId) return;

        setIsLoading(true);
        try {
            const res = await api.get(`/assessments/patient/${patientCode}`);
            if (res.success) {
                setAssessments(res.assessments || []);
            } else {
                setAssessments([]);
            }
        } catch (error) {
            console.error('Error fetching assessments:', error);
            setAssessments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const runCdssAnalysis = async () => {
        setIsAnalyzing(true);

        try {
            if (!patientData) await loadPatientData();
            if (!patientData) throw new Error('No patient data');

            const facts = mapPatientToFacts(patientData, medications);
            const triggeredRules = [];
            const findings = [];

            clinicalRules.forEach(rule => {
                try {
                    const isTriggered = evaluateRule(rule, facts);

                    if (isTriggered) {
                        triggeredRules.push(rule);

                        let message = rule.rule_name;
                        let recommendation = '';
                        let severity = rule.severity || 'moderate';

                        if (rule.rule_action) {
                            try {
                                const action = typeof rule.rule_action === 'string'
                                    ? JSON.parse(rule.rule_action)
                                    : rule.rule_action;

                                message = action.message || rule.rule_name;
                                recommendation = action.recommendation || getDefaultRecommendation(rule.rule_type);
                                severity = action.severity || rule.severity || 'moderate';
                            } catch (e) {
                                recommendation = getDefaultRecommendation(rule.rule_type);
                            }
                        } else {
                            recommendation = getDefaultRecommendation(rule.rule_type);
                        }

                        // Map rule to DRN category
                        let drnCategory = 'Safety';
                        let causeName = rule.rule_name;
                        let dtpType = '';

                        // Find matching category and DTP type
                        for (const [category, data] of Object.entries(drnCategories)) {
                            if (data.ruleTypes.includes(rule.rule_type)) {
                                drnCategory = category;
                                const categoryCauses = menuItemsData[category] || [];
                                const matchingCause = categoryCauses.find(c => c.ruleType === rule.rule_type);
                                if (matchingCause) {
                                    causeName = matchingCause.name;
                                    dtpType = matchingCause.dtpType;
                                }
                                break;
                            }
                        }

                        findings.push({
                            rule_id: rule.id,
                            rule_type: rule.rule_type,
                            rule_name: rule.rule_name,
                            category: drnCategory,
                            cause: causeName,
                            dtpType: dtpType,
                            message: message,
                            recommendation: recommendation,
                            severity: severity,
                            medications: facts.medications?.filter(med =>
                                message.toLowerCase().includes(med.toLowerCase()) ||
                                recommendation.toLowerCase().includes(med.toLowerCase())
                            ) || [],
                            timestamp: new Date().toISOString(),
                            evidence: rule.rule_description || '',
                            original_rule_name: rule.rule_name,
                            original_rule_type: rule.rule_type,
                            drn: drnCategory
                        });
                    }
                } catch (ruleError) {
                    console.error(`Error evaluating rule ${rule.rule_name}:`, ruleError);
                }
            });

            const findingsByCategory = {};
            Object.keys(drnCategories).forEach(category => {
                findingsByCategory[category] = findings.filter(f => f.category === category);
            });

            const analysisResult = {
                summary: findings.length > 0
                    ? `CDSS analysis detected ${findings.length} drug-related problems`
                    : "No drug-related problems detected",
                findings: findings,
                findingsByCategory: findingsByCategory,
                timestamp: new Date().toISOString(),
                patientCode: patientCode,
                analyzedAt: new Date().toISOString(),
                totalFindings: findings.length,
                metadata: {
                    rulesEvaluated: clinicalRules.length,
                    rulesTriggered: triggeredRules.length,
                    patientFacts: facts,
                    categoriesAnalyzed: Object.keys(findingsByCategory).filter(cat => findingsByCategory[cat].length > 0)
                }
            };

            setAnalysisResults(analysisResult);

        } catch (error) {
            console.error('Error in CDSS analysis:', error);
            setAnalysisResults({
                summary: "Analysis failed",
                findings: [],
                timestamp: new Date().toISOString(),
                patientCode: patientCode,
                analyzedAt: new Date().toISOString(),
                totalFindings: 0,
                error: error.message
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getDefaultRecommendation = (ruleType) => {
        const recommendations = {
            'duplicate_therapy': 'Review medication list for duplicate therapy and consider discontinuing redundant medications.',
            'no_medical_indication': 'Verify medical indication for the medication.',
            'nondrug_therapy_appropriate': 'Consider non-drug therapy as primary treatment option if indicated.',
            'addiction_or_recreational_medicine_use': 'Assess for substance abuse or recreational medicine use and consider appropriate interventions.',
            'treating_avoidable_ade': 'Review ADE management and consider alternative treatments.',
            'prophylaxis_needed': 'Consider prophylactic therapy based on patient risk factors.',
            'untreated_condition': 'Address untreated medical condition with appropriate therapy.',
            'synergistic_therapy_needed': 'Assess the need for synergistic therapy for the medical condition.',
            'low_dose': 'Review dose based on patient characteristics and consider adjustment.',
            'less_frequent': 'Adjust the less frequent dose for optimal therapeutic effect.',
            'short_duration': 'Review the shorter treatment duration and consider continuation if appropriate.',
            'improper_storage': 'Ensure proper storage conditions are maintained.',
            'high_dose': 'Reduce dose to minimize toxicity risk.',
            'high_frequent': 'Adjust the high frequency dose for optimal therapeutic effect.',
            'longer_duration': 'Review the longer treatment duration and consider discontinuation if appropriate.',
            'dose_titration_slow_or_fast': 'Adjust dose titration based on patient response.',
            'more_effective_drug_available': 'Consider alternative therapy due to ineffectiveness.',
            'condition_refractory_to_drug': 'Review treatment approach for refractory condition.',
            'dosage_form_inappropriate': 'Consider alternative dosage form for better efficacy.',
            'undesirable_effect_ade_or_se': 'Manage adverse event or side effect and consider alternative medication.',
            'unsafe_drug_contraindication_or_caution': 'Identify and manage contraindication or caution and consider alternative medication.',
            'allergic_reaction': 'Identify and manage allergic reaction.',
            'di_increase_dose': 'Monitor for drug interaction that result in dose increase.',
            'di_decrease_dose': 'Monitor for drug interaction that result in dose decrease.',
            'di_linked_to_ade': 'Monitor for ADE risk from drug interaction and consider alternative medication.',
            'incorrect_administration_decrease_dose_or_efficacy': 'Review medication administration technique and provide patient training.',
            'incorrect_administration_linked_to_ade': 'Review medication administration technique to prevent ADEs.',
            'patient_does_not_understand_instructions': 'Provide patient education on proper medication use.',
            'cannot_swallow_or_administer_drug': 'Review medication administration and provide alternative options to administer the drug.',
            'need_monitoring_to_rule_out_effectiveness': 'Monitor drug therapy effectiveness with appropriate parameter.',
            'need_monitoring_to_rule_out_safety': 'Monitor drug therapy safety with appropriate parameter.',
            'patient_prefers_not_to_take_drug': 'Counsel patient to enhance medication adherence or concordance.',
            'patient_forgets_to_take_drug': 'Provide patient education and consider adherence aids.',
            'drug_not_available': 'Address drug availability issues with alternatives.',
            'more_cost_effective_drug_available': 'Review medication costs and consider cost-effective alternatives.',
            'cannot_afford_drug': 'Review medication costs and consider alternative option like health insurance coverage.',
            'product_quality_defect': 'Verify quality of the medication by physical inspection.',
        };
        return recommendations[ruleType] || 'Review and consider appropriate clinical action.';
    };

    const handleCauseSelection = (causeName) => {
        setSelectedCauses(prev =>
            prev.includes(causeName)
                ? prev.filter(item => item !== causeName)
                : [...prev, causeName]
        );
    };

    const handleWriteUpChange = (causeName, field, value) => {
        setWriteUps(prev => ({
            ...prev,
            [causeName]: {
                ...prev[causeName],
                [field]: value
            }
        }));
    };

    const saveAssessment = async (causeName) => {
        if (!userId || !patientData || !patientId) {
            console.error('Missing context:', { userId, patientData: !!patientData, patientId });
            alert('User or Patient data not fully loaded. Please refresh the page.');
            return;
        }

        if (!selectedCategory || !causeName) {
            alert('Please select a category and cause');
            return;
        }

        const causeDetails = menuItemsData[selectedCategory]?.find(c => c.name === causeName);
        const writeUp = writeUps[causeName];

        if (!causeDetails) {
            console.error('Missing cause details for:', causeName);
            alert('Internal Error: Could not retrieve cause details.');
            return;
        }

        if (!writeUp?.specificCase || !writeUp?.medicalCondition || !writeUp?.medication) {
            alert('Please fill all required fields: Specific Case, Medical Condition, and Medication');
            return;
        }

        try {
            // Map UI status to DB status
            let dbStatus = 'active';
            if (writeUp.status === 'Resolved') dbStatus = 'resolved';
            else if (writeUp.status === 'Identified' || writeUp.status === 'Unresolved') dbStatus = 'active';

            const assessmentData = {
                patient_id: patientId,
                patient_code: patientCode,
                user_id: userId,
                category: selectedCategory,
                cause_name: causeName,
                rule_type: causeDetails.ruleType,
                dtp_type: causeDetails.dtpType,
                specific_case: writeUp.specificCase,
                medical_condition: writeUp.medicalCondition,
                medication: writeUp.medication,
                drn: causeDetails.drn,
                status: dbStatus
            };

            let result;

            if (editId !== null) {
                result = await api.put(`/assessments/drn/${editId}`, assessmentData);
            } else {
                result = await api.post('/assessments/drn', assessmentData);
            }

            if (result.success) {
                await fetchAssessments();
                setSelectedCauses([]);
                setWriteUps({});
                setEditId(null);
                alert(`Assessment ${editId !== null ? 'updated' : 'saved'} successfully!`);
            } else {
                throw new Error(result.error || 'Failed to save');
            }

        } catch (error) {
            console.error('Error saving assessment:', error);
            const errorMessage = error.error || error.response?.data?.error || error.message || JSON.stringify(error);
            alert(`Error ${editId !== null ? 'updating' : 'saving'} assessment: ${errorMessage}`);
        }
    };

    const handleEdit = (assessment) => {
        setEditId(assessment.id);
        setSelectedCategory(assessment.category);
        setSelectedCauses([assessment.cause_name]);

        // Map DB status back to UI status
        let uiStatus = 'Identified';
        if (assessment.status === 'resolved' || assessment.status === 'Resolved') uiStatus = 'Resolved';
        else if (assessment.status === 'active' || assessment.status === 'Active') uiStatus = 'Identified';

        setWriteUps({
            [assessment.cause_name]: {
                specificCase: assessment.specific_case,
                medicalCondition: assessment.medical_condition,
                medication: assessment.medication,
                status: uiStatus
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteAssessment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assessment?')) return;

        try {
            const result = await api.delete(`/assessments/drn/${id}`);

            if (result.success) {
                setAssessments(assessments.filter(ass => ass.id !== id));
                alert('Assessment deleted successfully!');
            } else {
                throw new Error(result.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting assessment:', error);
            alert('Error deleting assessment: ' + error.message);
        }
    };

    const handleReviewFinding = (finding) => {
        setSelectedCategory(finding.category);
        setSelectedCauses([finding.cause]);

        setWriteUps({
            [finding.cause]: {
                specificCase: `CDSS Rule: ${finding.original_rule_name || finding.rule_name}`,
                medicalCondition: patientData?.diagnosis || 'To be specified',
                medication: finding.medications?.join(', ') || 'To be specified',
                status: 'Identified'
            }
        });

        setEditId(null);

        setTimeout(() => {
            document.getElementById('assessment-form')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'moderate': return 'bg-yellow-500 text-white';
            case 'low': return 'bg-blue-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getDisplayStatus = (status) => {
        if (!status) return 'Active';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    if (authError) {
        return (
            <div className="bg-white p-6 rounded-lg shadow border border-red-200">
                <div className="text-center text-red-600">
                    <h3 className="text-xl font-bold mb-2">Authentication Error</h3>
                    <p className="text-base">{authError}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded text-base">Retry</button>
                </div>
            </div>
        );
    }

    if (!patientId || !userId) {
        return (
            <div className="bg-white p-8 rounded-lg shadow text-center">
                <FaSpinner className="animate-spin text-3xl text-blue-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Loading patient data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-3 md:p-6 overflow-x-hidden max-w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-blue-100 p-2 md:p-3 rounded-full flex-shrink-0">
                        <FaStethoscope className="text-blue-600 text-lg md:text-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">DRN Assessment</h2>
                        <p className="text-xs md:text-base text-gray-600 flex items-center gap-2 truncate">
                            <span>Patient:</span>
                            <span className="font-semibold bg-blue-50 px-2 py-1 rounded text-xs md:text-sm">{patientCode}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* CDSS Analysis Section */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-6 mb-4 md:mb-8 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <FaDatabase className="text-blue-600" />
                        CDSS Analysis
                    </h3>
                    <div className="flex gap-2">
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 bg-white"
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="moderate">Moderate</option>
                            <option value="low">Low</option>
                        </select>
                        <button
                            onClick={runCdssAnalysis}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 md:px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition text-sm flex-shrink-0"
                        >
                            <FaSync className={isAnalyzing ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Run Analysis</span>
                        </button>
                    </div>
                </div>

                {isAnalyzing ? (
                    <div className="text-center py-8">
                        <FaSpinner className="animate-spin text-3xl text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-blue-700 font-medium">Analyzing patient data...</p>
                    </div>
                ) : analysisResults ? (
                    <div className="space-y-4">
                        <div className="p-3 bg-white border border-blue-200 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">{analysisResults.summary}</span>
                            <span className="text-xs text-gray-400 font-medium">Last Scan: {new Date(analysisResults.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {filteredFindings.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredFindings.map((finding, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getSeverityColor(finding.severity)}`}>
                                                {finding.severity}
                                            </span>
                                            <button
                                                onClick={() => handleReviewFinding(finding)}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                title="Add to Assessment"
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>
                                        <h4 className="font-bold text-sm text-gray-800 mb-1">{finding.cause}</h4>
                                        <p className="text-xs text-gray-600 leading-relaxed mb-3">{finding.message}</p>
                                        <div className="flex flex-wrap gap-1">
                                            <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-500 font-bold uppercase">{finding.drn}</span>
                                            {finding.dtpType && <span className="text-[9px] bg-indigo-50 px-2 py-0.5 rounded-md text-indigo-500 font-bold uppercase">{finding.dtpType}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-white border border-dashed border-blue-200 rounded-lg">
                        <p className="text-gray-500 text-sm mb-4">Run analysis to detect drug-related problems.</p>
                        <button
                            onClick={runCdssAnalysis}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition text-sm mx-auto"
                        >
                            <FaDatabase />
                            Run Analysis
                        </button>
                    </div>
                )}
            </div>

            {/* Categories Selection - Visual Cards */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Object.entries(drnCategories).map(([cat, data]) => {
                        const isSelected = selectedCategory === cat;
                        const colorClasses = {
                            blue: isSelected ? 'bg-blue-500 border-blue-600' : 'bg-blue-50 border-blue-200 hover:bg-blue-100',
                            teal: isSelected ? 'bg-teal-500 border-teal-600' : 'bg-teal-50 border-teal-200 hover:bg-teal-100',
                            yellow: isSelected ? 'bg-yellow-500 border-yellow-600' : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
                            red: isSelected ? 'bg-red-500 border-red-600' : 'bg-red-50 border-red-200 hover:bg-red-100',
                            orange: isSelected ? 'bg-orange-500 border-orange-600' : 'bg-orange-50 border-orange-200 hover:bg-orange-100',
                            purple: isSelected ? 'bg-purple-500 border-purple-600' : 'bg-purple-50 border-purple-200 hover:bg-purple-100',
                            pink: isSelected ? 'bg-pink-500 border-pink-600' : 'bg-pink-50 border-pink-200 hover:bg-pink-100',
                            indigo: isSelected ? 'bg-indigo-500 border-indigo-600' : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
                            green: isSelected ? 'bg-green-500 border-green-600' : 'bg-green-50 border-green-200 hover:bg-green-100',
                        };
                        const iconColorClasses = {
                            blue: isSelected ? 'text-white' : 'text-blue-600',
                            teal: isSelected ? 'text-white' : 'text-teal-600',
                            yellow: isSelected ? 'text-white' : 'text-yellow-600',
                            red: isSelected ? 'text-white' : 'text-red-600',
                            orange: isSelected ? 'text-white' : 'text-orange-600',
                            purple: isSelected ? 'text-white' : 'text-purple-600',
                            pink: isSelected ? 'text-white' : 'text-pink-600',
                            indigo: isSelected ? 'text-white' : 'text-indigo-600',
                            green: isSelected ? 'text-white' : 'text-green-600',
                        };

                        return (
                            <button
                                key={cat}
                                onClick={() => { setSelectedCategory(cat); setSelectedCauses([]); setWriteUps({}); setEditId(null); }}
                                className={`p-5 rounded-xl border-2 text-center transition-all duration-300 group flex flex-col items-center justify-center gap-3 ${colorClasses[data.color] || colorClasses.blue} ${isSelected ? 'shadow-lg transform scale-105' : 'shadow-sm hover:shadow-md'}`}
                            >
                                <div className={`p-3 rounded-full ${isSelected ? 'bg-white/20' : 'bg-white'} transition-all group-hover:scale-110`}>
                                    <data.icon className={`text-3xl ${iconColorClasses[data.color] || iconColorClasses.blue} transition-transform`} />
                                </div>
                                <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-700'}`}>{cat}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Causes and Form Section */}
            {selectedCategory && (
                <div className="bg-gray-50 rounded-lg p-3 md:p-6 mb-4 md:mb-8 border border-gray-200" id="assessment-form">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">{selectedCategory} Causes</h3>
                        <div className="text-xs text-gray-400 font-bold uppercase">{selectedCauses.length} Selected</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {menuItemsData[selectedCategory]?.map(c => (
                            <button
                                key={c.name}
                                onClick={() => handleCauseSelection(c.name)}
                                className={`p-4 text-left border rounded-lg text-sm transition-all flex items-center justify-between ${selectedCauses.includes(c.name) ? 'bg-white border-blue-500 font-bold shadow-md text-blue-800' : 'bg-white/60 border-gray-200 hover:border-blue-300 hover:bg-white text-gray-700'}`}
                            >
                                <span className="flex-1 pr-4">{c.name}</span>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${selectedCauses.includes(c.name) ? 'bg-blue-600 border-blue-600' : 'bg-gray-100 border-gray-300'}`}>
                                    {selectedCauses.includes(c.name) && <FaCheckCircle className="text-white text-xs" />}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Assessment Forms */}
                    <div className="space-y-6">
                        {selectedCauses.map(cause => (
                            <div key={cause} className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
                                <h5 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b">{cause} Details</h5>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Medical Condition *</label>
                                        <textarea
                                            value={writeUps[cause]?.medicalCondition || ''}
                                            onChange={e => handleWriteUpChange(cause, 'medicalCondition', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                            placeholder="Primary Diagnosis/Condition..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Medication *</label>
                                        <textarea
                                            value={writeUps[cause]?.medication || ''}
                                            onChange={e => handleWriteUpChange(cause, 'medication', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                            placeholder="Drug name & dosage..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Specific Case *</label>
                                        <textarea
                                            value={writeUps[cause]?.specificCase || ''}
                                            onChange={e => handleWriteUpChange(cause, 'specificCase', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                            placeholder="Details of the clinical finding..."
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {['Identified', 'Resolved', 'Unresolved'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleWriteUpChange(cause, 'status', status)}
                                                className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${writeUps[cause]?.status === status ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => saveAssessment(cause)}
                                        disabled={isLoading}
                                        className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                        {editId !== null ? 'Update Assessment' : 'Save Assessment'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Assessment Archive Section */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">Assessment Records</h3>
                        <p className="text-xs text-gray-500 mt-1">Historical decision log ({assessments.length})</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto" />
                        <p className="mt-4 text-gray-500 font-medium text-sm">Loading records...</p>
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-lg border border-dashed border-gray-200">
                        <FaFileAlt className="text-4xl text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium text-sm">No assessments recorded</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assessments.map(ass => (
                            <div key={ass.id} className="p-4 md:p-6 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                        <span className="font-bold text-gray-900 text-lg">{ass.cause_name}</span>
                                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${ass.status === 'Resolved' || ass.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {getDisplayStatus(ass.status)}
                                        </span>
                                        <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded">{ass.category}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                                            <FaNotesMedical className="text-gray-400 mt-0.5" />
                                            <div>
                                                <div className="text-xs uppercase text-gray-400 mb-0.5">Condition</div>
                                                {ass.medical_condition}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg">
                                            <FaPills className="text-gray-400 mt-0.5" />
                                            <div>
                                                <div className="text-xs uppercase text-gray-400 mb-0.5">Medication</div>
                                                {ass.medication}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 italic">
                                        "{ass.specific_case}"
                                    </div>
                                </div>
                                <div className="flex gap-2 self-end lg:self-center">
                                    <button
                                        onClick={() => handleEdit(ass)}
                                        className="p-3 bg-white border border-gray-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                                        title="Edit Record"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAssessment(ass.id)}
                                        className="p-3 bg-white border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                        title="Delete Record"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DRNAssessment;
