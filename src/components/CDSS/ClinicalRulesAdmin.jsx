// src/components/CDSS/ClinicalRulesAdmin.jsx - UPDATED WITH AGE-IN-DAYS EXAMPLES
import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import {
    FaCogs, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff,
    FaExclamationTriangle, FaStethoscope, FaFilter, FaSave,
    FaCode, FaMagic, FaVial, FaPills, FaUser, FaHeart,
    FaSkullCrossbones, FaEye, FaEyeSlash, FaCopy, FaSearch,
    FaUserShield, FaLock, FaUnlock, FaSpinner, FaUserCheck,
    FaCheckCircle, FaExclamationCircle, FaDatabase, FaBaby, FaChild
} from 'react-icons/fa';

// Helper function to check backend authentication
const checkBackendAuth = () => {
    // Check localStorage for backend JWT tokens
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            return {
                isLoggedIn: true,
                email: user.email,
                role: user.role || 'admin', // Default to admin if not set
                token: token
            };
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }

    // Also check for separate role/email items (common in backend auth)
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');

    if (token && userEmail) {
        return {
            isLoggedIn: true,
            email: userEmail,
            role: userRole || 'admin',
            token: token
        };
    }

    return {
        isLoggedIn: false,
        email: null,
        role: null,
        token: null
    };
};

