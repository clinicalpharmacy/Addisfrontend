import { useState, useEffect, useCallback } from 'react';
import supabase from '../utils/supabase';
import { mapPatientToFacts, evaluateRule } from '../components/CDSS/RuleEngine';
import { drnCategories, menuItemsData } from '../constants/drnConstants';

export const useDRNLogic = (patientCode) => {
    // --- State ---
    const [patientData, setPatientData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [medications, setMedications] = useState([]);
    const [labs, setLabs] = useState({});

    // Assessments & Rules
    const [assessments, setAssessments] = useState([]);
    const [clinicalRules, setClinicalRules] = useState([]);

    // Analysis
    const [analysisResults, setAnalysisResults] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Form State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCauses, setSelectedCauses] = useState([]);
    const [writeUps, setWriteUps] = useState({});
    const [editId, setEditId] = useState(null);

    // --- Helpers ---
    const getUserId = async () => {
        let currentUserId = null;
        try {
            // 1. Try Token
            const token = localStorage.getItem('token') || localStorage.getItem('pharmacare_token');
            if (token) {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                currentUserId = payload.userId || payload.user_id || payload.sub || payload.id;
            }

            // 2. Try Session/Local Storage (User object)
            if (!currentUserId) {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const u = JSON.parse(userStr);
                    currentUserId = u.id || u.userId;
                }
            }

            // 3. Try Supabase Auth
            if (!currentUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) currentUserId = user.id;
            }

        } catch (e) { console.error('Error determining user ID:', e); }
        return currentUserId;
    };

    // --- Data Loading ---
    const loadPatientAndRules = useCallback(async () => {
        if (!patientCode) { setAuthError('Patient code required'); return; }

        const uid = await getUserId();
        if (!uid) { setAuthError('Authentication required'); return; }
        setUserId(uid);

        try {
            // Patient
            const { data: pData, error: pError } = await supabase.from('patients').select('*').eq('patient_code', patientCode).single();
            if (pError || !pData) { setAuthError('Patient not found'); return; }
            setPatientData(pData);
            if (pData.labs) setLabs(pData.labs);

            // Medications
            const { data: mData } = await supabase.from('medication_history').select('*').eq('patient_code', patientCode).eq('is_active', true);
            setMedications(mData || pData.medication_history || []);

            // Rules
            const { data: rData } = await supabase.from('clinical_rules').select('*').eq('is_active', true);
            setClinicalRules(rData || []);

            // Assessments
            const { data: aData } = await supabase.from('drn_assessments').select('*').eq('patient_code', patientCode).eq('user_id', uid).order('created_at', { ascending: false });
            setAssessments(aData || []);
            setAuthError(null);

        } catch (err) {
            console.error('Initialization error:', err);
            setAuthError('Failed to load data.');
        }
    }, [patientCode]);

    useEffect(() => { loadPatientAndRules(); }, [loadPatientAndRules]);

    // --- Action Handlers ---
    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            if (!patientData) throw new Error('No patient loaded');
            const facts = mapPatientToFacts(patientData, medications);
            const findings = [];

            clinicalRules.forEach(rule => {
                if (evaluateRule(rule, facts)) {
                    // Mapping logic similar to before
                    let drnCategory = 'Safety';
                    let causeName = rule.rule_name;
                    let dtpType = '';
                    let message = rule.rule_name;
                    let recommendation = '';
                    let severity = rule.severity || 'moderate';

                    // Simple logic to parse rule_action if JSON
                    if (rule.rule_action) {
                        try {
                            const action = typeof rule.rule_action === 'string' ? JSON.parse(rule.rule_action) : rule.rule_action;
                            message = action.message || message;
                            recommendation = action.recommendation || '';
                            severity = action.severity || severity;
                        } catch (e) { }
                    }

                    // Find category
                    for (const [cat, data] of Object.entries(drnCategories)) {
                        if (data.ruleTypes.includes(rule.rule_type)) {
                            drnCategory = cat;
                            const match = (menuItemsData[cat] || []).find(c => c.ruleType === rule.rule_type);
                            if (match) { causeName = match.name; dtpType = match.dtpType; }
                            break;
                        }
                    }

                    findings.push({
                        rule_id: rule.id,
                        rule_type: rule.rule_type,
                        rule_name: rule.rule_name,
                        category: drnCategory,
                        cause: causeName,
                        dtpType,
                        message,
                        recommendation,
                        severity,
                        original_rule_name: rule.rule_name,
                        medications: facts.medications?.filter(m => message.toLowerCase().includes(m.toLowerCase())) || []
                    });
                }
            });

            // Group findings
            const findingsByCategory = {};
            Object.keys(drnCategories).forEach(cat => {
                findingsByCategory[cat] = findings.filter(f => f.category === cat);
            });

            setAnalysisResults({ findings, findingsByCategory, totalFindings: findings.length });

        } catch (e) {
            console.error('Analysis error:', e);
            setAnalysisResults({ findings: [], error: e.message });
        } finally { setIsAnalyzing(false); }
    };

    const handleSaveAssessment = async (causeName) => {
        if (!userId || !patientData) return { error: 'Missing user or patient data' };

        const writeUp = writeUps[causeName];
        if (!writeUp?.specificCase || !writeUp?.medicalCondition || !writeUp?.medication) {
            return { error: 'Please fill all fields' };
        }

        const causeDetails = menuItemsData[selectedCategory]?.find(c => c.name === causeName);
        const payload = {
            patient_id: patientData.id,
            patient_code: patientCode,
            user_id: userId,
            category: selectedCategory,
            cause_name: causeName,
            rule_type: causeDetails?.ruleType,
            dtp_type: causeDetails?.dtpType,
            drn: causeDetails?.drn,
            specific_case: writeUp.specificCase,
            medical_condition: writeUp.medicalCondition,
            medication: writeUp.medication,
            status: 'active',
            updated_at: new Date().toISOString()
        };

        try {
            if (editId) {
                await supabase.from('drn_assessments').update(payload).eq('id', editId);
            } else {
                payload.created_at = new Date().toISOString();
                await supabase.from('drn_assessments').insert([payload]);
            }

            // Refresh
            const { data } = await supabase.from('drn_assessments').select('*').eq('patient_code', patientCode).eq('user_id', userId).order('created_at', { ascending: false });
            setAssessments(data || []);

            // Reset form
            setSelectedCauses([]);
            setWriteUps({});
            setEditId(null);
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    };

    const handleDeleteAssessment = async (id) => {
        if (!window.confirm('Delete this assessment?')) return;
        try {
            await supabase.from('drn_assessments').delete().eq('id', id);
            setAssessments(assessments.filter(a => a.id !== id));
        } catch (e) { alert('Delete failed: ' + e.message); }
    };

    const prepareEdit = (assessment) => {
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
        return true; // signal to scroll
    };

    const prepareFromFinding = (finding) => {
        setSelectedCategory(finding.category);
        setSelectedCauses([finding.cause]);
        setWriteUps({
            [finding.cause]: {
                specificCase: `CDSS Rule: ${finding.original_rule_name}`,
                medicalCondition: patientData?.diagnosis || 'Specified in finding',
                medication: finding.medications?.join(', ') || 'Specified in finding'
            }
        });
        setEditId(null);
        return true;
    };

    return {
        patientData, authError, userId,
        assessments, selectedCategory, setSelectedCategory,
        selectedCauses, setSelectedCauses,
        writeUps, setWriteUps,
        editId, setEditId,
        analysisResults, runAnalysis, isAnalyzing,
        handleSaveAssessment, handleDeleteAssessment,
        prepareEdit, prepareFromFinding
    };
};
