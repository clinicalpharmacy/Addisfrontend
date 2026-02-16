import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { mapPatientToFacts, evaluateRule } from '../CDSS/RuleEngine';
import {
    FaStethoscope, FaEdit, FaDatabase, FaChevronUp, FaChevronDown,
    FaPills, FaFlask, FaUserMd, FaChartLine, FaDownload, FaSync,
    FaExclamationTriangle, FaCheckCircle, FaSpinner, FaSearch,
    FaHeartbeat, FaClipboardCheck, FaShieldAlt, FaUserCheck,
    FaMoneyBillWave, FaCapsules, FaTrash, FaPlus, FaFilter,
    FaSortAmountDown, FaFileMedical, FaClipboardList, FaRegCopy,
    FaCog, FaBell, FaFileAlt, FaVial, FaBalanceScale, FaSyringe,
    FaTint, FaUserInjured, FaHistory, FaNotesMedical, FaPrescription,
    FaMicroscope, FaBox, FaClock, FaProcedures, FaUser, FaExclamationCircle
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
            const { data: patient, error } = await supabase
                .from('patients')
                .select('*')
                .eq('patient_code', patientCode)
                .single();

            if (error) {
                setAuthError(`Patient not found: ${patientCode}`);
                return;
            }

            setPatientData(patient);
            setPatientId(patient.id);

            const { data: medicationsData } = await supabase
                .from('medication_history')
                .select('*')
                .eq('patient_code', patientCode)
                .eq('is_active', true);

            setMedications(medicationsData || patient.medication_history || []);

            if (patient.labs) setLabs(patient.labs);
        } catch (error) {
            console.error('Error loading patient:', error);
            setAuthError('Failed to load patient data.');
        }
    };

    const fetchClinicalRules = async () => {
        try {
            const { data, error } = await supabase
                .from('clinical_rules')
                .select('*')
                .eq('is_active', true)
                .order('rule_type', { ascending: true });

            if (error) return;

            setClinicalRules(data || []);

            const rulesByType = {};
            data.forEach(rule => {
                if (!rulesByType[rule.rule_type]) rulesByType[rule.rule_type] = [];
                rulesByType[rule.rule_type].push(rule);
            });
            setActiveRules(rulesByType);
        } catch (error) {
            console.error('Error fetching rules:', error);
        }
    };

    const fetchAssessments = async () => {
        if (!patientId || !userId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('drn_assessments')
                .select('*')
                .eq('patient_code', patientCode)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching assessments:', error);
                setAssessments([]);
                return;
            }

            setAssessments(data || []);
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
        if (!userId || !patientData) {
            alert('User ID or patient data not available');
            return;
        }

        if (!selectedCategory || !causeName) {
            alert('Please select a category and cause');
            return;
        }

        const causeDetails = menuItemsData[selectedCategory]?.find(c => c.name === causeName);
        const writeUp = writeUps[causeName];

        if (!writeUp?.specificCase || !writeUp?.medicalCondition || !writeUp?.medication) {
            alert('Please fill all required fields: Specific Case, Medical Condition, and Medication');
            return;
        }

        try {
            const assessmentData = {
                patient_id: patientData.id,
                patient_code: patientCode,
                user_id: userId,
                category: selectedCategory,
                cause_name: causeName,
                rule_type: causeDetails?.ruleType,
                dtp_type: causeDetails?.dtpType,
                specific_case: writeUp.specificCase,
                medical_condition: writeUp.medicalCondition,
                medication: writeUp.medication,
                drn: causeDetails?.drn,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            let result;

            if (editId !== null) {
                const { data, error } = await supabase
                    .from('drn_assessments')
                    .update({
                        ...assessmentData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editId)
                    .eq('user_id', userId)
                    .select();

                if (error) throw error;
                result = data[0];
            } else {
                const { data, error } = await supabase
                    .from('drn_assessments')
                    .insert([assessmentData])
                    .select();

                if (error) throw error;
                result = data[0];
            }

            await fetchAssessments();
            setSelectedCauses([]);
            setWriteUps({});
            setEditId(null);
            alert(`Assessment ${editId !== null ? 'updated' : 'saved'} successfully!`);

        } catch (error) {
            console.error('Error saving assessment:', error);
            alert(`Error ${editId !== null ? 'updating' : 'saving'} assessment: ${error.message}`);
        }
    };

    const handleEdit = (assessment) => {
        setEditId(assessment.id);
        setSelectedCategory(assessment.category);
        setSelectedCauses([assessment.cause_name]);

        setWriteUps({
            [assessment.cause_name]: {
                specificCase: assessment.specific_case,
                medicalCondition: assessment.medical_condition,
                medication: assessment.medication
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteAssessment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assessment?')) return;

        try {
            const { error } = await supabase
                .from('drn_assessments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setAssessments(assessments.filter(ass => ass.id !== id));
            alert('Assessment deleted successfully!');
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
                medication: finding.medications?.join(', ') || 'To be specified'
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
        switch (severity) {
            case 'critical': return 'bg-red-500 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'moderate': return 'bg-yellow-500 text-white';
            case 'low': return 'bg-blue-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Indication': 'bg-blue-100 text-blue-800 border-blue-200',
            'Dosage': 'bg-teal-100 text-teal-800 border-teal-200',
            'Rule out Ineffective Drug Therapy': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Contraindication or Caution or ADE or SE or Allergy': 'bg-red-100 text-red-800 border-red-200',
            'Drug Interaction': 'bg-orange-100 text-orange-800 border-orange-200',
            'Administration': 'bg-purple-100 text-purple-800 border-purple-200',
            'Monitoring': 'bg-pink-100 text-pink-800 border-pink-200',
            'Adherence': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'Product Quality': 'bg-green-100 text-green-800 border-green-200'
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getRuleTypeColor = (ruleType) => {
        const colors = {
            'duplicate_therapy': 'bg-blue-50 text-blue-700',
            'no_medical_indication': 'bg-blue-50 text-blue-700',
            'nondrug_therapy_appropriate': 'bg-blue-50 text-blue-700',
            'addiction_or_recreational_medicine_use': 'bg-blue-50 text-blue-700',
            'treating_avoidable_ade': 'bg-blue-50 text-blue-700',
            'prophylaxis_needed': 'bg-blue-50 text-blue-700',
            'untreated_condition': 'bg-blue-50 text-blue-700',
            'synergistic_therapy_needed': 'bg-teal-50 text-teal-700',
            'low_dose': 'bg-teal-50 text-teal-700',
            'less_frequent': 'bg-teal-50 text-teal-700',
            'short_duration': 'bg-teal-50 text-teal-700',
            'improper_storage': 'bg-teal-50 text-teal-700',
            'high_dose': 'bg-teal-50 text-teal-700',
            'high_frequent': 'bg-yellow-50 text-yellow-700',
            'longer_duration': 'bg-yellow-50 text-yellow-700',
            'dose_titration_slow_or_fast': 'bg-yellow-50 text-yellow-700',
            'more_effective_drug_available': 'bg-yellow-50 text-yellow-700',
            'condition_refractory_to_drug': 'bg-red-50 text-red-700',
            'dosage_form_inappropriate': 'bg-red-50 text-red-700',
            'undesirable_effect_ade_or_se': 'bg-red-50 text-red-700',
            'unsafe_drug_contraindication_or_caution': 'bg-red-50 text-red-700',
            'allergic_reaction': 'bg-orange-50 text-orange-700',
            'di_increase_dose': 'bg-orange-50 text-orange-700',
            'di_decrease_dose': 'bg-orange-50 text-orange-700',
            'di_linked_to_ade': 'bg-orange-50 text-orange-700',
            'incorrect_administration_decrease_dose_or_efficacy': 'bg-purple-50 text-purple-700',
            'incorrect_administration_linked_to_ade': 'bg-purple-50 text-purple-700',
            'patient_does_not_understand_instructions': 'bg-purple-50 text-purple-700',
            'cannot_swallow_or_administer_drug': 'bg-pink-50 text-pink-700',
            'need_monitoring_to_rule_out_effectiveness': 'bg-pink-50 text-pink-700',
            'need_monitoring_to_rule_out_safety': 'bg-pink-50 text-pink-700',
            'patient_prefers_not_to_take_drug': 'bg-indigo-50 text-indigo-700',
            'patient_forgets_to_take_drug': 'bg-indigo-50 text-indigo-700',
            'drug_not_available': 'bg-indigo-50 text-indigo-700',
            'more_cost_effective_drug_available': 'bg-indigo-50 text-indigo-700',
            'cannot_afford_drug': 'bg-green-50 text-green-700',
            'product_quality_defect': 'bg-green-50 text-green-700'
        };
        return colors[ruleType] || 'bg-gray-50 text-gray-700';
    };

    const filteredFindings = analysisResults?.findings?.filter(finding => {
        if (filterSeverity === 'all') return true;
        return finding.severity === filterSeverity;
    }) || [];

    if (authError) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-12">
                    <FaExclamationCircle className="text-4xl text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h3>
                    <p className="text-gray-600 mb-4">{authError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                    >
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    if (!patientId || !userId) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-12">
                    <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Initializing DRN Assessment...</p>
                </div>
            </div>
        );
    }

    return (
<<<<<<< HEAD
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-full w-fit">
                    <FaStethoscope className="text-white text-lg sm:text-xl" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">DRN Assessment</h2>
                    <p className="text-sm text-gray-500">9 Categories Drug Related Needs Assessment</p>
                </div>
            </div>

            {/* CDSS Analysis Section - RESTORED */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-6 border border-blue-200 max-w-full overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-blue-800 flex items-center gap-2">
                        <FaDatabase className="flex-shrink-0" /> CDSS Clinical Analysis
                    </h3>
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                    >
                        {showAnalysis ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                </div>

                {showAnalysis && (
                    <>
                        {isAnalyzing ? (
                            <div className="text-center py-8">
                                <FaSpinner className="animate-spin text-3xl sm:text-4xl text-blue-600 mx-auto mb-4" />
                                <p className="text-gray-600 text-sm sm:text-base">Running CDSS analysis...</p>
                            </div>
                        ) : analysisResults ? (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-3 sm:p-4 border shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-800 text-base sm:text-lg">Analysis Results</h4>
                                            <p className="text-sm sm:text-base font-medium mt-1 text-gray-700">
                                                {analysisResults.totalFindings > 0
                                                    ? `Clinical alerts discovered (${analysisResults.totalFindings})`
                                                    : 'No clinical alerts found'}
                                            </p>
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            <button
                                                onClick={runCdssAnalysis}
                                                className="w-fit sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2"
                                            >
                                                <FaSync /> Re-run
                                            </button>
=======
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 sm:p-6 md:p-8 border border-gray-100">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-2xl shadow-lg shadow-indigo-100 self-start sm:self-center">
                    <FaStethoscope className="text-white text-2xl" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">DRN Clinical Intelligence</h2>
                    <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-widest mt-0.5">Decision Review Network • CDSS Core</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">ID: {patientCode}</span>
                        <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">REF: {userId?.substring(0, 8)}</span>
                    </div>
                </div>
            </div>

            {/* CDSS Analysis Section - PREMIUM REVAMP */}
            <div className="mb-10 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-bl-full pointer-events-none" />

                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg shadow-md shadow-blue-100">
                                <FaDatabase className="text-white text-sm" />
                            </div>
                            Clinical Analysis
                        </h3>
                        <button
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className="bg-gray-50 p-2 rounded-xl text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-100 active:scale-90"
                        >
                            {showAnalysis ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                    </div>

                    {showAnalysis && (
                        <div className="space-y-6">
                            {isAnalyzing ? (
                                <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="relative inline-block mb-6">
                                        <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full"></div>
                                        <FaSpinner className="animate-spin text-5xl text-blue-600 relative z-10" />
                                    </div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Executing Diagnostics...</p>
                                </div>
                            ) : analysisResults ? (
                                <div className="animate-fadeIn">
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Analysis Status</p>
                                            <h4 className={`text-xl font-black tracking-tight ${analysisResults.totalFindings > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                                                {analysisResults.summary}
                                            </h4>
>>>>>>> ceb1624 (email verification)
                                        </div>
                                        <button
                                            onClick={runCdssAnalysis}
                                            className="w-full lg:w-auto px-6 py-3 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-xl font-black text-sm transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 group"
                                        >
                                            <FaSync className="text-xs group-hover:rotate-180 transition-transform duration-500" /> RE-RUN SCAN
                                        </button>
                                    </div>

<<<<<<< HEAD

                                    {/* Findings display */}
=======
>>>>>>> ceb1624 (email verification)
                                    {filteredFindings.length > 0 ? (
                                        <div className="grid gap-4">
                                            {filteredFindings.map((finding, idx) => (
<<<<<<< HEAD
                                                <div key={idx} className="p-3 sm:p-4 border rounded-lg hover:shadow-md transition bg-gray-50/30">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <span className="font-bold text-gray-800 text-sm sm:text-base break-words flex-1">
                                                                    {finding.cause}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                                                    Just now
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2 leading-relaxed break-words">{finding.message}</p>
                                                        </div>
=======
                                                <div key={idx} className="p-5 sm:p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative">
                                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                <span className="font-black text-gray-900 text-lg tracking-tight">{finding.cause}</span>
                                                                <span className={`px-2.5 py-1 ${getSeverityColor(finding.severity)} text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm`}>
                                                                    {finding.severity}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">{finding.message}</p>
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <span className={`px-2.5 py-1 ${getCategoryColor(finding.category)} text-[10px] font-black rounded-lg border border-current/10 truncate`}>
                                                                    {finding.category}
                                                                </span>
                                                                {finding.dtpType && (
                                                                    <span className={`px-2.5 py-1 ${getDTPTypeColor(finding.dtpType)} text-[10px] font-black rounded-lg border border-current/10 truncate`}>
                                                                        DTP: {finding.dtpType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleReviewFinding(finding)}
                                                            className="w-full md:w-auto px-5 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 active:scale-95"
                                                        >
                                                            <FaEdit className="text-xs" /> ADD TO LOG
                                                        </button>
>>>>>>> ceb1624 (email verification)
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
<<<<<<< HEAD
                                        <div className="text-center py-8">
                                            <FaCheckCircle className="text-3xl sm:text-4xl text-green-500 mx-auto mb-3" />
                                            <p className="text-gray-600 text-sm sm:text-base">No issues found matching current filter</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <FaDatabase className="text-3xl sm:text-4xl text-blue-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-sm sm:text-base mb-4">Run CDSS clinical analysis to detect drug-related problems</p>
                                <button
                                    onClick={runCdssAnalysis}
                                    className="w-fit sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-md flex items-center justify-center gap-2 mx-auto"
                                >
                                    <FaDatabase /> Run Analysis
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 9 Category Selection */}
            <div className="mb-8" id="assessment-form">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">1. Select DRN Category</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
=======
                                        <div className="text-center py-16 bg-green-50/30 rounded-2xl border border-dashed border-green-200">
                                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FaCheckCircle className="text-2xl text-green-600" />
                                            </div>
                                            <p className="text-green-800 font-black uppercase tracking-widest text-sm">System Clearance: No Issues Detected</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <FaDatabase className="text-3xl text-blue-400" />
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 mb-2">Deep Diagnosis Required</h4>
                                    <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">Initialize CDSS heuristics to identify potential drug-related problems and clinical inconsistencies.</p>
                                    <button
                                        onClick={runCdssAnalysis}
                                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-blue-200 hover:scale-105 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                                    >
                                        <FaDatabase className="text-xs" /> INITIALIZE CORE SCAN
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 9 Category Selection Grid */}
            <div className="mb-12" id="assessment-form">
                <div className="px-1 mb-6">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Intelligence Matrix</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Select logic category for deep profiling</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
>>>>>>> ceb1624 (email verification)
                    {Object.entries(drnCategories).map(([category, catData]) => {
                        const Icon = catData.icon;
                        const ruleCount = catData.ruleTypes.reduce((count, ruleType) => {
                            return count + (activeRules[ruleType]?.length || 0);
                        }, 0);
                        const isSelected = selectedCategory === category;

                        return (
                            <button
                                key={category}
                                onClick={() => {
                                    setSelectedCategory(category);
                                    setSelectedCauses([]);
                                    setWriteUps({});
                                    setEditId(null);
                                }}
<<<<<<< HEAD
                                className={`group p-2.5 sm:p-4 rounded-2xl text-left transition-all duration-300 border h-full flex flex-col justify-between ${selectedCategory === category
                                    ? 'border-blue-500 bg-blue-50/50 text-blue-800 shadow-lg ring-2 ring-blue-100 transform sm:scale-[1.02]'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/5 text-gray-700 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-3 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${getCategoryColor(category)}`}>
                                        <Icon className="text-current text-lg sm:text-xl" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-sm sm:text-base leading-tight text-gray-800 break-words [overflow-wrap:anywhere]">{category}</div>
                                        <div className="text-[10px] sm:text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                                            <span className="inline-block w-1 h-1 rounded-full bg-gray-300"></span>
                                            {ruleCount} Rules
=======
                                className={`group p-5 rounded-2xl text-left transition-all duration-300 border relative overflow-hidden ${isSelected
                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50'
                                    : 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 text-gray-700'
                                    }`}
                            >
                                {!isSelected && (
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                                        <Icon className="text-4xl" />
                                    </div>
                                )}
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-3 rounded-xl transition-colors duration-300 ${isSelected ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-indigo-50'}`}>
                                        <Icon className={`text-xl ${isSelected ? 'text-white' : 'text-indigo-600'}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`font-black text-sm tracking-tight leading-tight ${isSelected ? 'text-white' : 'text-gray-900'} truncate`}>
                                            {category}
                                        </div>
                                        <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                                            {ruleCount} RULES • {menuItemsData[category]?.length || 0} CAUSES
>>>>>>> ceb1624 (email verification)
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Cause Selection and Form */}
            {selectedCategory && (
<<<<<<< HEAD
                <div className="mb-8 p-3 sm:p-6 border rounded-2xl bg-gray-50/50 max-w-full overflow-hidden">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800">
                        2. Select Causes for <span className="text-blue-600">{selectedCategory}</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
=======
                <div className="mb-12 p-5 sm:p-8 border border-gray-100 rounded-3xl bg-gray-50/50 animate-fadeIn">
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`p-2 rounded-lg ${getCategoryColor(selectedCategory)}`}>
                            {React.createElement(drnCategories[selectedCategory]?.icon || FaStethoscope, { className: 'text-sm' })}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">
                            {selectedCategory} <span className="text-gray-400 mx-2 text-sm">//</span> Causes
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
>>>>>>> ceb1624 (email verification)
                        {menuItemsData[selectedCategory]?.map(cause => {
                            const isSelected = selectedCauses.includes(cause.name);

                            return (
<<<<<<< HEAD
                                <label
                                    key={cause.name}
                                    className={`flex items-start gap-3 p-3 sm:p-4 border rounded-xl bg-white cursor-pointer transition-all ${isSelected
                                        ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleCauseSelection(cause.name)}
                                            className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="font-bold text-gray-800 text-sm sm:text-base break-words">{cause.name}</p>

                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {isSelected && cause.dtpType && (
                                                <span className={`px-2 py-0.5 text-[10px] sm:text-xs rounded font-medium ${getDTPTypeColor(cause.dtpType)}`}>
                                                    {cause.dtpType}
                                                </span>
                                            )}

                                            {ruleCount > 0 && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] sm:text-xs rounded font-medium">
                                                    {ruleCount} rules
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </label>
=======
                                <button
                                    key={cause.name}
                                    onClick={() => handleCauseSelection(cause.name)}
                                    className={`flex items-start gap-3 p-4 border rounded-xl transition-all duration-300 ${isSelected
                                        ? 'bg-white border-indigo-600 shadow-lg shadow-indigo-100'
                                        : 'bg-white/50 border-gray-100 hover:border-gray-300 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-100 border-gray-200'}`}>
                                        {isSelected && <FaCheckCircle className="text-white text-[10px]" />}
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className={`font-black tracking-tight text-sm ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{cause.name}</p>
                                        {isSelected && cause.dtpType && (
                                            <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-md ${getDTPTypeColor(cause.dtpType)}`}>
                                                {cause.dtpType}
                                            </span>
                                        )}
                                    </div>
                                </button>
>>>>>>> ceb1624 (email verification)
                            );
                        })}
                    </div>

                    {selectedCauses.map(causeName => {
                        const causeDetails = menuItemsData[selectedCategory]?.find(c => c.name === causeName);

                        return (
<<<<<<< HEAD
                            <div
                                key={causeName}
                                className="mb-6 p-4 sm:p-6 border rounded-2xl bg-white shadow-md border-blue-100 max-w-full overflow-hidden"
                            >
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                                    <h4 className="font-bold text-base sm:text-lg text-gray-800 break-words flex-1">
                                        {causeName}
                                    </h4>

                                    {causeDetails?.dtpType && (
                                        <span className={`w-fit px-3 py-1 text-xs sm:text-sm rounded-full font-medium ${getDTPTypeColor(causeDetails.dtpType)}`}>
                                            DTP Type: {causeDetails.dtpType}
=======
                            <div key={causeName} className="mb-6 p-6 sm:p-8 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/20 animate-slideIn">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                                    <div className="min-w-0">
                                        <h4 className="font-black text-xl text-gray-900 tracking-tight">{causeName}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Assessment Documentation</p>
                                    </div>
                                    {causeDetails?.dtpType && (
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm ${getDTPTypeColor(causeDetails.dtpType)}`}>
                                            DTP: {causeDetails.dtpType}
>>>>>>> ceb1624 (email verification)
                                        </span>
                                    )}
                                </div>

<<<<<<< HEAD
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Specific Case *
                                        </label>
                                        <textarea
                                            value={writeUps[causeName]?.specificCase || ''}
                                            onChange={e =>
                                                handleWriteUpChange(
                                                    causeName,
                                                    'specificCase',
                                                    e.target.value
                                                )
                                            }
                                            rows="2"
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="Describe the specific case..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Medical Condition *
                                        </label>
                                        <input
                                            type="text"
                                            value={writeUps[causeName]?.medicalCondition || ''}
                                            onChange={e =>
                                                handleWriteUpChange(
                                                    causeName,
                                                    'medicalCondition',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="e.g., Hypertension"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Medication *
                                        </label>
                                        <input
                                            type="text"
                                            value={writeUps[causeName]?.medication || ''}
                                            onChange={e =>
                                                handleWriteUpChange(
                                                    causeName,
                                                    'medication',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                            placeholder="e.g., Enalapril 10mg"
                                            required
=======
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specific Case</label>
                                        <input
                                            type="text"
                                            value={writeUps[causeName]?.specificCase || ''}
                                            onChange={e => handleWriteUpChange(causeName, 'specificCase', e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-300"
                                            placeholder="Environmental factors/Patient history..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Medical Condition</label>
                                        <input
                                            type="text"
                                            value={writeUps[causeName]?.medicalCondition || ''}
                                            onChange={e => handleWriteUpChange(causeName, 'medicalCondition', e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-300"
                                            placeholder="Primary Diagnosis..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Active Medication</label>
                                        <input
                                            type="text"
                                            value={writeUps[causeName]?.medication || ''}
                                            onChange={e => handleWriteUpChange(causeName, 'medication', e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-300"
                                            placeholder="Drug name & dosage..."
>>>>>>> ceb1624 (email verification)
                                        />
                                    </div>
                                </div>

<<<<<<< HEAD
                                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                                    <button
                                        onClick={() => saveAssessment(causeName)}
                                        className="w-fit sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <FaClipboardCheck /> {editId !== null ? 'Update Assessment' : 'Save Assessment'}
=======
                                <div className="flex flex-col sm:flex-row gap-3 mt-10">
                                    <button
                                        onClick={() => saveAssessment(causeName)}
                                        className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-[0.98]"
                                    >
                                        {editId !== null ? 'UPDATE LOG' : 'COMMIT ASSESSMENT'}
>>>>>>> ceb1624 (email verification)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedCauses(prev => prev.filter(c => c !== causeName));
                                            setWriteUps(prev => {
                                                const newWriteUps = { ...prev };
                                                delete newWriteUps[causeName];
                                                return newWriteUps;
                                            });
                                        }}
<<<<<<< HEAD
                                        className="w-fit sm:w-auto px-8 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
=======
                                        className="px-8 py-4 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all"
>>>>>>> ceb1624 (email verification)
                                    >
                                        DISCARD
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

<<<<<<< HEAD
            {/* Saved Assessments Section */}
            <div className="mt-8 border-t pt-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                        Saved Assessments <span className="text-gray-400 font-normal ml-1">({assessments.length})</span>
                    </h3>
                    <div className="flex items-center gap-4">
                        {assessments.length > 0 && (
                            <button
                                onClick={() => fetchAssessments()}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg transition-all"
                            >
                                <FaSync className={isLoading ? 'animate-spin' : ''} /> Refresh List
                            </button>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Loading your assessments...</p>
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                        <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
                            <FaNotesMedical className="text-3xl text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium tracking-tight">No assessments saved for this patient yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Select a category above to start an assessment.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cause & DTP Type</th>
                                        <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Specific Case</th>
                                        <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {assessments.map((assessment) => (
                                        <tr key={assessment.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getCategoryColor(assessment.category)}`}>
                                                    {assessment.category}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-800 text-sm">{assessment.cause_name}</div>
                                                <div className="mt-1">
                                                    <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${getDTPTypeColor(assessment.dtp_type)}`}>
                                                        {assessment.dtp_type || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 max-w-xs">
                                                <p className="text-sm text-gray-600 line-clamp-2">{assessment.specific_case}</p>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${assessment.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                                    assessment.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {assessment.status}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                                                {new Date(assessment.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEdit(assessment)}
                                                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAssessment(assessment.id)}
                                                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <FaTrash className="text-sm" />
                                                    </button>
=======
            {/* Saved Assessments - MOBILE OPTIMIZED CARDS */}
            <div className="mt-16">
                <div className="flex justify-between items-center mb-10 px-1">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Analysis Archive</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Historical decision log ({assessments.length})</p>
                    </div>
                    {assessments.length > 0 && (
                        <button
                            onClick={() => fetchAssessments()}
                            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-indigo-600 transition-all active:rotate-180 duration-500"
                        >
                            <FaSync className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <FaSpinner className="animate-spin text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retrieving Secure Records...</p>
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50/30 rounded-3xl border border-dashed border-gray-100">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
                            <FaFileAlt className="text-3xl text-gray-100" />
                        </div>
                        <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No entries in the archive</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Tablet/Desktop Table View - Hidden on Mobile */}
                        <div className="hidden md:block overflow-hidden rounded-3xl border border-gray-100 bg-white">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Focus Area</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Diagnosis/DTP</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Case Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Status</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {assessments.map((assessment) => (
                                        <tr key={assessment.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 text-sm tracking-tight">{assessment.category}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{assessment.cause_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-md w-fit bg-gray-100 text-gray-500`}>{assessment.dtp_type || 'STANDARD'}</span>
                                                    <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{assessment.medical_condition}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed max-w-[200px] font-medium">{assessment.specific_case}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${assessment.status === 'active' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                        assessment.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                            'bg-blue-50 text-blue-600 border border-blue-100'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full animate-pulse ${assessment.status === 'active' ? 'bg-amber-600' :
                                                            assessment.status === 'resolved' ? 'bg-emerald-600' : 'bg-blue-600'
                                                        }`} />
                                                    {assessment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleEdit(assessment)} className="p-2.5 bg-white shadow-sm border border-gray-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><FaEdit className="text-sm" /></button>
                                                    <button onClick={() => handleDeleteAssessment(assessment.id)} className="p-2.5 bg-white shadow-sm border border-gray-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><FaTrash className="text-sm" /></button>
>>>>>>> ceb1624 (email verification)
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

<<<<<<< HEAD
                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-4 max-w-full">
                            {assessments.map((assessment) => (
                                <div key={assessment.id} className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-2">
                                            <span className={`w-fit px-2 py-0.5 text-[9px] font-bold rounded-full ${getCategoryColor(assessment.category)}`}>
                                                {assessment.category}
                                            </span>
                                            <h4 className="font-bold text-gray-800 leading-tight break-words [overflow-wrap:anywhere] text-sm sm:text-base">{assessment.cause_name}</h4>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${assessment.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                            assessment.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
=======
                        {/* Mobile Card View - Hidden on Desktop */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {assessments.map((assessment) => (
                                <div key={assessment.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-transform">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{assessment.category}</span>
                                            <h4 className="font-black text-gray-900 tracking-tight truncate">{assessment.cause_name}</h4>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${assessment.status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
>>>>>>> ceb1624 (email verification)
                                            }`}>
                                            {assessment.status}
                                        </span>
                                    </div>
<<<<<<< HEAD

                                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Specific Case</p>
                                        <p className="text-sm text-gray-600 leading-relaxed break-words">{assessment.specific_case}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className={`w-fit px-2 py-0.5 text-[10px] rounded font-medium ${getDTPTypeColor(assessment.dtp_type)}`}>
                                                {assessment.dtp_type || 'N/A'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                                {new Date(assessment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(assessment)}
                                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold active:scale-95 transition-all"
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssessment(assessment.id)}
                                                className="p-2 bg-red-50 text-red-500 rounded-xl active:scale-95 transition-all"
                                            >
                                                <FaTrash />
                                            </button>
=======
                                    <div className="bg-gray-50 p-3 rounded-xl mb-4">
                                        <p className="text-[11px] text-gray-600 line-clamp-2 font-bold leading-tight italic">"{assessment.specific_case}"</p>
                                    </div>
                                    <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-50">
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tight">{assessment.dtp_type || 'STANDARD'}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(assessment)} className="p-2.5 bg-gray-50 text-indigo-600 rounded-xl active:bg-indigo-100"><FaEdit /></button>
                                            <button onClick={() => handleDeleteAssessment(assessment.id)} className="p-2.5 bg-gray-50 text-red-500 rounded-xl active:bg-red-100"><FaTrash /></button>
>>>>>>> ceb1624 (email verification)
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
<<<<<<< HEAD
                    </>
=======
                    </div>
>>>>>>> ceb1624 (email verification)
                )}
            </div>
        </div>
    );
};

export default DRNAssessment;