const ClinicalRulesAdmin = () => {
    const [rules, setRules] = useState([]);
    const [filteredRules, setFilteredRules] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editRule, setEditRule] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showExamples, setShowExamples] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [checkingAdmin, setCheckingAdmin] = useState(true);
    const [authMethod, setAuthMethod] = useState(''); // 'supabase' or 'backend'
    const [dbConnected, setDbConnected] = useState(false);

    // Form data matching your database schema
    const [formData, setFormData] = useState({
        rule_name: '',
        rule_type: 'drug_interaction',
        rule_description: '',
        rule_condition: JSON.stringify({ all: [] }, null, 2),
        rule_action: JSON.stringify({
            message: '',
            recommendation: '',
            severity: 'moderate'
        }, null, 2),
        severity: 'moderate',
        dtp_category: '',
        is_active: true,
        applies_to: []
    });

    const ruleTypes = [
        { value: 'drug_interaction', label: 'Drug Interaction', icon: FaPills, color: 'bg-red-100 text-red-800', category: 'Safety' },
        { value: 'dose_check', label: 'Dose Check', icon: FaPills, color: 'bg-blue-100 text-blue-800', category: 'Effectiveness' },
        { value: 'contraindication', label: 'Contraindication', icon: FaSkullCrossbones, color: 'bg-purple-100 text-purple-800', category: 'Safety' },
        { value: 'allergy_check', label: 'Allergy Check', icon: FaExclamationTriangle, color: 'bg-orange-100 text-orange-800', category: 'Safety' },
        { value: 'lab_monitoring', label: 'Lab Monitoring', icon: FaVial, color: 'bg-green-100 text-green-800', category: 'Effectiveness' },
        { value: 'duplicate_therapy', label: 'Duplicate Therapy', icon: FaCopy, color: 'bg-yellow-100 text-yellow-800', category: 'Indication' },
        { value: 'pregnancy_check', label: 'Pregnancy Safety', icon: FaUser, color: 'bg-pink-100 text-pink-800', category: 'Safety' },
        { value: 'renal_adjustment', label: 'Renal Adjustment', icon: FaHeart, color: 'bg-teal-100 text-teal-800', category: 'Effectiveness' },
        { value: 'hepatic_adjustment', label: 'Hepatic Adjustment', icon: FaHeart, color: 'bg-indigo-100 text-indigo-800', category: 'Effectiveness' },
        { value: 'therapeutic_monitoring', label: 'Therapeutic Monitoring', icon: FaEye, color: 'bg-cyan-100 text-cyan-800', category: 'Effectiveness' },
        { value: 'adherence_check', label: 'Adherence Check', icon: FaUser, color: 'bg-amber-100 text-amber-800', category: 'Adherence' },
        { value: 'cost_analysis', label: 'Cost Analysis', icon: FaCogs, color: 'bg-emerald-100 text-emerald-800', category: 'Cost' },
        { value: 'quality_check', label: 'Quality Check', icon: FaCogs, color: 'bg-rose-100 text-rose-800', category: 'Product_Quality' },
        { value: 'storage_check', label: 'Storage Check', icon: FaCogs, color: 'bg-violet-100 text-violet-800', category: 'Product_Quality' },
        { value: 'expiry_check', label: 'Expiry Check', icon: FaCogs, color: 'bg-fuchsia-100 text-fuchsia-800', category: 'Product_Quality' },
        { value: 'age_check', label: 'Age Check', icon: FaUser, color: 'bg-lime-100 text-lime-800', category: 'Safety' },
        { value: 'formulary_check', label: 'Formulary Check', icon: FaCogs, color: 'bg-sky-100 text-sky-800', category: 'Cost' },
        { value: 'administration', label: 'Administration', icon: FaPills, color: 'bg-amber-100 text-amber-800', category: 'Adherence' },
        { value: 'pediatric_check', label: 'Pediatric Check', icon: FaBaby, color: 'bg-indigo-100 text-indigo-800', category: 'Safety' }
    ];

    const severityLevels = [
        { value: 'critical', label: 'Critical', color: 'bg-red-500 text-white', icon: FaExclamationTriangle },
        { value: 'high', label: 'High', color: 'bg-orange-500 text-white', icon: FaExclamationTriangle },
        { value: 'moderate', label: 'Moderate', color: 'bg-yellow-500 text-white', icon: FaExclamationTriangle },
        { value: 'low', label: 'Low', color: 'bg-blue-500 text-white', icon: FaEye }
    ];

    const dtpCategories = [
        { value: 'adverse_drug_event', label: 'Adverse Drug Event' },
        { value: 'drug_interaction', label: 'Drug Interaction' },
        { value: 'dose_error', label: 'Dose Error' },
        { value: 'contraindication', label: 'Contraindication' },
        { value: 'monitoring_needed', label: 'Monitoring Needed' },
        { value: 'therapeutic_duplication', label: 'Therapeutic Duplication' },
        { value: 'cost_issue', label: 'Cost Issue' },
        { value: 'quality_issue', label: 'Quality Issue' },
        { value: 'adherence_issue', label: 'Adherence Issue' },
        { value: 'age_restriction', label: 'Age Restriction' }
    ];

    const appliesToOptions = [
        { value: 'adult', label: 'Adult (≥18 years)' },
        { value: 'pediatric', label: 'Pediatric (<18 years)' },
        { value: 'geriatric', label: 'Geriatric (≥65 years)' },
        { value: 'renal_impairment', label: 'Renal Impairment' },
        { value: 'hepatic_impairment', label: 'Hepatic Impairment' },
        { value: 'pregnancy', label: 'Pregnancy' },
        { value: 'lactation', label: 'Lactation' },
        { value: 'all_patients', label: 'All Patients' },
        { value: 'neonate', label: 'Neonate (0-28 days)' },
        { value: 'infant', label: 'Infant (29 days - 1 year)' },
        { value: 'child', label: 'Child (1-12 years)' },
        { value: 'adolescent', label: 'Adolescent (13-18 years)' }
    ];

    const sampleRules = {
        'High Creatinine Alert': {
            rule_name: 'High Creatinine Alert',
            rule_type: 'lab_monitoring',
            rule_description: 'Alert when creatinine levels indicate renal impairment',
            rule_condition: `{
  "all": [
    {
      "fact": "labs.creatinine",
      "operator": ">",
      "value": 1.5
    }
  ]
}`,
            rule_action: `{
  "message": "Elevated creatinine detected",
  "recommendation": "High creatinine detected. Review renal function and adjust renally cleared medications.",
  "severity": "high"
}`,
            severity: 'high',
            dtp_category: 'monitoring_needed'
        },
        'ACE Inhibitor + NSAID Interaction': {
            rule_name: 'ACE Inhibitor + NSAID Interaction',
            rule_type: 'drug_interaction',
            rule_description: 'Detects concurrent use of ACE inhibitors and NSAIDs',
            rule_condition: `{
  "all": [
    {
      "fact": "medications",
      "operator": "contains",
      "value": "lisinopril"
    },
    {
      "fact": "medications",
      "operator": "contains",
      "value": "ibuprofen"
    }
  ]
}`,
            rule_action: `{
  "message": "Drug interaction detected",
  "recommendation": "ACE inhibitor + NSAID combination may worsen renal function. Consider alternative pain management.",
  "severity": "high"
}`,
            severity: 'high',
            dtp_category: 'drug_interaction'
        },
        'Elderly Patient on Warfarin': {
            rule_name: 'Elderly Patient on Warfarin',
            rule_type: 'dose_check',
            rule_description: 'Monitor warfarin use in elderly patients',
            rule_condition: `{
  "all": [
    {
      "fact": "age",
      "operator": ">",
      "value": 65
    },
    {
      "fact": "medications",
      "operator": "contains",
      "value": "warfarin"
    }
  ]
}`,
            rule_action: `{
  "message": "Elderly patient on anticoagulant",
  "recommendation": "Monitor INR more frequently. Increased bleeding risk in patients >65 years.",
  "severity": "moderate"
}`,
            severity: 'moderate',
            dtp_category: 'dose_error'
        },
        // ✅ ADDED: Age-in-days sample rules
        'Neonate Tetracycline Contraindication': {
            rule_name: 'Neonate Tetracycline Contraindication',
            rule_type: 'contraindication',
            rule_description: 'Tetracycline contraindicated in neonates',
            rule_condition: `{
  "all": [
    {
      "fact": "is_neonate",
      "operator": "equals",
      "value": true
    },
    {
      "fact": "medications",
      "operator": "contains",
      "value": "tetracycline"
    }
  ]
}`,
            rule_action: `{
  "message": "Tetracycline contraindicated in neonates",
  "recommendation": "Tetracycline is contraindicated in neonates due to tooth discoloration and bone growth issues. Consider alternative antibiotic.",
  "severity": "critical"
}`,
            severity: 'critical',
            dtp_category: 'age_restriction'
        },
        'Infant Gentamicin Dose Check': {
            rule_name: 'Infant Gentamicin Dose Check',
            rule_type: 'dose_check',
            rule_description: 'Gentamicin requires weight-based dosing in infants',
            rule_condition: `{
  "all": [
    {
      "fact": "is_infant",
      "operator": "equals",
      "value": true
    },
    {
      "fact": "medications",
      "operator": "contains",
      "value": "gentamicin"
    }
  ]
}`,
            rule_action: `{
  "message": "Gentamicin prescribed for infant",
  "recommendation": "Gentamicin requires weight-based dosing for infants. Calculate dose based on {{weight}} kg and age {{age_in_days}} days.",
  "severity": "high"
}`,
            severity: 'high',
            dtp_category: 'dose_error'
        },
        'Pediatric Aspirin Warning': {
            rule_name: 'Pediatric Aspirin Warning',
            rule_type: 'age_check',
            rule_description: 'Aspirin caution in children with viral infections',
            rule_condition: `{
  "all": [
    {
      "fact": "is_pediatric",
      "operator": "equals",
      "value": true
    },
    {
      "fact": "medications",
      "operator": "contains",
      "value": "aspirin"
    },
    {
      "fact": "conditions",
      "operator": "contains",
      "value": "viral infection"
    }
  ]
}`,
            rule_action: `{
  "message": "Aspirin caution in pediatric patient with viral infection",
  "recommendation": "Aspirin use in children with viral infections may increase risk of Reye's syndrome. Consider alternative antipyretic/analgesic.",
  "severity": "critical"
}`,
            severity: 'critical',
            dtp_category: 'age_restriction'
        },
        'Age in Days Specific Check': {
            rule_name: 'Age in Days Specific Check',
            rule_type: 'pediatric_check',
            rule_description: 'Specific medication check based on exact age in days',
            rule_condition: `{
  "all": [
    {
      "fact": "age_in_days",
      "operator": "<=",
      "value": 365
    },
    {
      "fact": "medications",
      "operator": "contains",
      "value": "chloramphenicol"
    }
  ]
}`,
            rule_action: `{
  "message": "Chloramphenicol in infant less than 1 year",
  "recommendation": "Chloramphenicol requires careful monitoring in infants <1 year due to risk of Gray Baby Syndrome. Monitor serum levels closely.",
  "severity": "high"
}`,
            severity: 'high',
            dtp_category: 'age_restriction'
        }
    };

    useEffect(() => {
        checkUserStatus();
        fetchRules();
        checkDbConnection();

        // Listen for auth changes
        const interval = setInterval(() => {
            checkUserStatus();
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let filtered = rules;

        if (filterType !== 'all') {
            filtered = filtered.filter(rule => rule.rule_type === filterType);
        }

        if (searchTerm) {
            filtered = filtered.filter(rule =>
                rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rule.rule_description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredRules(filtered);
    }, [filterType, searchTerm, rules]);

    const checkDbConnection = async () => {
        try {
            const { data, error } = await supabase
                .from('clinical_rules')
                .select('count')
                .limit(1);

            setDbConnected(!error);
        } catch (error) {
            setDbConnected(false);
        }
    };

    const checkUserStatus = async () => {
        try {
            setCheckingAdmin(true);

            // METHOD 1: Check backend authentication first
            console.log('🔑 Checking backend authentication...');
            const backendAuth = checkBackendAuth();

            if (backendAuth.isLoggedIn && backendAuth.email) {
                console.log('✅ Authenticated via BACKEND:', backendAuth.email);
                console.log('🔑 Backend auth details:', backendAuth);

                // Ensure localStorage has all required items
                if (!localStorage.getItem('userRole') && backendAuth.role) {
                    localStorage.setItem('userRole', backendAuth.role);
                }
                if (!localStorage.getItem('userEmail') && backendAuth.email) {
                    localStorage.setItem('userEmail', backendAuth.email);
                }

                setCurrentUser({
                    email: backendAuth.email,
                    role: backendAuth.role
                });
                setAuthMethod('backend');

                // Check if admin via backend - STRICT ROLE CHECK
                const isUserAdmin = backendAuth.role === 'admin';

                if (isUserAdmin) {
                    console.log('✅ User is ADMIN (backend detection)');
                    setIsAdmin(true);
                } else {
                    console.log('❌ User is not admin (backend detection)');
                    setIsAdmin(false);
                }

                setCheckingAdmin(false);
                return;
            }

            // METHOD 2: Check Supabase authentication
            console.log('🔑 Checking Supabase authentication...');
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                console.log('✅ Authenticated via SUPABASE:', user.email);
                setCurrentUser(user);
                setAuthMethod('supabase');

                // Check users table for admin role
                try {
                    const { data: userData, error } = await supabase
                        .from('users')
                        .select('role, approved, email')
                        .eq('email', user.email)
                        .single();

                    console.log('📊 User data from database:', userData);

                    if (userData && userData.role === 'admin' && userData.approved) {
                        console.log('✅ User is admin in database');
                        setIsAdmin(true);
                    } else {
                        console.log('❌ User is not admin or not approved');
                        setIsAdmin(false);
                    }
                } catch (dbError) {
                    console.log('⚠️ Database check failed:', dbError.message);
                    // Fallback: check specific admin email only, no loose pattern matching
                    if (user.email === 'admin@pharmacare.com') {
                        console.log('✅ Detected super admin via email');
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                }
            } else {
                console.log('❌ Not authenticated via any method');
                setCurrentUser(null);
                setIsAdmin(false);
                setAuthMethod('');
            }

        } catch (error) {
            console.error('❌ Error checking user status:', error);
            setIsAdmin(false);
            setCurrentUser(null);
        } finally {
            setCheckingAdmin(false);
        }
    };

    const fetchRules = async () => {
        try {
            setLoading(true);

            console.log('📋 Fetching rules from database...');

            // Try to fetch all rules
            const { data, error } = await supabase
                .from('clinical_rules')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.log('❌ Error fetching rules:', error.message);

                // If RLS blocks, try to fetch only active rules
                if (error.message.includes('policy') || error.message.includes('RLS')) {
                    console.log('🔒 RLS restriction detected, trying active rules only...');
                    const { data: activeRules, error: activeError } = await supabase
                        .from('clinical_rules')
                        .select('*')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false });

                    if (activeError) {
                        console.log('❌ Error fetching active rules:', activeError.message);
                        setRules([]);
                        setFilteredRules([]);
                    } else {
                        setRules(activeRules || []);
                        setFilteredRules(activeRules || []);
                        console.log(`✅ Fetched ${activeRules?.length || 0} active rules`);
                    }
                } else {
                    setRules([]);
                    setFilteredRules([]);
                }
            } else {
                setRules(data || []);
                setFilteredRules(data || []);
                console.log(`✅ Successfully fetched ${data?.length || 0} rules`);
            }

        } catch (error) {
            console.error('❌ Error in fetchRules:', error);
            setRules([]);
            setFilteredRules([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormError('');

        try {
            // Validate required fields
            if (!formData.rule_name.trim()) {
                throw new Error('Rule name is required');
            }

            // Validate JSON fields
            let ruleCondition, ruleAction;
            try {
                ruleCondition = JSON.parse(formData.rule_condition);
                ruleAction = JSON.parse(formData.rule_action);
            } catch (jsonError) {
                throw new Error('Invalid JSON format in condition or action fields');
            }

            // Validate condition structure
            if (!ruleCondition.all && !ruleCondition.any) {
                throw new Error('Condition must contain "all" or "any" array');
            }

            // Check if user is admin
            if (!isAdmin) {
                throw new Error('Admin access required to create or modify rules');
            }

            // Prepare data matching your database schema
            const ruleData = {
                rule_name: formData.rule_name.trim(),
                rule_type: formData.rule_type,
                rule_description: formData.rule_description?.trim() || '',
                rule_condition: ruleCondition,
                rule_action: ruleAction,
                severity: formData.severity,
                dtp_category: formData.dtp_category || null,
                is_active: formData.is_active,
                applies_to: formData.applies_to,
                updated_at: new Date().toISOString()
            };

            let result;
            if (editRule) {
                // Update existing rule
                console.log('📝 Updating rule:', editRule.id);
                const { data, error } = await supabase
                    .from('clinical_rules')
                    .update(ruleData)
                    .eq('id', editRule.id)
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Update error:', error);
                    if (error.message.includes('policy') || error.message.includes('RLS')) {
                        throw new Error('You do not have permission to update rules. Admin access required.');
                    }
                    throw error;
                }
                result = data;
                console.log('✅ Rule updated:', result.id);
            } else {
                // Create new rule
                console.log('🆕 Creating new rule...');
                const { data, error } = await supabase
                    .from('clinical_rules')
                    .insert([{
                        ...ruleData,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) {
                    console.error('❌ Create error:', error);
                    if (error.message.includes('policy') || error.message.includes('RLS')) {
                        throw new Error('You do not have permission to create rules. Admin access required.');
                    }
                    throw error;
                }
                result = data;
                console.log('✅ Rule created:', result.id);
            }

            await fetchRules();
            resetForm();
            alert(`✅ Rule ${editRule ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('❌ Error saving rule:', error);
            setFormError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rule) => {
        setEditRule(rule);
        setFormData({
            rule_name: rule.rule_name || '',
            rule_type: rule.rule_type || 'drug_interaction',
            rule_description: rule.rule_description || '',
            rule_condition: JSON.stringify(rule.rule_condition || { all: [] }, null, 2),
            rule_action: JSON.stringify(rule.rule_action || { message: '', recommendation: '', severity: 'moderate' }, null, 2),
            severity: rule.severity || 'moderate',
            dtp_category: rule.dtp_category || '',
            is_active: rule.is_active !== false,
            applies_to: rule.applies_to || []
        });
        setShowForm(true);
        setFormError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;

        try {
            console.log('🗑️ Deleting rule:', id);
            const { error } = await supabase
                .from('clinical_rules')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('❌ Delete error:', error);
                if (error.message.includes('policy') || error.message.includes('RLS')) {
                    alert('❌ You do not have permission to delete rules. Admin access required.');
                    return;
                }
                throw error;
            }

            await fetchRules();
            alert('✅ Rule deleted successfully!');
        } catch (error) {
            console.error('❌ Error deleting rule:', error);
            alert('❌ Error: ' + error.message);
        }
    };

    const toggleRuleStatus = async (id, currentStatus) => {
        try {
            console.log('🔄 Toggling rule status:', id, 'from', currentStatus, 'to', !currentStatus);
            const { error } = await supabase
                .from('clinical_rules')
                .update({
                    is_active: !currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('❌ Toggle error:', error);
                if (error.message.includes('policy') || error.message.includes('RLS')) {
                    alert('❌ You do not have permission to modify rules. Admin access required.');
                    return;
                }
                throw error;
            }

            fetchRules();
            alert(`✅ Rule ${!currentStatus ? 'activated' : 'deactivated'}!`);
        } catch (error) {
            console.error('❌ Error updating rule status:', error);
            alert('❌ Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            rule_name: '',
            rule_type: 'drug_interaction',
            rule_description: '',
            rule_condition: JSON.stringify({ all: [] }, null, 2),
            rule_action: JSON.stringify({
                message: '',
                recommendation: '',
                severity: 'moderate'
            }, null, 2),
            severity: 'moderate',
            dtp_category: '',
            is_active: true,
            applies_to: []
        });
        setEditRule(null);
        setShowForm(false);
        setFormError('');
    };

    const loadSample = (sampleName) => {
        const sample = sampleRules[sampleName];
        if (sample) {
            setFormData({
                rule_name: sample.rule_name,
                rule_type: sample.rule_type,
                rule_description: sample.rule_description,
                rule_condition: sample.rule_condition,
                rule_action: sample.rule_action,
                severity: sample.severity,
                dtp_category: sample.dtp_category,
                is_active: true,
                applies_to: ['all_patients']
            });
            setEditRule(null);
            setShowForm(true);
            setFormError('');
        }
    };

    const getRuleTypeInfo = (type) => {
        return ruleTypes.find(t => t.value === type) || ruleTypes[0];
    };

    const getSeverityInfo = (severity) => {
        return severityLevels.find(s => s.value === severity) || severityLevels[2];
    };

    const validateJson = (jsonString) => {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (e) {
            return false;
        }
    };

    const formatJson = (jsonString) => {
        try {
            const obj = JSON.parse(jsonString);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return jsonString;
        }
    };

    const fixLocalStorage = () => {
        const backendAuth = checkBackendAuth();
        if (backendAuth.isLoggedIn) {
            localStorage.setItem('userRole', backendAuth.role || 'admin');
            localStorage.setItem('userEmail', backendAuth.email || 'admin@pharmacare.com');
            alert('✅ Fixed localStorage items! Refreshing...');
            setTimeout(() => window.location.reload(), 500);
        }
    };

    if (checkingAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Checking user permissions...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we verify your access</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-full">
                        <FaCogs className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Clinical Rules Administration</h2>
                        <p className="text-sm text-gray-600">Create and manage clinical decision support rules</p>
                        <div className="flex items-center gap-2 mt-1">
                            {currentUser ? (
                                <div className="flex items-center gap-2">
                                    <FaUserShield className="text-green-500" />
                                    <span className="text-sm text-gray-700 font-medium">{currentUser.email}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${isAdmin ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {currentUser.role?.replace('_', ' ')?.toUpperCase() || (isAdmin ? 'ADMIN' : 'USER')}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        ({authMethod === 'backend' ? 'Backend Auth' : 'Supabase Auth'})
                                    </span>
                                </div>
                            ) : (
                                <span className="text-sm text-orange-600 flex items-center gap-1">
                                    <FaLock /> Please log in
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg"
                    >
                        <FaPlus /> Create New Rule
                    </button>
                )}
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg flex items-center gap-3 ${isAdmin ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className={`p-2 rounded-full ${isAdmin ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {isAdmin ? <FaCheckCircle /> : <FaExclamationCircle />}
                    </div>
                    <div>
                        <h3 className="font-medium">{isAdmin ? 'Admin Access' : 'Limited Access'}</h3>
                        <p className="text-sm">{isAdmin ? 'Full permissions granted' : 'View only mode'}</p>
                    </div>
                </div>

                <div className={`p-4 rounded-lg flex items-center gap-3 ${dbConnected ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className={`p-2 rounded-full ${dbConnected ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                        <FaDatabase />
                    </div>
                    <div>
                        <h3 className="font-medium">{dbConnected ? 'Database Connected' : 'Database Offline'}</h3>
                        <p className="text-sm">{dbConnected ? `${rules.length} rules loaded` : 'Check connection'}</p>
                    </div>
                </div>

                <div className="p-4 rounded-lg flex items-center gap-3 bg-gray-50 border border-gray-200">
                    <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                        <FaUserCheck />
                    </div>
                    <div>
                        <h3 className="font-medium">Authentication</h3>
                        <p className="text-sm">{currentUser ? authMethod : 'Not logged in'}</p>
                    </div>
                </div>
            </div>

            {/* Debug Info - Collapsed by default */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <details className="text-sm">
                    <summary className="cursor-pointer text-gray-700 font-medium flex items-center gap-2">
                        <FaUserCheck /> Debug Info
                    </summary>
                    <pre className="mt-2 p-2 bg-white rounded overflow-auto text-xs">
                        {JSON.stringify({
                            status: 'READY',
                            loggedIn: !!currentUser,
                            userEmail: currentUser?.email || 'Not logged in',
                            userRole: currentUser?.role || 'None',
                            isAdmin: isAdmin,
                            authMethod: authMethod,
                            dbConnected: dbConnected,
                            totalRules: rules.length,
                            backendAuth: checkBackendAuth(),
                            localStorageCheck: {
                                token: localStorage.getItem('token') ? '✅ Present' : '❌ Missing',
                                user: localStorage.getItem('user') ? '✅ Present' : '❌ Missing',
                                userRole: localStorage.getItem('userRole') || '❌ Missing',
                                userEmail: localStorage.getItem('userEmail') || '❌ Missing'
                            },
                            timestamp: new Date().toISOString()
                        }, null, 2)}
                    </pre>
                    <div className="mt-2 flex gap-2 flex-wrap">
                        <button
                            onClick={checkUserStatus}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >
                            🔄 Refresh Status
                        </button>
                        <button
                            onClick={fetchRules}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                        >
                            📋 Refresh Rules
                        </button>
                        <button
                            onClick={fixLocalStorage}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                        >
                            🔧 Fix LocalStorage
                        </button>
                    </div>
                </details>
            </div>

            {/* Search and Filter Bar */}
            {currentUser && (
                <>
                    <div className="mb-6 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search rules by name or description..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isAdmin && (
                                <button
                                    onClick={() => setShowExamples(!showExamples)}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    {showExamples ? <FaEyeSlash /> : <FaEye />}
                                    {showExamples ? 'Hide Examples' : 'Show Examples'}
                                </button>
                            )}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="all">All Rule Types</option>
                                {ruleTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label} ({rules.filter(r => r.rule_type === type.value).length})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sample Rules - Only show for admins */}
                    {showExamples && isAdmin && (
                        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                                <FaMagic /> Sample Rules (Click to Load)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {Object.entries(sampleRules).map(([name, rule]) => {
                                    const typeInfo = getRuleTypeInfo(rule.rule_type);
                                    const Icon = typeInfo.icon;
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => loadSample(name)}
                                            className="bg-white p-4 rounded-lg border hover:shadow-md transition text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full ${typeInfo.color}`}>
                                                    <Icon className="text-current" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-800">{rule.rule_name}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{rule.rule_description}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`px-2 py-1 text-xs rounded ${typeInfo.color}`}>
                                                            {typeInfo.label}
                                                        </span>
                                                        <span className={`px-2 py-1 text-xs rounded ${rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                            rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                rule.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {rule.severity}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Rules Table */}
            {currentUser ? (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left font-medium text-gray-700">Status</th>
                                <th className="p-3 text-left font-medium text-gray-700">Rule Name</th>
                                <th className="p-3 text-left font-medium text-gray-700">Type</th>
                                <th className="p-3 text-left font-medium text-gray-700">Severity</th>
                                <th className="p-3 text-left font-medium text-gray-700">Last Updated</th>
                                {isAdmin && <th className="p-3 text-left font-medium text-gray-700">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRules.length > 0 ? (
                                filteredRules.map(rule => {
                                    const ruleTypeInfo = getRuleTypeInfo(rule.rule_type);
                                    const severityInfo = getSeverityInfo(rule.severity);
                                    const Icon = ruleTypeInfo.icon;

                                    return (
                                        <tr key={rule.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                {isAdmin ? (
                                                    <button
                                                        onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                                                        className={`flex items-center gap-2 ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`}
                                                        title={rule.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                                                    >
                                                        {rule.is_active ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                                                        <span className="text-xs">{rule.is_active ? 'Active' : 'Inactive'}</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {rule.is_active ? (
                                                            <FaToggleOn size={20} className="text-green-600" />
                                                        ) : (
                                                            <FaToggleOff size={20} className="text-gray-400" />
                                                        )}
                                                        <span className="text-xs">{rule.is_active ? 'Active' : 'Inactive'}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-medium text-gray-800">{rule.rule_name}</div>
                                                {rule.rule_description && (
                                                    <div className="text-sm text-gray-500 mt-1">{rule.rule_description}</div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <Icon className={ruleTypeInfo.color.replace('bg-', 'text-').split(' ')[0]} />
                                                    <span className={`px-2 py-1 rounded text-xs ${ruleTypeInfo.color}`}>
                                                        {ruleTypeInfo.label}
                                                    </span>
                                                </div>
                                                {rule.dtp_category && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        DTP: {dtpCategories.find(c => c.value === rule.dtp_category)?.label || rule.dtp_category}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs ${severityInfo.color}`}>
                                                    {severityInfo.label}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-gray-600">
                                                {rule.updated_at ? new Date(rule.updated_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            {isAdmin && (
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(rule)}
                                                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded"
                                                            title="Edit Rule"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rule.id)}
                                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                                                            title="Delete Rule"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="p-6 text-center">
                                        <FaStethoscope className="text-4xl text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">
                                            {loading ? 'Loading rules...' : 'No rules found'}
                                        </p>
                                        {isAdmin && (
                                            <button
                                                onClick={() => setShowForm(true)}
                                                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm"
                                            >
                                                Create Your First Rule
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg border">
                    <FaLock className="text-4xl text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Authentication Required</h3>
                    <p className="text-gray-600 mb-4">Please log in to access the Clinical Rules Administration</p>
                    <a
                        href="/login"
                        className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg"
                    >
                        Go to Login
                    </a>
                </div>
            )}

            {/* Rule Form Modal - Only for admins */}
            {showForm && isAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editRule ? 'Edit Clinical Rule' : 'Create New Clinical Rule'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    &times;
                                </button>
                            </div>

                            {formError && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                                    {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rule Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.rule_name}
                                        onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="e.g., ACE Inhibitor + NSAID Interaction"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rule Type *
                                    </label>
                                    <select
                                        value={formData.rule_type}
                                        onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    >
                                        {ruleTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label} ({type.category})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Severity Level *
                                    </label>
                                    <select
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    >
                                        {severityLevels.map(level => (
                                            <option key={level.value} value={level.value}>
                                                {level.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        DTP Category
                                    </label>
                                    <select
                                        value={formData.dtp_category}
                                        onChange={(e) => setFormData({ ...formData, dtp_category: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="">Select Category</option>
                                        {dtpCategories.map(cat => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rule Description
                                </label>
                                <textarea
                                    value={formData.rule_description}
                                    onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
                                    rows="2"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Brief description of what this rule checks..."
                                />
                            </div>

                            {/* Condition Editor - UPDATED WITH AGE-IN-DAYS FACTS */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Condition (JSON Format) *
                                    </label>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <FaCode /> Use valid JSON format
                                        {!validateJson(formData.rule_condition) && (
                                            <span className="text-red-500">Invalid JSON</span>
                                        )}
                                    </div>
                                </div>
                                <textarea
                                    value={formData.rule_condition}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({ ...formData, rule_condition: value });
                                        if (validateJson(value)) {
                                            setFormError('');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (validateJson(e.target.value)) {
                                            setFormData({ ...formData, rule_condition: formatJson(e.target.value) });
                                        }
                                    }}
                                    rows="8"
                                    className={`w-full border rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${validateJson(formData.rule_condition) ? 'border-gray-300' : 'border-red-300'
                                        }`}
                                    placeholder={`Example for age-in-days check:
{
  "all": [
    {
      "fact": "age_in_days",
      "operator": "<",
      "value": 28
    },
    {
      "fact": "medications",
      "operator": "contains",
      "value": "tetracycline"
    }
  ]
}`}
                                    required
                                />
                                <div className="mt-2 text-xs text-gray-500">
                                    <p className="font-medium mb-1">Available Facts:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                                        {/* Demographic Facts */}
                                        <code className="bg-gray-100 px-2 py-1 rounded">age</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">age_in_days</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">age_days</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">gender</code>
                                        <code className="bg-blue-100 px-2 py-1 rounded">is_pediatric</code>
                                        <code className="bg-blue-100 px-2 py-1 rounded">is_neonate</code>
                                        <code className="bg-blue-100 px-2 py-1 rounded">is_infant</code>
                                        <code className="bg-blue-100 px-2 py-1 rounded">is_child</code>
                                        <code className="bg-blue-100 px-2 py-1 rounded">is_adolescent</code>
                                        <code className="bg-blue-100 px-2 py-1 rounded">patient_type</code>

                                        {/* Medical Facts */}
                                        <code className="bg-gray-100 px-2 py-1 rounded">medications</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">allergies</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">conditions</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">pregnancy</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">pregnancy_weeks</code>

                                        {/* Lab Facts */}
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.creatinine</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.blood_sugar</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.hemoglobin</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.alt</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.potassium</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.sodium</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.inr</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.hba1c</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">labs.egfr</code>

                                        {/* Vital Signs */}
                                        <code className="bg-gray-100 px-2 py-1 rounded">weight</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">height</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">bmi</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">blood_pressure</code>
                                        <code className="bg-gray-100 px-2 py-1 rounded">heart_rate</code>
                                    </div>
                                    <p className="font-medium mt-2 mb-1">Operators:</p>
                                    <div className="flex flex-wrap gap-1">
                                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">contains</code>
                                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">not_contains</code>
                                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">&gt;</code>
                                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">&lt;</code>
                                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">&gt;=</code>
                                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded">&lt;=</code>
                                        <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded">==</code>
                                        <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded">!=</code>
                                        <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">equals</code>
                                        <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">not_equals</code>
                                        <code className="bg-pink-100 text-pink-800 px-2 py-1 rounded">exists</code>
                                        <code className="bg-pink-100 text-pink-800 px-2 py-1 rounded">not_exists</code>
                                        <code className="bg-teal-100 text-teal-800 px-2 py-1 rounded">starts_with</code>
                                        <code className="bg-teal-100 text-teal-800 px-2 py-1 rounded">ends_with</code>
                                        <code className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded">between</code>
                                    </div>
                                </div>
                            </div>

                            {/* Action Editor */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Action (JSON Format) *
                                    </label>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <FaMagic /> Alert details
                                        {!validateJson(formData.rule_action) && (
                                            <span className="text-red-500">Invalid JSON</span>
                                        )}
                                    </div>
                                </div>
                                <textarea
                                    value={formData.rule_action}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({ ...formData, rule_action: value });
                                        if (validateJson(value)) {
                                            setFormError('');
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (validateJson(e.target.value)) {
                                            setFormData({ ...formData, rule_action: formatJson(e.target.value) });
                                        }
                                    }}
                                    rows="8"
                                    className={`w-full border rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${validateJson(formData.rule_action) ? 'border-gray-300' : 'border-red-300'
                                        }`}
                                    placeholder={`Example with variables:
{
  "message": "Pediatric medication alert for {{age_in_days}} day old patient",
  "recommendation": "Adjust dose based on weight {{weight}} kg. Current dose may be too high for patient age.",
  "severity": "high"
}`}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Required fields: message, recommendation, severity. You can use variables like {"{{age_in_days}}"}, {"{{weight}}"}, {"{{labs.creatinine}}"} in the message.
                                </p>
                            </div>

                            {/* Additional Options */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Applies To (Optional)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {appliesToOptions.map(option => (
                                            <label key={option.value} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.applies_to.includes(option.value)}
                                                    onChange={(e) => {
                                                        const newAppliesTo = e.target.checked
                                                            ? [...formData.applies_to, option.value]
                                                            : formData.applies_to.filter(v => v !== option.value);
                                                        setFormData({ ...formData, applies_to: newAppliesTo });
                                                    }}
                                                    className="h-4 w-4 text-purple-600"
                                                />
                                                <span className="text-sm">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="h-5 w-5 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active Rule</span>
                                    </label>
                                    <div className="text-sm text-gray-500">
                                        {formData.is_active ? 'Will be evaluated' : 'Will be skipped'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FaSave /> {editRule ? 'Update Rule' : 'Create Rule'}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicalRulesAdmin;