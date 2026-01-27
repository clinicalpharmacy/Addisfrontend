// src/components/Patient/DRNAssessment.jsx - REVISED VERSION
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
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
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
                            confidence: 95,
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
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-full">
                    <FaStethoscope className="text-white text-xl" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">DRN Assessment - 9 Categories</h2>
                    <p className="text-gray-600">Powered by Clinical Decision Support System (CDSS)</p>
                    <div className="text-sm text-gray-500 mt-1">
                        Patient: {patientCode} | User ID: {userId?.substring(0, 8)}...
                    </div>
                </div>
            </div>

            {/* CDSS Analysis Section - UPDATED */}
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-blue-800 flex items-center gap-2">
                        <FaDatabase /> CDSS-Powered DRN Analysis
                    </h3>
                    <button
                        onClick={() => setShowAnalysis(!showAnalysis)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        {showAnalysis ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                </div>

                {showAnalysis && (
                    <>
                        {isAnalyzing ? (
                            <div className="text-center py-8">
                                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                                <p className="text-gray-600">Running CDSS analysis...</p>
                            </div>
                        ) : analysisResults ? (
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-semibold text-gray-800 text-lg">Analysis Results</h4>
                                            <p className={`text-lg font-medium mt-2 ${
                                                analysisResults.totalFindings > 0 
                                                    ? 'text-gray-800' 
                                                    : 'text-green-600'
                                            }`}>
                                                {analysisResults.summary}
                                            </p>
                                            <div className="flex gap-4 mt-3">
                                                <span className="text-sm text-gray-600">
                                                    Rules: {analysisResults.metadata?.rulesTriggered}/{analysisResults.metadata?.rulesEvaluated} triggered
                                                </span>
                                                <span className="text-sm text-blue-600">
                                                    Categories: {analysisResults.metadata?.categoriesAnalyzed?.length || 0} affected
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <button
                                                onClick={runCdssAnalysis}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2"
                                            >
                                                <FaSync /> Re-run Analysis
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Findings display - UPDATED WITHOUT ruleTypes */}
                                    {filteredFindings.length > 0 ? (
                                        <div className="space-y-3">
                                            {filteredFindings.map((finding, idx) => (
                                                <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                <span className="font-semibold text-gray-800">{finding.cause}</span>
                                                                <span className={`px-2 py-1 ${getSeverityColor(finding.severity)} text-xs rounded font-medium`}>
                                                                    {finding.severity}
                                                                </span>
                                                                <span className={`px-2 py-1 ${getCategoryColor(finding.category)} text-xs rounded`}>
                                                                    {finding.category}
                                                                </span>
                                                                {/* DTP Type Display - NEW SECTION */}
                                                                {finding.dtpType && (
                                                                    <span className={`px-2 py-1 ${getDTPTypeColor(finding.dtpType)} text-xs rounded font-medium`}>
                                                                        DTP: {finding.dtpType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2">{finding.message}</p>
                                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                                <span className="text-xs text-gray-500">
                                                                    Confidence: 95%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleReviewFinding(finding)}
                                                            className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition flex items-center gap-2"
                                                        >
                                                            <FaEdit /> Add to Assessment
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
                                            <p className="text-gray-600">No issues found matching current filter</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <FaDatabase className="text-4xl text-blue-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">Run CDSS analysis to detect drug-related problems</p>
                                <button
                                    onClick={runCdssAnalysis}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-md flex items-center gap-2 mx-auto"
                                >
                                    <FaDatabase /> Run CDSS Analysis
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 9 Category Selection */}
            <div className="mb-8" id="assessment-form">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Select DRN Category (9 Categories)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(drnCategories).map(([category, catData]) => {
                        const Icon = catData.icon;
                        const ruleCount = catData.ruleTypes.reduce((count, ruleType) => {
                            return count + (activeRules[ruleType]?.length || 0);
                        }, 0);
                        
                        return (
                            <button
                                key={category}
                                onClick={() => {
                                    setSelectedCategory(category);
                                    setSelectedCauses([]);
                                    setWriteUps({});
                                    setEditId(null);
                                }}
                                className={`p-4 rounded-lg text-left transition-all duration-200 border ${
                                    selectedCategory === category
                                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${getCategoryColor(category)}`}>
                                        <Icon className="text-current" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{category}</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {ruleCount} rules • {menuItemsData[category]?.length || 0} causes
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Cause Selection and Form - UPDATED (REMOVED Recommendation and Severity) */}
        {selectedCategory && (
          <div className="mb-8 p-6 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-6 text-gray-800">
              {selectedCategory} - Select Causes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {menuItemsData[selectedCategory]?.map(cause => {
                const ruleCount = activeRules[cause.ruleType]?.length || 0;
                const isSelected = selectedCauses.includes(cause.name);
                
                return (
                  <div key={cause.name} className="p-4 border rounded-lg bg-white hover:shadow transition">
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCauseSelection(cause.name)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{cause.name}</p>
                        <div className="flex gap-2 mt-2">
                          {/* Only show rule count, NOT DTP type */}
                          {ruleCount > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {ruleCount} rules
                            </span>
                          )}
                        </div>
                        {/* Show default recommendation ONLY when selected */}
                        {isSelected && (
                          <div className="mt-3 bg-blue-50 border border-blue-100 rounded p-3">
                            <p className="text-xs font-medium text-blue-800 mb-1">Default Recommendation:</p>
                            <p className="text-xs text-blue-700">{getDefaultRecommendation(cause.ruleType)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        
            {/* Form for Selected Causes - NOW shows DTP type since they're selected */}
            {selectedCauses.map(causeName => {
              const causeDetails = menuItemsData[selectedCategory]?.find(c => c.name === causeName);
              const ruleTypeRecommendation = getDefaultRecommendation(causeDetails?.ruleType);
              
              return (
                <div key={causeName} className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-800">
                        {causeName}
                      </h4>
                      {/* DTP Type Display - NOW shows because it's in the form */}
                      {causeDetails?.dtpType && (
                        <span className={`px-3 py-1 text-sm rounded ${getDTPTypeColor(causeDetails.dtpType)} mt-2 inline-block`}>
                          DTP Type: {causeDetails.dtpType}
                        </span>
                      )}
                    </div>
                    {/* Default Recommendation display */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 max-w-md">
                      <p className="text-sm font-medium text-blue-800 mb-1">Default Recommendation:</p>
                      <p className="text-sm text-blue-700">{ruleTypeRecommendation}</p>
                    </div>
                  </div>
                  
                  {/* ... form fields remain the same ... */}
                </div>
              );
            })}
          </div>
        )}

            {/* Saved Assessments Table - UPDATED to show DTP Type instead of ruleType */}
            <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                        Saved Assessments ({assessments.length})
                    </h3>
                    {assessments.length > 0 && (
                        <button
                            onClick={() => fetchAssessments()}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <FaSync className={isLoading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-8">
                        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading assessments...</p>
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <FaStethoscope className="text-4xl text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No assessments saved yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-4 text-left font-medium text-gray-700">Category</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Cause</th>
                                    <th className="p-4 text-left font-medium text-gray-700">DTP Type</th> {/* Changed from Rule Type */}
                                    <th className="p-4 text-left font-medium text-gray-700">Specific Case</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Status</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Date</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assessments.map((assessment, index) => (
                                    <tr key={assessment.id} className="border-t hover:bg-gray-50">
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-sm rounded-full ${getCategoryColor(assessment.category)}`}>
                                                {assessment.category}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-gray-800">{assessment.cause_name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded ${getDTPTypeColor(assessment.dtp_type)}`}>
                                                {assessment.dtp_type || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 max-w-xs">{assessment.specific_case}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                assessment.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                                assessment.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {assessment.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(assessment.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(assessment)}
                                                    className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
                                                    title="Edit assessment"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAssessment(assessment.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                                                    title="Delete assessment"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DRNAssessment;
