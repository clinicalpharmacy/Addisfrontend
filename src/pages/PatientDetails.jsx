import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    FaUser,
    FaStethoscope,
    FaSave,
    FaPills,
    FaChartLine,
    FaFileMedical,
    FaMoneyBillWave,
    FaCheckCircle,
    FaArrowLeft,
    FaEdit,
    FaTrash,

    FaHeartbeat,
    FaVenusMars,
    FaPhone,
    FaHome,
    FaBirthdayCake,
    FaPlus,
    FaCalendarAlt,
    FaExclamationTriangle,
    FaTimes,
    FaAllergies,
    FaVial,
    FaBaby,
    FaChild,
    FaBabyCarriage,
    FaWeight,
    FaRulerVertical,
    FaCapsules,
    FaPrescriptionBottleAlt,

    FaSync,
    FaBrain,
    FaRobot,
    FaHistory,
    FaUserShield,
    FaWifi
} from 'react-icons/fa';

// Import components
import MedicationHistory from '../components/Patient/MedicationHistory';
import DRNAssessment from '../components/Patient/DRNAssessment';
import PhAssistPlan from '../components/Patient/PhAssistPlan';
import PatientOutcome from '../components/Patient/PatientOutcome';
import CostSection from '../components/Patient/CostSection';
import CDSSDisplay from '../components/CDSS/CDSSDisplay';
import PatientUnlocker from '../components/PatientUnlocker';
import SupportRequestModal from '../components/Security/SupportRequestModal';

import api from '../utils/api';
import supabase from '../utils/supabase';
import {
    encryptPatient, getEncryptionKey, decryptPatient,
    loadPrivateKey, decryptWithPrivateKey, hexToBytes
} from '../utils/encryptionUtils';


// Create memoized LabInputField component — COMPACT VERSION
const LabInputField = React.memo(({
    label,
    value,
    labDate,
    field,
    unit,
    placeholder,
    isEditing,
    handleChange,
    handleDateChange,
    normalRange,
    readOnly = false,
    type = "number"
}) => {
    const handleInputChange = (e) => {
        handleChange(field, e.target.value);
    };

    return (
        <div className="space-y-0.5">
            <label className="block text-[11px] font-medium text-gray-700 truncate">
                {label}
                {normalRange && (
                    <span className="text-[10px] text-gray-500 ml-1">({normalRange})</span>
                )}
            </label>
            {isEditing ? (
                <div className="space-y-1">
                    <div className="flex items-center">
                        <input
                            type={type}
                            step={type === "number" ? "0.01" : undefined}
                            value={value || ''}
                            onChange={handleInputChange}
                            className="flex-1 min-w-0 border border-gray-300 rounded-l p-1 text-xs"
                            placeholder={placeholder}
                            readOnly={readOnly}
                        />
                        <div className="w-10 bg-gray-100 border border-l-0 border-gray-300 rounded-r p-1 text-center text-[10px] text-gray-700">
                            {unit}
                        </div>
                    </div>
                    <input
                        type="date"
                        value={labDate || ''}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className={`w-full border rounded p-1 text-[10px] ${!labDate && value ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        required={value && value.trim() !== ''}
                    />
                </div>
            ) : (
                <div>
                    <div className="flex items-center">
                        <div className="flex-1 min-w-0 bg-blue-50 border border-blue-200 rounded-l p-1 text-xs">
                            <span className="font-medium text-gray-800 truncate">
                                {value || '--'}
                            </span>
                        </div>
                        <div className="w-10 bg-blue-100 border border-l-0 border-blue-200 rounded-r p-1 text-center text-[10px] text-gray-700">
                            {unit}
                        </div>
                    </div>
                    {labDate && (
                        <div className="mt-0.5 text-[10px] text-gray-500 truncate">
                            {new Date(labDate).toLocaleDateString()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

LabInputField.displayName = 'LabInputField';

const PatientDetails = ({ patientCode: propPatientCode, onBack: propOnBack, onPatientCreated } = {}) => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Support both prop-based patientCode (when embedded in Education) and route-based useParams()
    const patientCode = propPatientCode !== undefined ? propPatientCode : params.patientCode;

    // --- 1. PRIMARY STATE INITIALIZATION ---
    const [patient, setPatient] = useState(null);
    const [activeKey, setActiveKey] = useState(null); // Working decryption key (master or shared)
    const [loading, setLoading] = useState(true);
    const [isNewPatient, setIsNewPatient] = useState(false);
    const [activeTab, setActiveTab] = useState('demographics');
    const [defaultTabInitialized, setDefaultTabInitialized] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newAllergy, setNewAllergy] = useState('');
    const [ageMode, setAgeMode] = useState('years');
    const [showPediatricLabs, setShowPediatricLabs] = useState(false);
    const [currentPatientCode, setCurrentPatientCode] = useState('');
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [backendStatus, setBackendStatus] = useState('checking');
    const [retryCount, setRetryCount] = useState(0);
    const [user, setUser] = useState(null);
    const [customLabs, setCustomLabs] = useState([]);
    const [globalLabDefinitions, setGlobalLabDefinitions] = useState([]);
    const [vitalsHistory, setVitalsHistory] = useState([]);
    const [labsHistory, setLabsHistory] = useState([]);
    const [patientOwnerSalt, setPatientOwnerSalt] = useState(null);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [supportActivated, setSupportActivated] = useState(false);

    // Effect to fetch initial data
    useEffect(() => {
        if (patientCode && !isNewPatient) {
            fetchPatientData();
            checkSupportStatus();
        }
    }, [patientCode, isNewPatient]);


    useEffect(() => {
        if (user && !defaultTabInitialized) {
            if (user?.account_type === 'individual' && user?.role !== 'admin') {
                setActiveTab('demographics');
            } else {
                setActiveTab('overview');
            }
            setDefaultTabInitialized(true);
        }
    }, [user, defaultTabInitialized]);


    // Form state (all fields)
    const [formData, setFormData] = useState({
        full_name: '', age: '', age_in_days: '', gender: '', date_of_birth: '',
        contact_number: '', address: '', diagnosis: '', appointment_date: '',
        is_active: true, allergies: [], patient_type: 'adult',
        is_pregnant: false, pregnancy_weeks: '', pregnancy_trimester: '', edd: '', pregnancy_notes: '',
        is_lactating: false, lactation_notes: '',
        weight_percentile: '', height_percentile: '', head_circumference_percentile: '', bsa_percentile: '',
        blood_pressure: '', heart_rate: '', temperature: '', respiratory_rate: '', oxygen_saturation: '',
        weight: '', height: '', last_measured: '',
        developmental_milestones: '', feeding_method: '', birth_weight: '', birth_length: '',
        vaccination_status: '', special_instructions: '',
        // Labs (Now dynamic via customLabs/GlobalDefinitions)
        lab_test_date: null
    });

    // --- 2. HELPERS & UTILS ---
    const formatEncValue = useCallback((val, fallback = 'Not specified') => {
        if (val === null || val === undefined || val === '') return fallback;
        const strVal = String(val);
        if (strVal.includes(':') && strVal.length > 30) return '[Encrypted]';
        return val;
    }, []);



    // --- 3. EFFECTS ---
    // Initialize user from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try { 
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                // Also initialize the salt for support requests
                const salt = parsedUser.encryption_salt || localStorage.getItem('enc_salt');
                if (salt) setPatientOwnerSalt(salt);
            } catch (e) { }
        }
    }, []);

    // Global Lab definitions fetcher
    const fetchGlobalLabs = useCallback(async () => {
        try {
            const response = await api.get('/lab-definitions');
            if (response.success && response.labs) {
                setGlobalLabDefinitions(response.labs);
            }
        } catch (err) {
            // Fallback to direct supabase if API fails (as emergency)
            try {
                const { data, error } = await supabase.from('lab_tests').select('*').eq('is_active', true);
                if (data) setGlobalLabDefinitions(data);
            } catch (inner) { }
        }
    }, []);

    useEffect(() => { fetchGlobalLabs(); }, [fetchGlobalLabs]);

    // Ensure global labs are merged whenever definitions are loaded or updated
    useEffect(() => {
        if (globalLabDefinitions.length > 0) {
            setCustomLabs(prev => {
                // Create a map of existing labs (both global and custom)
                const existingMap = new Map();
                prev.forEach(l => {
                    const name = (l.name || '').toLowerCase().trim().replace(/\s+/g, '_');
                    if (name) existingMap.set(name, l);
                });

                // Create updated list from globals
                const updatedGlobals = globalLabDefinitions.map(g => {
                    const nameKey = (g.name || '').toLowerCase().trim().replace(/\s+/g, '_');
                    const existing = existingMap.get(nameKey);
                    return {
                        id: 'global-' + g.id,
                        name: g.name,
                        value: existing ? existing.value : '',
                        date: existing ? existing.date : null,
                        isGlobal: true,
                        unit: g.unit,
                        reference_range: g.reference_range,
                        category: g.category,
                        description: g.description
                    };
                });

                // Keep non-global custom labs
                const globalNames = new Set(globalLabDefinitions.map(g => (g.name || '').toLowerCase().trim().replace(/\s+/g, '_')));
                const nonGlobals = prev.filter(l => {
                    const name = (l.name || '').toLowerCase().trim().replace(/\s+/g, '_');
                    return name && !globalNames.has(name);
                });

                return [...updatedGlobals, ...nonGlobals];
            });
        }
    }, [globalLabDefinitions]);


    // Use useMemo for heavy computations that depend on formData
    const pediatricAgeGroups = useMemo(() => [
        { type: 'neonate', minDays: 0, maxDays: 28, label: 'Neonate (0-28 days)', icon: FaBaby },
        { type: 'infant', minDays: 29, maxDays: 365, label: 'Infant (29 days - 1 year)', icon: FaBabyCarriage },
        { type: 'child', minDays: 366, maxDays: 12 * 365, label: 'Child (1-12 years)', icon: FaChild },
        { type: 'adolescent', minDays: 13 * 365 + 1, maxDays: 18 * 365, label: 'Adolescent (13-18 years)', icon: FaUser },
        { type: 'adult', minDays: 18 * 365 + 1, maxDays: 99999, label: 'Adult (>18 years)', icon: FaUser }
    ], []);

    const tabs = useMemo(() => {
        const isCompanyUser = !!user?.company_id ||
            user?.account_type === 'company' ||
            ['company_admin', 'company_user'].includes(user?.role);

        const isHealthcareClient = user?.role === 'healthcare_client' || user?.account_type === 'healthcare_client';
        const isIndividual = user?.account_type === 'individual';
        const isPharmacy = user?.role === 'pharmacy' || user?.role === 'pharmacist' || user?.account_type === 'pharmacy';

        const allTabs = [
            { id: 'overview', label: 'Overview' },
            { id: 'demographics', label: 'Demographics & Dx' },
            { id: 'vitals', label: 'Vitals & Anthropometry' },
            { id: 'labs', label: 'Labs' },
            { id: 'medications', label: 'Medications' },
            ...(isHealthcareClient || isIndividual || isPharmacy 
                ? [{ id: 'analysis', label: 'Clinical Analysis' }] 
                : []),
            { id: 'drn', label: 'DRN Assessment' },
            { id: 'plan', label: 'Ph-Asst & Plan' },
            { id: 'outcome', label: 'Outcome' },
            ...((isCompanyUser || isHealthcareClient || isIndividual || isPharmacy) 
                ? [{ id: 'cost', label: 'Cost' }] 
                : [])
        ];

        const hasActiveSubscription = user?.subscription_status === 'active';
        const isAdmin = user?.role === 'admin';

        let result = allTabs;

        // Ensure core tabs are ALWAYS included for everyone
        const alwaysVisible = ['overview', 'demographics', 'vitals', 'labs', 'analysis', 'cost'];

        if (!hasActiveSubscription && !isAdmin && !isHealthcareClient && !isIndividual && !isPharmacy) {
            // Keep alwaysVisible + others except core clinical tools
            result = allTabs.filter(tab =>
                alwaysVisible.includes(tab.id) ||
                !['plan', 'outcome', 'drn', 'medications'].includes(tab.id)
            );
        }

        return result;
    }, [user]);

    // Helper to get the primary patient identifier for display and sub-components
    const getCurrentPatientCode = useCallback(() => {
        return patient?.id || patientCode || '';
    }, [patient, patientCode]);




    // FIXED: Date validation
    const isValidDate = useCallback((dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString !== '0000-00-00';
    }, []);

    const calculateAgeInDays = useCallback((dateOfBirth) => {
        if (!dateOfBirth || !isValidDate(dateOfBirth)) return '';
        try {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);

            const diffTime = today - birthDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return diffDays.toString();
        } catch (error) {

            return '';
        }
    }, [isValidDate]);

    const calculateAge = useCallback((dateOfBirth) => {
        if (!dateOfBirth || !isValidDate(dateOfBirth)) return '';
        try {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);

            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age.toString();
        } catch (error) {

            return '';
        }
    }, [isValidDate]);

    const determinePatientType = useCallback((ageInDays) => {
        if (!ageInDays || ageInDays === '' || isNaN(parseInt(ageInDays))) {
            return 'adult';
        }

        const days = parseInt(ageInDays);

        for (const group of pediatricAgeGroups) {
            if (days >= group.minDays && days <= group.maxDays) {
                return group.type;
            }
        }

        return 'adult';
    }, [pediatricAgeGroups]);

    const formatAgeDisplay = useCallback((ageInDays, dateOfBirth) => {
        if (!dateOfBirth && !ageInDays) return '';

        let days = ageInDays;
        if (!days && dateOfBirth && isValidDate(dateOfBirth)) {
            days = calculateAgeInDays(dateOfBirth);
        }

        if (!days || isNaN(parseInt(days))) return '';

        const daysNum = parseInt(days);

        if (daysNum < 28) {
            return `${daysNum} days (Neonate)`;
        } else if (daysNum < 365) {
            const months = Math.floor(daysNum / 30.44);
            const remainingDays = Math.round(daysNum % 30.44);
            if (remainingDays > 0) {
                return `${months} months ${remainingDays} days (Infant)`;
            }
            return `${months} months (Infant)`;
        } else if (daysNum < 13 * 365) {
            const years = Math.floor(daysNum / 365);
            const months = Math.floor((daysNum % 365) / 30.44);
            if (months > 0) {
                return `${years} years ${months} months (Child)`;
            }
            return `${years} years (Child)`;
        } else if (daysNum < 19 * 365) {
            const years = Math.floor(daysNum / 365);
            return `${years} years (Adolescent)`;
        } else {
            const years = Math.floor(daysNum / 365);
            return `${years} years (Adult)`;
        }
    }, [isValidDate, calculateAgeInDays]);


    const calculateBSA = useCallback((weight, height) => {
        if (!weight || !height || parseFloat(weight) <= 0 || parseFloat(height) <= 0) return '';

        const weightNum = parseFloat(weight); // kg
        const heightNum = parseFloat(height); // cm

        const bsa = 0.007184 * Math.pow(weightNum, 0.425) * Math.pow(heightNum, 0.725);
        return bsa.toFixed(2); // BSA in m²
    }, []);

    const calculateTrimester = useCallback((weeks) => {
        if (!weeks) return '';
        const weekNum = parseInt(weeks);
        if (weekNum <= 13) return '1st Trimester';
        if (weekNum <= 27) return '2nd Trimester';
        return '3rd Trimester';
    }, []);

    // FIXED: loadPatientData with proper date validation
    const fetchClinicalHistory = useCallback(async (code) => {
        if (!code) return;
        try {
            const [vResult, lResult] = await Promise.all([
                api.get(`/vitals/patient/${code}`),
                api.get(`/labs-history/patient/${code}`)
            ]);
            if (vResult.success) setVitalsHistory(vResult.vitals || []);
            if (lResult.success) setLabsHistory(lResult.labs || []);
        } catch (err) {
        }
    }, []);

    const loadPatientData = useCallback(async (patientData, workingKey = null) => {
        if (!patientData) return;

        setIsNewPatient(false);
        setLoading(true);

        // 🔐 ZERO-KNOWLEDGE DECRYPTION
        let decryptedData = { ...patientData };
        try {
            const masterKey = await getEncryptionKey();
            const currentRole = String(user?.role || '').toLowerCase();
            // Specialists and Support staff MUST be able to load their private keys to use shared sessions
            const canLoadPrivateKey = ['healthcare_client', 'admin', 'superadmin', 'specialist', 'support'].includes(currentRole);
            const privateKey = canLoadPrivateKey ? await loadPrivateKey(masterKey) : null;

            if (workingKey) {
                decryptedData = patientData; // assume already decrypted if key provided
                setActiveKey(workingKey);
            } else if (masterKey) {
                decryptedData = await decryptPatient(decryptedData, masterKey);
                // If it actually decrypted (full_name doesn't contain ':'), we're done
                if (decryptedData.full_name && typeof decryptedData.full_name === 'string' && !decryptedData.full_name.includes(':')) {
                    // Success, no need for shared key flow
                    setActiveKey(masterKey);
                } else if (privateKey && decryptedData.shared_encryption_key) {
                    // Still encrypted, try shared specialist decryption
                    try {
                        const decryptedMasterKeyHex = await decryptWithPrivateKey(decryptedData.shared_encryption_key, privateKey);
                        const rawKeyBytes = hexToBytes(decryptedMasterKeyHex);
                        const sharedMasterKey = await crypto.subtle.importKey('raw', rawKeyBytes, { name: 'AES-GCM' }, true, ['decrypt']);
                        decryptedData = await decryptPatient(decryptedData, sharedMasterKey);
                        setActiveKey(sharedMasterKey);
                    } catch (sharedErr) {
                        console.warn('❌ [Shared Decryption] Failed in loadPatientData:', sharedErr);
                    }
                }
            } else if (privateKey && decryptedData.shared_encryption_key) {
                // No master key but has private key
                try {
                    const decryptedMasterKeyHex = await decryptWithPrivateKey(decryptedData.shared_encryption_key, privateKey);
                    const rawKeyBytes = hexToBytes(decryptedMasterKeyHex);
                    const sharedMasterKey = await crypto.subtle.importKey('raw', rawKeyBytes, { name: 'AES-GCM' }, true, ['decrypt']);
                    decryptedData = await decryptPatient(decryptedData, sharedMasterKey);
                    setActiveKey(sharedMasterKey);
                } catch (sharedErr) {
                    console.warn('❌ [Shared Decryption] Failed in loadPatientData:', sharedErr);
                }
            } else {
                // No keys, just use masterKey if available anyway (as default)
                if (masterKey) setActiveKey(masterKey);
            }
        } catch (err) {
            console.error('❌ [Decryption] Failed to decrypt patient data:', err);
        }

        setPatient(decryptedData);
        setCurrentPatientCode(decryptedData.id);
        fetchClinicalHistory(decryptedData.id);

        const data = decryptedData;

        // Consistently load labs from JSONB labs object
        let rawLabs = decryptedData.labs;
        if (typeof rawLabs === 'string') {
            try {
                rawLabs = JSON.parse(rawLabs);
            } catch (e) {
                rawLabs = {};
            }
        }
        const sourceLabs = rawLabs && typeof rawLabs === 'object' ? (rawLabs.labs || rawLabs) : {};

        const loadedCustomLabs = [];
        Object.entries(sourceLabs).forEach(([key, value]) => {
            // Handle both old format (string) and new format (object with date)
            let labValue = value;
            let labDate = null;
            
            if (typeof value === 'object' && value !== null) {
                labValue = value.value;
                labDate = value.date;
            }
            
            loadedCustomLabs.push({
                id: Date.now() + Math.random(),
                name: key,
                value: labValue,
                date: labDate
            });
        });

        const dob = data.date_of_birth;
        // Only recalculate age if DOB is present and valid, otherwise trust database values
        const hasValidDob = dob && isValidDate(dob);
        const ageInDays = hasValidDob ? calculateAgeInDays(dob) : data.age_in_days;
        const ageInYears = hasValidDob ? calculateAge(dob) : data.age;
        const patientType = determinePatientType(ageInDays);

        // 🔐 Ensure collection fields are always arrays (especially after TEXT migration)
        const ensureArray = (val) => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string' && val.startsWith('[')) {
                try { return JSON.parse(val); } catch (e) { return []; }
            }
            return [];
        };

        // Build complete form data object
        const formDataToSet = {
            ...data,
            age: ageInYears,
            age_in_days: ageInDays,
            patient_type: patientType,
            allergies: ensureArray(data.allergies),
            vaccination_status: ensureArray(data.vaccination_status),
            developmental_milestones: ensureArray(data.developmental_milestones),
            date_of_birth: (dob && isValidDate(dob)) ? dob.split('T')[0] : '',
            appointment_date: (data.appointment_date && isValidDate(data.appointment_date)) ? data.appointment_date.split('T')[0] : '',
            edd: (data.edd && isValidDate(data.edd)) ? data.edd.split('T')[0] : '',
            last_measured: (data.last_measured && isValidDate(data.last_measured)) ? data.last_measured.split('T')[0] : new Date().toISOString().split('T')[0],
            lab_test_date: null,
            // Explicitly convert is_lactating to boolean
            is_lactating: data.is_lactating === true || data.is_lactating === 'true' || data.is_lactating === 1,
            is_pregnant: data.is_pregnant === true || data.is_pregnant === 'true' || data.is_pregnant === 1
        };

        setFormData(formDataToSet);

        // Merge Custom Labs with Global Definitions
        if (globalLabDefinitions && globalLabDefinitions.length > 0) {
            const existingMap = new Map();

            // Add dynamic/custom lab values to the lookup map
            loadedCustomLabs.forEach(l => {
                // Normalize name for lookup (replace spaces with underscores to match DB keys)
                const name = (l.name || '').toLowerCase().trim().replace(/\s+/g, '_');
                if (name && l.value !== undefined && l.value !== null && l.value !== '') {
                    existingMap.set(name, l);
                }
            });

            const merged = globalLabDefinitions.map(g => {
                const nameKey = (g.name || '').toLowerCase().trim().replace(/\s+/g, '_');
                const existing = existingMap.get(nameKey);
                return {
                    id: 'global-' + g.id,
                    name: g.name,
                    value: existing ? existing.value : '',
                    date: existing ? existing.date : null,
                    isGlobal: true,
                    unit: g.unit,
                    reference_range: g.reference_range,
                    category: g.category,
                    description: g.description
                };
            });

            const globalNames = new Set(globalLabDefinitions.map(g => (g.name || '').toLowerCase().trim().replace(/\s+/g, '_')));
            const nonGlobals = loadedCustomLabs.filter(l => {
                const name = (l.name || '').toLowerCase().trim().replace(/\s+/g, '_');
                return name && !globalNames.has(name);
            });

            setCustomLabs([...merged, ...nonGlobals]);
        } else {
            setCustomLabs(loadedCustomLabs);
        }

        // Set age mode
        if (ageInDays && parseInt(ageInDays) < 365) {
            setAgeMode('days');
            setShowPediatricLabs(true);
        } else {
            setAgeMode('years');
            setShowPediatricLabs(false);
        }

        setPatient(decryptedData);
        setCurrentPatientCode(decryptedData.id);
    }, [isValidDate, calculateAgeInDays, calculateAge, determinePatientType, setCustomLabs, globalLabDefinitions, fetchClinicalHistory]);

    // FIXED: fetchPatientData with better error handling
    const fetchPatientData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);



            // CASE 0: Creating a new patient
            const isNewPatientRoute = patientCode === 'new' || location.pathname.endsWith('/patients/new');

            if (isNewPatientRoute) {

                setIsNewPatient(true);
                setIsEditing(true);

                const today = new Date().toISOString().split('T')[0];
                setFormData(prev => ({
                    ...prev,
                    last_measured: today,
                    lab_test_date: null,
                    is_active: true,
                    allergies: [],
                    patient_type: 'adult'
                }));

                setLoading(false);
                return;
            }

            // CASE 1: Invalid or missing patientCode
            if (!isNewPatientRoute && (!patientCode || patientCode === 'undefined' || patientCode === 'null')) {
                setError('No patient selected. Please select a patient from the list.');
                setLoading(false);
                // Redirect to create new patient instead of showing error
                if (propPatientCode === undefined) {
                    navigate('/patients/new');
                }
                return;
            }

            // CASE 2: Fetching existing patient


            try {
                // Use the generic identifier route which supports both ID and Code
                const result = await api.get(`/patients/${patientCode}`);


                if (result.success && result.patient) {
                    setPatientOwnerSalt(result.owner_salt || null);

                    // 🔐 ZERO-KNOWLEDGE: Decrypt the patient before loading
                    // We let loadPatientData handle all decryption logic (Single Source of Truth)
                    loadPatientData(result.patient);

                    const searchParams = new URLSearchParams(location.search);
                    if (searchParams.get('edit') === 'true') {
                        setIsEditing(true);
                    }
                } else {
                    setError('Hypothetical Case not found. Please check the Case No.');
                    setIsNewPatient(true);
                    setIsEditing(true);
                }
            } catch (apiError) {

                const errorMsg = apiError?.error || apiError?.message || 'Server error';
                const isNotFound = apiError?.status === 404 || errorMsg.toLowerCase().includes('not found');

                if (isNotFound) {
                    setError('Case not found. You can create a new case instead.');
                    setIsNewPatient(true);
                    setIsEditing(true);
                } else {
                    setError(`Failed to load patient: ${errorMsg}`);
                }
            }
        } catch (error) {

            setError(`Error loading patient: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }, [patientCode, navigate, location.search, location.pathname, loadPatientData]);

    // Create a memoized change handler for lab inputs
    const handleLabInputChange = useCallback((field, value) => {


        // For numeric fields, allow empty string or valid numbers
        const numericFields = [
            'hemoglobin', 'hematocrit', 'wbc_count', 'rbc_count', 'platelet_count',
            'mcv', 'mch', 'mchc', 'rdw', 'neutrophils', 'lymphocytes', 'monocytes',
            'eosinophils', 'basophils', 'blood_sugar', 'creatinine', 'urea', 'uric_acid',
            'sodium', 'potassium', 'chloride', 'bicarbonate', 'calcium', 'magnesium',
            'phosphate', 'alt', 'ast', 'alp', 'ggt', 'bilirubin_total', 'bilirubin_direct',
            'bilirubin_indirect', 'albumin', 'total_protein', 'troponin', 'ck_mb', 'ldh',
            'myoglobin', 'tsh', 'free_t4', 'free_t3', 'total_t4', 'total_t3', 'crp', 'esr',
            'ferritin', 'procalcitonin', 'inr', 'pt', 'ptt', 'fibrinogen', 'd_dimer',
            'urine_specific_gravity', 'urine_ph', 'urine_urobilinogen', 'hba1c',
            'fasting_glucose', 'postprandial_glucose', 'random_glucose', 'insulin',
            'c_peptide', 'total_cholesterol', 'hdl_cholesterol', 'ldl_cholesterol',
            'triglycerides', 'vldl_cholesterol', 'egfr', 'bun', 'bilirubin_neonatal',
            'glucose_neonatal', 'calcium_neonatal'
        ];

        if (numericFields.includes(field)) {
            if (value === '' || value === null || value === undefined) {
                setFormData(prev => ({
                    ...prev,
                    [field]: ''
                }));
                return;
            }

            // Allow decimal numbers and partial typing
            if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                setFormData(prev => ({
                    ...prev,
                    [field]: value
                }));
            }
            return;
        }

        // For text fields
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // Create a memoized change handler for vitals inputs
    const handleVitalsInputChange = useCallback((field, value) => {


        // Handle weight and height for BSA calculation
        if (field === 'weight' || field === 'height') {
            const newWeight = field === 'weight' ? value : formData.weight;
            const newHeight = field === 'height' ? value : formData.height;
            const newBSA = calculateBSA(newWeight, newHeight);

            setFormData(prev => ({
                ...prev,
                [field]: value,
                bsa: newBSA
            }));
            return;
        }

        // For numeric vitals fields
        const numericVitals = ['heart_rate', 'temperature', 'respiratory_rate',
            'oxygen_saturation', 'weight', 'height', 'length',
            'head_circumference'];

        if (numericVitals.includes(field)) {
            if (value === '' || value === null || value === undefined) {
                setFormData(prev => ({
                    ...prev,
                    [field]: ''
                }));
                return;
            }

            // Allow decimal for temperature and weight
            if (field === 'temperature' || field === 'weight') {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    setFormData(prev => ({
                        ...prev,
                        [field]: value
                    }));
                }
            } else {
                // For other numeric fields
                const numValue = parseInt(value);
                if (!isNaN(numValue)) {
                    setFormData(prev => ({
                        ...prev,
                        [field]: value
                    }));
                }
            }
            return;
        }

        // For text fields like blood pressure
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, [formData.weight, formData.height, calculateBSA]);

    const handleInputChange = useCallback((field, value) => {


        // Handle date fields with validation
        if (field === 'date_of_birth' && value) {
            if (!isValidDate(value)) {
                setFormData(prev => ({
                    ...prev,
                    [field]: ''
                }));
                return;
            }

            const ageInDays = calculateAgeInDays(value);
            const ageInYears = calculateAge(value);
            const patientType = determinePatientType(ageInDays);

            setFormData(prev => ({
                ...prev,
                [field]: value,
                age_in_days: ageInDays,
                age: ageInYears,
                patient_type: patientType
            }));

            if (ageInDays && parseInt(ageInDays) < 365) {
                setAgeMode('days');
                setShowPediatricLabs(true);
            } else {
                setAgeMode('years');
                setShowPediatricLabs(false);
            }
            return;
        }

        if (field === 'age_in_days') {
            const patientType = determinePatientType(value);
            const years = value ? Math.floor(parseInt(value) / 365) : '';

            setFormData(prev => ({
                ...prev,
                [field]: value,
                age: years.toString(),
                patient_type: patientType
            }));

            if (value && parseInt(value) < 365) {
                setAgeMode('days');
                setShowPediatricLabs(true);
            } else {
                setAgeMode('years');
                setShowPediatricLabs(false);
            }
            return;
        }

        if (field === 'age') {
            const days = value ? parseInt(value) * 365 : '';
            const patientType = determinePatientType(days.toString());

            setFormData(prev => ({
                ...prev,
                [field]: value,
                age_in_days: days.toString(),
                patient_type: patientType
            }));

            if (value && parseInt(value) < 1) {
                setAgeMode('days');
                setShowPediatricLabs(true);
            } else {
                setAgeMode('years');
                setShowPediatricLabs(false);
            }
            return;
        }

        if (field === 'pregnancy_weeks') {
            const newTrimester = calculateTrimester(value);
            setFormData(prev => ({
                ...prev,
                [field]: value,
                pregnancy_trimester: newTrimester
            }));
            return;
        }

        // Handle date fields
        if (field.includes('date') || field === 'edd' || field === 'appointment_date') {
            if (value && !isValidDate(value)) {
                // Don't update if invalid
                return;
            }
        }

        // For basic text/number fields in demographics
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, [isValidDate, calculateAgeInDays, calculateAge, determinePatientType, calculateTrimester]);

    const handleAddAllergy = useCallback(() => {
        if (newAllergy.trim() === '') return;

        const allergyText = newAllergy.trim();
        if (!formData.allergies.includes(allergyText)) {
            setFormData(prev => ({
                ...prev,
                allergies: [...prev.allergies, allergyText]
            }));
        }
        setNewAllergy('');
    }, [newAllergy, formData.allergies]);

    const checkSupportStatus = useCallback(async () => {
        if (!patientCode || isNewPatient) return;
        try {
            const res = await api.get(`/access/granted?patient_id=${patientCode}`);
            if (res.success && res.request) {
                setSupportActivated(true);
            } else {
                setSupportActivated(false);
            }
        } catch (err) {
            console.error('Failed to check support status:', err);
        }
    }, [patientCode, isNewPatient]);

    const handleDeactivateSupport = async () => {
        if (!window.confirm('Are you sure you want to terminate the active support session? The specialist will lose all access to this record immediately.')) return;
        
        try {
            setLoading(true);
            const res = await api.post('/access/revoke-support', { patient_id: patientCode });
            if (res.success) {
                setSupportActivated(false);
                alert('Support access revoked successfully.');
            }
        } catch (err) {
            alert('Failed to revoke support: ' + (err.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBack = useCallback(() => {
        if (propOnBack) {
            propOnBack();
        } else {
            navigate('/patients');
        }
    }, [navigate, propOnBack]);

    // Network and backend status monitoring
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const checkBackendStatus = async () => {
            try {
                const result = await api.get('/health');
                setBackendStatus(result ? 'online' : 'offline');
            } catch (error) {
                setBackendStatus('offline');
            }
        };

        // Initial check
        checkBackendStatus();

        // Check every 30 seconds
        const intervalId = setInterval(checkBackendStatus, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };
    }, []);

    // Initialize component
    useEffect(() => {
        const isNewPatientRoute = patientCode === 'new' || location.pathname.endsWith('/patients/new');

        if (isNewPatientRoute || (patientCode && patientCode !== 'undefined' && patientCode !== 'null')) {
            const searchParams = new URLSearchParams(location.search);
            const isEditMode = searchParams.get('edit') === 'true';

            if (isEditMode || isNewPatientRoute) {
                setIsEditing(true);
            }

            fetchPatientData();
        } else {
            // If patientCode is invalid, show error immediately
            setError('No patient selected. Please select a patient from the list.');
            setLoading(false);
        }

        // Clean up sessionStorage on unmount
        return () => {
            sessionStorage.removeItem('editPatientData');
            sessionStorage.removeItem('editPatientCode');
        };
    }, [patientCode, location.search, fetchPatientData]);

    const handleRemoveAllergy = useCallback((index) => {
        setFormData(prev => ({
            ...prev,
            allergies: prev.allergies.filter((_, i) => i !== index)
        }));
    }, []);

    // Get pediatric normal range
    const getPediatricNormalRange = useCallback((measurement, ageInDays) => {
        if (!ageInDays) return '';
        const days = parseInt(ageInDays);

        if (measurement === 'heart_rate') {
            if (days < 28) return '120-160 bpm';
            if (days < 365) return '100-140 bpm';
            if (days < 6 * 365) return '75-115 bpm';
            if (days < 12 * 365) return '70-110 bpm';
            if (days < 18 * 365) return '60-100 bpm';
            return '60-100 bpm';
        }

        if (measurement === 'respiratory_rate') {
            if (days < 28) return '40-60 breaths/min';
            if (days < 365) return '30-40 breaths/min';
            if (days < 6 * 365) return '20-30 breaths/min';
            if (days < 12 * 365) return '18-25 breaths/min';
            if (days < 18 * 365) return '12-20 breaths/min';
            return '12-20 breaths/min';
        }

        if (measurement === 'blood_pressure') {
            if (days < 28) return '65/45 mmHg';
            if (days < 365) return '80/55 mmHg';
            if (days < 6 * 365) return '95/60 mmHg';
            if (days < 12 * 365) return '105/65 mmHg';
            if (days < 18 * 365) return '110/70 mmHg';
            return '120/80 mmHg';
        }

        return '';
    }, []);

    // Test backend connection
    const testBackendConnection = useCallback(async () => {
        try {
            const result = await api.get('/health');
            if (result) {
                setBackendStatus('online');
                return true;
            }
            setBackendStatus('offline');
            return false;
        } catch (error) {
            setBackendStatus('offline');
            return false;
        }
    }, []);

    // Add this function BEFORE handleSave (outside of it)
    const checkPatientLimit = useCallback(async () => {
        if (!isNewPatient) return true; // Only check for new patients

        // Company users have no limits - skip check entirely
        const isCompanyUser = !!user?.company_id ||
            user?.account_type === 'company' ||
            ['company_admin', 'company_user'].includes(user?.role);

        if (isCompanyUser) {
            return true; // Company users can add unlimited patients
        }

        // Only check limits for individual users
        if (user?.account_type === 'individual') {
            try {
                // Get current patient count for this user
                const result = await api.get('/patients/count');

                if (result.success) {
                    const currentCount = result.count;

                    // Check user role and set limit
                    const isPharmacistOrStudent = user?.role === 'pharmacist' || user?.role === 'pharmacy_student';

                    const limit = isPharmacistOrStudent ? 5 : 1;

                    if (currentCount >= limit) {
                        alert(
                            `❌ Case Limit Reached\n\n` +
                            `You have reached your maximum of ${limit} case${limit > 1 ? 's' : ''}.\n\n` +
                            `Current: ${currentCount}/${limit} cases\n\n` +
                            `${isPharmacistOrStudent ?
                                'As a pharmacist or pharmacy student, you can manage up to 5 cases. To review medications for additional cases, you may update or modify the existing data.' :
                                'This subscription is limited to 1 case. To review medications for additional cases, you may update or modify the existing data..'}`
                        );
                        return false;
                    }
                }
                return true;
            } catch (error) {
                console.error('Error checking patient limit:', error);
                return true; // Allow if we can't check (fallback)
            }
        }

        // For any other user types (admins, etc.), allow
        return true;
    }, [isNewPatient, user]);

    // Then fix the handleSave function
    const handleSave = useCallback(async (section = 'all') => {
        try {
            // For new patients, check patient limit first
            if (isNewPatient) {
                const canProceed = await checkPatientLimit();
                if (!canProceed) {
                    return;
                }
            }

            // For new patients, validate required fields
            if (isNewPatient) {
                const isIndividual = user?.account_type === 'individual' && user?.role !== 'admin';

                if (!isIndividual) {
                    if (!formData.full_name || formData.full_name.trim() === '') {
                        alert('Please enter patient name');
                        return;
                    }
                }
            }

            let saveIdentifier = currentPatientCode || patientCode;
            const isRestrictedIndividual = user?.account_type === 'individual' && !user?.company_id && user?.role !== 'admin';

            if (isNewPatient && isRestrictedIndividual) {
                formData.full_name = 'MR profile';
            }

            // Validate we have a patient identifier for updates
            if (!isNewPatient && !patient?.id) {
                alert('Patient identifier missing. Please reload or go back to MR list.');
                return;
            }

            // Calculate ages
            let ageInDays = formData.age_in_days;
            let ageInYears = formData.age;

            if (formData.date_of_birth) {
                if (!isValidDate(formData.date_of_birth)) {
                    alert('Invalid date of birth');
                    return;
                }
                if (!ageInDays) ageInDays = calculateAgeInDays(formData.date_of_birth);
                if (!ageInYears) ageInYears = calculateAge(formData.date_of_birth);
            }

            const patientType = formData.patient_type || determinePatientType(ageInDays);

            // Helper functions
            const cleanNumber = (value) => {
                if (value === '' || value === null || value === undefined) return null;
                const num = parseFloat(value);
                return isNaN(num) ? null : num;
            };

            const cleanDate = (value) => {
                if (!value || value === '' || !isValidDate(value)) return null;
                try {
                    return new Date(value).toISOString().split('T')[0];
                } catch (error) {
                    return null;
                }
            };

            const cleanText = (value) => {
                if (!value || value === '') return null;
                if (typeof value !== 'string') return value;
                const trimmed = value.trim();
                return trimmed === '' ? null : trimmed;
            };

            // Validate labs have dates before saving
            const labsWithoutDate = customLabs.filter(lab => lab.value && lab.value.trim() !== '' && !lab.date);
            if (labsWithoutDate.length > 0) {
                alert(`Please select a test date for: ${labsWithoutDate.map(l => l.name).join(', ')}`);
                return;
            }

            // COMPLETE section data with ALL fields
            const sectionData = {
                basic: {
                    full_name: cleanText(formData.full_name),
                    age: cleanNumber(ageInYears),
                    age_in_days: cleanNumber(ageInDays),
                    gender: cleanText(formData.gender),
                    date_of_birth: cleanDate(formData.date_of_birth),
                    contact_number: cleanText(formData.contact_number),
                    address: cleanText(formData.address),
                    diagnosis: cleanText(formData.diagnosis),
                    appointment_date: cleanDate(formData.appointment_date),
                    is_active: formData.is_active !== false,
                    allergies: Array.isArray(formData.allergies) ? formData.allergies.filter(a => a && typeof a === 'string' && a.trim() !== '') : [],
                    patient_type: patientType,
                    is_pregnant: formData.is_pregnant || false,
                    pregnancy_weeks: cleanNumber(formData.pregnancy_weeks),
                    pregnancy_trimester: cleanText(formData.pregnancy_trimester),
                    edd: cleanDate(formData.edd),
                    pregnancy_notes: cleanText(formData.pregnancy_notes),
                    is_lactating: formData.is_lactating || false,
                    lactation_notes: cleanText(formData.lactation_notes),
                    // Pediatric extras moved from vitals to basic demographics
                    feeding_method: cleanText(formData.feeding_method),
                    birth_weight: cleanNumber(formData.birth_weight),
                    birth_length: cleanNumber(formData.birth_length),
                    vaccination_status: cleanText(formData.vaccination_status),
                    special_instructions: cleanText(formData.special_instructions),
                    developmental_milestones: cleanText(formData.developmental_milestones),
                },

                vitals: {
                    blood_pressure: cleanText(formData.blood_pressure),
                    heart_rate: cleanNumber(formData.heart_rate),
                    temperature: cleanNumber(formData.temperature),
                    respiratory_rate: cleanNumber(formData.respiratory_rate),
                    oxygen_saturation: cleanNumber(formData.oxygen_saturation),
                    weight: cleanNumber(formData.weight),
                    height: cleanNumber(formData.height),
                    length: cleanNumber(formData.length),
                    head_circumference: cleanNumber(formData.head_circumference),
                    bsa: cleanNumber(formData.bsa),
                    last_measured: cleanDate(formData.last_measured),
                    weight_percentile: cleanNumber(formData.weight_percentile),
                    height_percentile: cleanNumber(formData.height_percentile),
                    head_circumference_percentile: cleanNumber(formData.head_circumference_percentile),
                    bsa_percentile: cleanNumber(formData.bsa_percentile),
                },

                labs: {
                    labs: (() => {
                        const allLabsData = {};

                        // Add dynamic Custom/Global Labs from customLabs state
                        customLabs.forEach(lab => {
                            if (lab.name && lab.name.trim() !== '' && lab.value !== '') {
                                // Normalize key for saving (matches explicitLabFields and database columns)
                                const key = lab.name.toLowerCase().trim().replace(/\s+/g, '_');
                                // Store as object with value and individual date
                                allLabsData[key] = {
                                    value: lab.value,
                                    date: lab.date
                                };
                            }
                        });

                        return allLabsData;
                    })(),
                    lab_test_date: null
                }
            };

            // Combine based on section
            let patientData = {};

            if (section === 'all' || isNewPatient) {
                patientData = {
                    ...sectionData.basic,
                    ...sectionData.vitals,
                    labs: sectionData.labs.labs, // Keep inside JSONB object
                    lab_test_date: null
                };
            } else if (section === 'vitals') {
                patientData = { ...sectionData.basic, ...sectionData.vitals };
            } else if (section === 'labs') {
                patientData = {
                    ...sectionData.basic,
                    labs: sectionData.labs.labs, // Keep inside JSONB object
                    lab_test_date: null
                };
            } else if (section === 'basic') {
                patientData = sectionData.basic;
            }

            // Clean data
            const cleanedPatientData = {};
            Object.keys(patientData).forEach(key => {
                if (patientData[key] !== null && patientData[key] !== undefined) {
                    cleanedPatientData[key] = patientData[key];
                }
            });

            // 🔐 ENCRYPT sensitive fields before sending to server
            let dataToSave = cleanedPatientData;
            try {
                const encKey = await getEncryptionKey();
                if (encKey) {
                    dataToSave = await encryptPatient(cleanedPatientData, encKey);
                }
            } catch (encErr) {
                console.warn('⚠️ Encryption failed, saving unencrypted:', encErr.message);
            }

            // API call
            let result;
            if (isNewPatient) {
                result = await api.post('/patients', dataToSave);
            } else {
                // Use the primary identifier (id) for updates
                result = await api.put(`/patients/${patient.id}`, dataToSave);
            }

            if (result.success) {
                const savedPatient = result.patient || result.data;

                // ✅ CRITICAL FIX: Use loadPatientData to properly unfold the labs JSONB
                // back into the individual form fields after a successful save.
                await loadPatientData(savedPatient);

                if (setPatient) setPatient(savedPatient);
                // setCurrentPatientCode is legacy but we'll set it to ID to keep UI working
                setCurrentPatientCode(savedPatient.id);

                if (isNewPatient) {
                    setIsNewPatient(false);
                }

                // Fetch clinical history too
                fetchClinicalHistory(savedPatient.id);

                if (section === 'all' || isNewPatient) {
                    setIsEditing(false);
                }

                alert(isNewPatient ? 'Case created successfully!' : 'Case updated successfully!');

                if (patientCode === 'new' && isNewPatient) {
                    if (onPatientCreated) {
                        onPatientCreated(savedPatient.id || savedPatient.patient_code);
                    } else if (propOnBack) {
                        propOnBack();
                    } else {
                        navigate(`/patients/${savedPatient.id}`);
                    }
                }

                // --- PUSH TO HISTORY TABLES ---
                try {
                    if (section === 'vitals' || section === 'all' || isNewPatient) {
                        const hasVitals = ['blood_pressure', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight', 'height'].some(k => formData[k]);
                        if (hasVitals) {
                            await api.post('/vitals', {
                                patient_id: savedPatient.id,
                                ...sectionData.vitals,
                                recorded_at: new Date().toISOString()
                            });
                        }
                    }
                    if (section === 'labs' || section === 'all' || isNewPatient) {
                        const hasLabs = Object.keys(sectionData.labs.labs).length > 0;
                        if (hasLabs) {
                            // Group labs by their individual dates
                            const labsByDate = {};
                            Object.entries(sectionData.labs.labs).forEach(([key, labData]) => {
                                const date = labData.date;
                                if (!labsByDate[date]) labsByDate[date] = {};
                                labsByDate[date][key] = labData.value;
                            });
                            
                            // Save each date group separately to history
                            for (const [testDate, labsForDate] of Object.entries(labsByDate)) {
                                // Check if entry for this date already exists
                                const existingEntry = labsHistory.find(h => h.test_date === testDate);
                                
                                if (existingEntry) {
                                    // Merge with existing entry
                                    const existingLabs = typeof existingEntry.labs === 'string' ? JSON.parse(existingEntry.labs) : existingEntry.labs;
                                    const mergedLabs = { ...existingLabs, ...labsForDate };
                                    await api.put(`/labs-history/${existingEntry.id}`, {
                                        labs: mergedLabs,
                                        test_date: testDate,
                                        recorded_at: new Date().toISOString()
                                    });
                                } else {
                                    // Create new entry
                                    await api.post('/labs-history', {
                                        patient_id: savedPatient.id,
                                        labs: labsForDate,
                                        test_date: testDate,
                                        recorded_at: new Date().toISOString()
                                    });
                                }
                            }
                        }
                    }
                    // Refresh history using the primary ID
                    fetchClinicalHistory(savedPatient.id);
                } catch (histError) {
                    console.error('Error saving to history:', histError);
                }

            } else {
                throw new Error(result.error || 'Save failed');
            }

        } catch (error) {
            console.error('Save error:', error);

            // Check if it's a patient limit error
            const errorMsg = error.error || error.message || (error.response?.data?.error) || (error.response?.data?.message) || 'Failed';

            if (error.status === 403 || error.response?.status === 403) {
                alert(
                    `❌ Case Limit Reached\n\n` +
                    `${errorMsg}\n\n` +
                    `To add more patients, please upgrade to a Company subscription.`
                );
            } else {
                alert('Error saving patient: ' + errorMsg);
            }
        }
    }, [isNewPatient, formData, navigate, patientCode, isValidDate, calculateAgeInDays, calculateAge, determinePatientType, customLabs, fetchClinicalHistory, checkPatientLimit, loadPatientData, user, labsHistory]);

    // Helper functions
    const handleSaveAll = useCallback(() => handleSave('all'), [handleSave]);
    const handleSaveVitals = useCallback(() => handleSave('vitals'), [handleSave]);
    const handleSaveLabs = useCallback(() => handleSave('labs'), [handleSave]);
    const handleSaveDemographics = useCallback(() => handleSave('basic'), [handleSave]);

    const handleDelete = useCallback(async () => {
        if (!window.confirm('Are you sure you want to delete this patient? All related data will be lost.')) {
            return;
        }

        if (!patient?.id) {
            alert('Error: Patient ID is missing');
            return;
        }

        try {
            // Updated to use the direct ID endpoint for deletion
            const result = await api.delete(`/patients/${patient.id}`);

            if (result.success) {
                alert('Patient deleted successfully!');
                if (propOnBack) {
                    propOnBack();
                } else {
                    navigate('/patients');
                }
            } else {
                throw new Error(result.error || 'Failed to delete patient');
            }
        } catch (error) {
            alert('Error deleting patient: ' + (error.message || 'Failed'));
        }
    }, [getCurrentPatientCode, navigate]);

    // Retry fetching data
    const handleRetry = useCallback(() => {
        setRetryCount(0);
        fetchPatientData();
    }, [fetchPatientData]);

    // ==========================================================
    // VITALS SECTION — compact grid, no icons
    // ==========================================================
    const renderVitalsSection = useCallback(() => {
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        const ageInDays = parseInt(formData.age_in_days) || 0;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Vital Signs {isPediatric && <span className="text-pink-600">(Pediatric)</span>}
                        </h2>
                        <p className="text-gray-600 text-sm">
                            {isPediatric
                                ? 'Pediatric vital signs with age-appropriate ranges'
                                : 'Record and monitor vital signs'}
                        </p>
                    </div>
                    {isEditing && (
                        <button
                            onClick={handleSaveVitals}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <FaSave /> Save Vitals
                        </button>
                    )}
                </div>

                {isPediatric && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-2 mb-3 border border-pink-200">
                        <h3 className="font-bold text-pink-800 text-sm">
                            {formData.patient_type ? formData.patient_type.toUpperCase() : 'Pediatric'} Patient
                        </h3>
                        <p className="text-pink-700 text-xs">
                            Age: {formatAgeDisplay(formData.age_in_days, formData.date_of_birth)}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Blood Pressure */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="block text-xs font-medium text-gray-700">Blood Pressure</label>
                            {isPediatric && (
                                <span className="text-[10px] text-gray-500">
                                    {getPediatricNormalRange('blood_pressure', formData.age_in_days)}
                                </span>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.blood_pressure || ''}
                                onChange={(e) => handleVitalsInputChange('blood_pressure', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                placeholder={isPediatric ? "80/55" : "120/80"}
                            />
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800 text-sm">
                                        {formData.blood_pressure || '--/--'}
                                    </span>
                                    <span className="text-[10px] text-gray-500">mmHg</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Heart Rate */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="block text-xs font-medium text-gray-700">Heart Rate</label>
                            {isPediatric && (
                                <span className="text-[10px] text-gray-500">
                                    {getPediatricNormalRange('heart_rate', formData.age_in_days)}
                                </span>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="number"
                                value={formData.heart_rate || ''}
                                onChange={(e) => handleVitalsInputChange('heart_rate', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                placeholder={isPediatric ? "120" : "72"}
                            />
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800 text-sm">
                                        {formData.heart_rate || '--'}
                                    </span>
                                    <span className="text-[10px] text-gray-500">bpm</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Temperature */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Temperature</label>
                        {isEditing ? (
                            <input
                                type="number"
                                step="0.1"
                                value={formData.temperature || ''}
                                onChange={(e) => handleVitalsInputChange('temperature', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                placeholder="36.5"
                            />
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800 text-sm">
                                        {formData.temperature || '--'}
                                    </span>
                                    <span className="text-[10px] text-gray-500">°C</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Respiratory Rate */}
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <label className="block text-xs font-medium text-gray-700">Resp. Rate</label>
                            {isPediatric && (
                                <span className="text-[10px] text-gray-500">
                                    {getPediatricNormalRange('respiratory_rate', formData.age_in_days)}
                                </span>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="number"
                                value={formData.respiratory_rate || ''}
                                onChange={(e) => handleVitalsInputChange('respiratory_rate', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                placeholder={isPediatric ? "40" : "16"}
                            />
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800 text-sm">
                                        {formData.respiratory_rate || '--'}
                                    </span>
                                    <span className="text-[10px] text-gray-500">/min</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SpO2 */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">SpO₂</label>
                        {isEditing ? (
                            <input
                                type="number"
                                value={formData.oxygen_saturation || ''}
                                onChange={(e) => handleVitalsInputChange('oxygen_saturation', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                placeholder="98"
                                min="0"
                                max="100"
                            />
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800 text-sm">
                                        {formData.oxygen_saturation || '--'}
                                    </span>
                                    <span className="text-[10px] text-gray-500">%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Weight */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Weight</label>
                        {isEditing ? (
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.weight || ''}
                                    onChange={(e) => handleVitalsInputChange('weight', e.target.value)}
                                    className="flex-1 min-w-0 border border-gray-300 rounded-lg p-1.5 text-sm"
                                    placeholder={isPediatric ? "3.5" : "70"}
                                />
                                <div className="w-10 bg-gray-100 border border-gray-300 rounded-lg p-1.5 text-center text-xs text-gray-700">kg</div>
                            </div>
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200 text-sm">
                                <span className="font-medium text-gray-800">{formData.weight || '--'} kg</span>
                            </div>
                        )}
                    </div>

                    {/* Height / Length */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                            {isPediatric && ageInDays < 730 ? 'Length' : 'Height'}
                        </label>
                        {isEditing ? (
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={isPediatric && ageInDays < 730 ? (formData.length || '') : (formData.height || '')}
                                    onChange={(e) => handleVitalsInputChange(
                                        isPediatric && ageInDays < 730 ? 'length' : 'height',
                                        e.target.value
                                    )}
                                    className="flex-1 min-w-0 border border-gray-300 rounded-lg p-1.5 text-sm"
                                    placeholder={isPediatric ? "50" : "170"}
                                />
                                <div className="w-10 bg-gray-100 border border-gray-300 rounded-lg p-1.5 text-center text-xs text-gray-700">cm</div>
                            </div>
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200 text-sm">
                                <span className="font-medium text-gray-800">
                                    {(isPediatric && ageInDays < 730 ? formData.length : formData.height) || '--'} cm
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Head Circumference (Pediatric) */}
                    {isPediatric && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">Head Circ.</label>
                            {isEditing ? (
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.head_circumference || ''}
                                        onChange={(e) => handleVitalsInputChange('head_circumference', e.target.value)}
                                        className="flex-1 min-w-0 border border-gray-300 rounded-lg p-1.5 text-sm"
                                        placeholder="35"
                                    />
                                    <div className="w-10 bg-gray-100 border border-gray-300 rounded-lg p-1.5 text-center text-xs text-gray-700">cm</div>
                                </div>
                            ) : (
                                <div className="p-1.5 bg-red-50 rounded-lg border border-red-200 text-sm">
                                    <span className="font-medium text-gray-800">{formData.head_circumference || '--'} cm</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BSA */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">BSA</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.bsa || ''}
                                readOnly
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm bg-gray-100"
                                placeholder="Auto"
                            />
                        ) : (
                            <div className="p-1.5 bg-red-50 rounded-lg border border-red-200 text-sm">
                                <span className="font-medium text-gray-800">{formData.bsa || '--'}</span>
                                <span className="text-[10px] text-gray-500 ml-1">m²</span>
                            </div>
                        )}
                    </div>

                    {/* Last Measured */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Last Measured</label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={formData.last_measured || ''}
                                onChange={(e) => handleInputChange('last_measured', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                            />
                        ) : (
                            <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                {formData.last_measured ? new Date(formData.last_measured).toLocaleDateString() : <span className="text-gray-500 italic">Not recorded</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Vitals History Table */}
                {!isNewPatient && vitalsHistory.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800">Previous Vitals Records</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">BP</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">HR</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Temp</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">SpO₂</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {vitalsHistory.map((h, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                                {new Date(h.created_at || h.recorded_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{h.blood_pressure || '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{h.heart_rate || '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{h.temperature ? `${h.temperature}°C` : '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{h.oxygen_saturation ? `${h.oxygen_saturation}%` : '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{h.weight ? `${h.weight}kg` : '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                                                <button
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, ...h }));
                                                        alert('Historical vitals copied to form.');
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 text-xs"
                                                    title="Copy to current session"
                                                >
                                                    Copy
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }, [formData, isEditing, handleSaveVitals, formatAgeDisplay, getPediatricNormalRange, handleVitalsInputChange, handleInputChange, vitalsHistory, isNewPatient]);

    // ==========================================================
    // LABS SECTION — compact grid, no icons
    // ==========================================================
    const renderLabsSection = useCallback(() => {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Laboratory Results</h2>
                        <p className="text-gray-600 text-sm">Complete laboratory test results</p>
                    </div>
                    {isEditing && (
                        <button
                            onClick={handleSaveLabs}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <FaSave /> Save Labs
                        </button>
                    )}
                </div>

                {/* --- GLOBAL ADMIN DEFINED LABS (Grouped by Category) --- */}
                {(() => {
                    const globals = customLabs.filter(l => l.isGlobal);
                    const categories = [...new Set(globals.map(g => g.category || 'Other'))];

                    return categories.map(cat => {
                        const labsInCat = globals.filter(g => (g.category || 'Other') === cat);
                        if (labsInCat.length === 0) return null;

                        return (
                            <div key={cat} className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-900 mb-2 border-b border-indigo-50 pb-1">
                                    {cat}
                                    <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full uppercase ml-2 tracking-wider">System</span>
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                    {labsInCat.map((lab) => {
                                        const labIndex = customLabs.findIndex(l => l.id === lab.id);
                                        return (
                                            <div key={lab.id} className="relative group">
                                                <LabInputField
                                                    label={lab.name}
                                                    value={lab.value}
                                                    labDate={lab.date}
                                                    unit={lab.unit}
                                                    normalRange={lab.reference_range}
                                                    isEditing={isEditing}
                                                    placeholder="Result"
                                                    type="text"
                                                    handleChange={(_, val) => {
                                                        const updated = [...customLabs];
                                                        updated[labIndex].value = val;
                                                        setCustomLabs(updated);
                                                    }}
                                                    handleDateChange={(date) => {
                                                        const updated = [...customLabs];
                                                        updated[labIndex].date = date;
                                                        setCustomLabs(updated);
                                                    }}
                                                />
                                                {lab.description && (
                                                    <div className="hidden group-hover:block absolute z-10 top-full left-0 mt-1 p-1.5 bg-gray-800 text-white text-[10px] rounded shadow-lg max-w-[180px]">
                                                        {lab.description}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    });
                })()}

                <div className="space-y-4">
                    {/* --- NON-GLOBAL CUSTOM LABS --- */}
                    {customLabs.filter(l => !l.isGlobal).length > 0 && (
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-2 border-b pb-1">Additional Tests</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                {customLabs.filter(l => !l.isGlobal).map((lab) => {
                                    const labIndex = customLabs.findIndex(l => l.id === lab.id);
                                    return (
                                        <LabInputField
                                            key={lab.id}
                                            label={lab.name}
                                            value={lab.value}
                                            labDate={lab.date}
                                            unit={lab.unit}
                                            normalRange={lab.reference_range}
                                            isEditing={isEditing}
                                            placeholder="Result"
                                            handleChange={(_, val) => {
                                                const updated = [...customLabs];
                                                if (labIndex !== -1) {
                                                    updated[labIndex].value = val;
                                                    setCustomLabs(updated);
                                                }
                                            }}
                                            handleDateChange={(date) => {
                                                const updated = [...customLabs];
                                                if (labIndex !== -1) {
                                                    updated[labIndex].date = date;
                                                    setCustomLabs(updated);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Labs History Table */}
                {!isNewPatient && labsHistory.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800">Laboratory History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Key Markers</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {labsHistory.map((h, idx) => {
                                        const labData = typeof h.labs === 'string' ? JSON.parse(h.labs) : h.labs;
                                        const markers = Object.entries(labData || {})
                                            .slice(0, 5)
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(', ');

                                        return (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                                    {new Date(h.test_date || h.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">
                                                    {markers || 'No detailed data'}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                                                    <button
                                                        onClick={() => {
                                                            const unpacked = {};
                                                            Object.entries(labData || {}).forEach(([k, v]) => {
                                                                unpacked[k] = v;
                                                            });
                                                            setFormData(prev => ({ ...prev, ...unpacked }));
                                                            alert('Historical lab values copied to form.');
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 text-xs"
                                                        title="Copy to current session"
                                                    >
                                                        Copy
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }, [formData, isEditing, showPediatricLabs, handleSaveLabs, handleLabInputChange, handleInputChange, labsHistory, isNewPatient, customLabs, setCustomLabs]);

    // ==========================================================
    // DEMOGRAPHICS SECTION — compact grid, no icons
    // ==========================================================
    const renderDemographicsSection = useCallback(() => {
        const ageDisplay = formatAgeDisplay(formData.age_in_days, formData.date_of_birth);
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        const patientCodeToDisplay = getCurrentPatientCode();
        const isIndividual = user?.account_type === 'individual' && user?.role !== 'admin';

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Demographics & Dx</h2>
                        <p className="text-gray-600 text-sm">Basic information</p>
                    </div>
                    {isEditing && (
                        <button
                            onClick={handleSaveDemographics}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <FaSave /> Save Info
                        </button>
                    )}
                </div>

                {ageDisplay && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg">
                        <h3 className="font-bold text-blue-800 text-sm">Age Information</h3>
                        <p className="text-blue-700 text-xs">{ageDisplay}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Full Name */}
                    {!isIndividual && (
                        <div className="space-y-1 col-span-2 md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700">Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.full_name || ''}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                    placeholder="Patient name"
                                />
                            ) : (
                                <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                    {formatEncValue(formData.full_name || patient?.full_name)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Age */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-medium text-gray-700">
                                Age {ageMode === 'days' && isPediatric ? '(days)' : '(yrs)'}
                            </label>
                            {isEditing && formData.age_in_days && parseInt(formData.age_in_days) < 730 && (
                                <button
                                    type="button"
                                    onClick={() => setAgeMode(ageMode === 'days' ? 'years' : 'days')}
                                    className="text-[10px] text-blue-600 hover:text-blue-800"
                                >
                                    {ageMode === 'days' ? 'yrs' : 'days'}
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            ageMode === 'days' && isPediatric ? (
                                <input
                                    type="number"
                                    value={formData.age_in_days || ''}
                                    onChange={(e) => handleInputChange('age_in_days', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                    placeholder="Days"
                                    min="0"
                                    max="365"
                                />
                            ) : (
                                <input
                                    type="number"
                                    value={formData.age || ''}
                                    onChange={(e) => handleInputChange('age', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                    placeholder="Age"
                                    min="0"
                                    max="120"
                                />
                            )
                        ) : (
                            <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                {ageDisplay || <span className="text-gray-500 italic">Not specified</span>}
                            </div>
                        )}
                    </div>

                    {/* Date of Birth */}
                    {!isIndividual && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">Date of Birth</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.date_of_birth || ''}
                                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                />
                            ) : (
                                <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                    {formData.date_of_birth ? (
                                        isValidDate(formData.date_of_birth)
                                            ? new Date(formData.date_of_birth).toLocaleDateString()
                                            : formatEncValue(formData.date_of_birth)
                                    ) : <span className="text-gray-500 italic">Not specified</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gender */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Gender</label>
                        {isEditing ? (
                            <select
                                value={formData.gender || ''}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        ) : (
                            <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                {formatEncValue(formData.gender || patient?.gender)}
                            </div>
                        )}
                    </div>

                    {/* Age Category */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Age Category</label>
                        <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                            {formData.patient_type ? (
                                <span className="font-medium capitalize">{formData.patient_type}</span>
                            ) : <span className="text-gray-500 italic">Not set</span>}
                        </div>
                    </div>

                    {/* Contact Number */}
                    {!isIndividual && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">Contact</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.contact_number || ''}
                                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                    placeholder="Phone"
                                />
                            ) : (
                                <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                    {formatEncValue(formData.contact_number || patient?.contact_number)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">Status</label>
                        <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                            <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{formData.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>

                    {/* Appointment Date */}
                    {!isIndividual && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">Appointment</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.appointment_date || ''}
                                    onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                />
                            ) : (
                                <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                    {formData.appointment_date
                                        ? new Date(formData.appointment_date).toLocaleDateString()
                                        : <span className="text-gray-500 italic">Not scheduled</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Address (2 cols) */}
                    {!isIndividual && (
                        <div className="space-y-1 col-span-2 md:col-span-2">
                            <label className="block text-xs font-medium text-gray-700">Address</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.address || ''}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                    placeholder="Address"
                                />
                            ) : (
                                <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                    {formatEncValue(formData.address || patient?.address)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Allergies */}
                    <div className="space-y-1 col-span-2 md:col-span-3 lg:col-span-4">
                        <label className="block text-xs font-medium text-gray-700">Allergies</label>
                        {isEditing ? (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newAllergy}
                                        onChange={(e) => setNewAllergy(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg p-1.5 text-sm"
                                        placeholder="Add an allergy (e.g., Penicillin)"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                                    />
                                    <button
                                        onClick={handleAddAllergy}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm"
                                    >
                                        <FaPlus /> Add
                                    </button>
                                </div>
                                {Array.isArray(formData.allergies) && formData.allergies.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {formData.allergies.map((allergy, index) => (
                                            <div key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                                                {allergy}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAllergy(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                {Array.isArray(formData.allergies) && formData.allergies.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {formData.allergies.map((allergy, index) => (
                                            <span key={index} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                                                {allergy}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-500 italic">No allergies reported</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Diagnosis — full width, the ONLY long field */}
                    <div className="space-y-1 col-span-2 md:col-span-3 lg:col-span-4">
                        <label className="block text-xs font-medium text-gray-700">Diagnosis</label>
                        {isEditing ? (
                            <textarea
                                value={formData.diagnosis || ''}
                                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                placeholder="Enter diagnosis"
                            />
                        ) : (
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                {formatEncValue(formData.diagnosis || patient?.diagnosis)}
                            </div>
                        )}
                    </div>

                    {/* Pregnancy Status (Females Only) */}
                    {(formData.gender && formData.gender.toLowerCase() === 'female') && (
                        <div className="bg-white rounded-lg shadow-sm p-3 border border-pink-100 col-span-2 md:col-span-3 lg:col-span-4">
                            <h3 className="text-sm font-bold text-pink-700 mb-2 border-b border-pink-100 pb-1">
                                Pregnancy Status
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-pink-50 p-2 rounded-lg border border-pink-100">
                                    <label className="block text-[10px] font-bold text-pink-600 uppercase mb-1">Is Pregnant?</label>
                                    {isEditing ? (
                                        <div className="flex bg-white rounded-lg p-0.5 border border-pink-200">
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('is_pregnant', false)}
                                                className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all ${!formData.is_pregnant ? 'bg-gray-100 text-gray-700 shadow-sm' : 'text-gray-400'}`}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('is_pregnant', true)}
                                                className={`flex-1 py-1 px-2 rounded text-xs font-bold transition-all ${formData.is_pregnant ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400'}`}
                                            >
                                                Yes
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`p-1 text-xs font-bold rounded text-center ${formData.is_pregnant ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                            {formData.is_pregnant ? 'PREGNANT' : 'NOT PREGNANT'}
                                        </div>
                                    )}
                                </div>
                                {formData.is_pregnant && (
                                    <>
                                        <div className="bg-pink-50 p-2 rounded-lg border border-pink-100">
                                            <label className="block text-[10px] font-bold text-pink-600 uppercase mb-1">Weeks</label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    placeholder="12"
                                                    value={formData.pregnancy_weeks || ''}
                                                    onChange={e => handleInputChange('pregnancy_weeks', e.target.value)}
                                                    className="w-full px-2 py-1 border border-pink-200 rounded text-sm bg-white font-bold text-pink-700"
                                                />
                                            ) : (
                                                <div className="p-1 font-bold text-xs text-pink-800 bg-white rounded text-center border border-pink-100">
                                                    {formData.pregnancy_weeks || '--'} W
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-pink-50 p-2 rounded-lg border border-pink-100">
                                            <label className="block text-[10px] font-bold text-pink-600 uppercase mb-1">Trimester</label>
                                            <div className="p-1 font-black text-xs text-pink-900 bg-pink-200 rounded text-center">
                                                {formData.pregnancy_trimester || 'SELECT WEEKS'}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lactation Status (Females Only) */}
                    {(formData.gender && formData.gender.toLowerCase() === 'female') && (
                        <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-100 col-span-2 md:col-span-3 lg:col-span-4">
                            <h3 className="text-sm font-bold text-blue-700 mb-2 border-b border-blue-100 pb-1">
                                Lactation Status
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Is Lactating?</label>
                                    {isEditing ? (
                                        <select
                                            value={formData.is_lactating ? 'true' : 'false'}
                                            onChange={(e) => handleInputChange('is_lactating', e.target.value === 'true')}
                                            className="w-full px-2 py-1 border border-blue-200 rounded text-sm bg-white font-bold text-blue-700"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    ) : (
                                        <div className={`p-1 text-xs font-bold rounded text-center ${formData.is_lactating ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                            {formData.is_lactating ? 'LACTATING' : 'NOT LACTATING'}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Lactation Notes</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            placeholder="Exclusive breastfeeding"
                                            value={formData.lactation_notes || ''}
                                            onChange={e => handleInputChange('lactation_notes', e.target.value)}
                                            className="w-full px-2 py-1 border border-blue-200 rounded text-sm bg-white font-bold text-blue-700"
                                        />
                                    ) : (
                                        <div className="p-1 font-bold text-xs text-blue-800 bg-white rounded border border-blue-100">
                                            {formData.lactation_notes || '--'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pediatric Information */}
                    {isPediatric && (
                        <div className="col-span-2 md:col-span-3 lg:col-span-4 space-y-2 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                            <h3 className="font-bold text-purple-800 text-sm">Pediatric Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700">Birth Weight</label>
                                    {isEditing ? (
                                        <div className="flex gap-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.birth_weight || ''}
                                                onChange={(e) => handleInputChange('birth_weight', e.target.value)}
                                                className="flex-1 min-w-0 border border-gray-300 rounded-lg p-1.5 text-sm"
                                                placeholder="3.5"
                                            />
                                            <div className="w-10 bg-gray-100 border border-gray-300 rounded-lg p-1.5 text-center text-xs">kg</div>
                                        </div>
                                    ) : (
                                        <div className="p-1.5 bg-white rounded border text-sm">{formData.birth_weight || '--'} kg</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700">Birth Length</label>
                                    {isEditing ? (
                                        <div className="flex gap-1">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={formData.birth_length || ''}
                                                onChange={(e) => handleInputChange('birth_length', e.target.value)}
                                                className="flex-1 min-w-0 border border-gray-300 rounded-lg p-1.5 text-sm"
                                                placeholder="50"
                                            />
                                            <div className="w-10 bg-gray-100 border border-gray-300 rounded-lg p-1.5 text-center text-xs">cm</div>
                                        </div>
                                    ) : (
                                        <div className="p-1.5 bg-white rounded border text-sm">{formData.birth_length || '--'} cm</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700">Feeding Method</label>
                                    {isEditing ? (
                                        <select
                                            value={formData.feeding_method || ''}
                                            onChange={(e) => handleInputChange('feeding_method', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                        >
                                            <option value="">Select</option>
                                            <option value="Breastfed">Breastfed</option>
                                            <option value="Formula">Formula</option>
                                            <option value="Mixed">Mixed</option>
                                            <option value="Solids">Solids</option>
                                        </select>
                                    ) : (
                                        <div className="p-1.5 bg-white rounded border text-sm">{formData.feeding_method || 'Not specified'}</div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-700">Vaccination</label>
                                    {isEditing ? (
                                        <select
                                            value={formData.vaccination_status || ''}
                                            onChange={(e) => handleInputChange('vaccination_status', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                                        >
                                            <option value="">Select</option>
                                            <option value="Up to date">Up to date</option>
                                            <option value="Partially vaccinated">Partially vaccinated</option>
                                            <option value="Not vaccinated">Not vaccinated</option>
                                            <option value="Unknown">Unknown</option>
                                        </select>
                                    ) : (
                                        <div className="p-1.5 bg-white rounded border text-sm">{formData.vaccination_status || 'Not specified'}</div>
                                    )}
                                </div>
                                <div className="col-span-2 md:col-span-4 space-y-1">
                                    <label className="block text-xs font-medium text-gray-700">Developmental Milestones</label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.developmental_milestones || ''}
                                            onChange={(e) => handleInputChange('developmental_milestones', e.target.value)}
                                            rows="2"
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                            placeholder="Describe developmental milestones"
                                        />
                                    ) : (
                                        <div className="p-2 bg-white rounded border text-sm min-h-[40px]">
                                            {formData.developmental_milestones || 'Not specified'}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 md:col-span-4 space-y-1">
                                    <label className="block text-xs font-medium text-gray-700">Special Instructions</label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.special_instructions || ''}
                                            onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                                            rows="2"
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                            placeholder="Any special care instructions"
                                        />
                                    ) : (
                                        <div className="p-2 bg-white rounded border text-sm min-h-[40px]">
                                            {formData.special_instructions || 'None'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isEditing && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleSaveDemographics}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <FaSave /> Save Demographics & Dx
                        </button>
                    </div>
                )}
            </div>
        );
    }, [formData, patient, isEditing, ageMode, newAllergy, handleSaveDemographics, formatAgeDisplay, handleInputChange, handleAddAllergy, handleRemoveAllergy]);

    // ==========================================================
    // OVERVIEW SECTION — unchanged
    // ==========================================================
    const renderOverviewSection = useCallback(() => {
        const ageDisplay = formatAgeDisplay(formData.age_in_days, formData.date_of_birth);
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        const patientCodeToDisplay = getCurrentPatientCode();
    
        const vitalsCount = ['blood_pressure', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight', 'height']
            .filter(v => formData[v] && formData[v].toString().trim() !== '').length;
        const labsCount = customLabs.filter(l => l.value && l.value.toString().trim() !== '').length;
        const allergiesCount = Array.isArray(formData.allergies) ? formData.allergies.length : 0;
    
        const hasVitals = ['blood_pressure', 'heart_rate', 'temperature', 'oxygen_saturation']
            .some(v => formData[v] && formData[v].toString().trim() !== '');
    
        const labResults = customLabs.filter(l => l.value && l.value.toString().trim() !== '');
    
        return (
            <div className="space-y-8 text-gray-800">
                {/* Patient Header - Text Only */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {formatEncValue(
                            formData.full_name || patient?.full_name,
                            user?.account_type !== 'individual' || user?.role === 'admin'
                                ? `Patient ${patientCodeToDisplay}`
                                : 'MR Profile'
                        )}
                    </h1>
                    <p className="text-gray-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {(user?.account_type !== 'individual' || user?.role === 'admin') && patientCodeToDisplay && (
                            <span><span className="text-gray-500">Case No.</span> <span className="font-semibold text-indigo-600">{patientCodeToDisplay}</span></span>
                        )}
                        {ageDisplay && <><span className="text-gray-400">•</span><span>{ageDisplay}</span></>}
                        {formData.gender && <><span className="text-gray-400">•</span><span>{formatEncValue(formData.gender)}</span></>}
                        {isPediatric && <><span className="text-gray-400">•</span><span className="text-pink-600 font-medium capitalize">{formData.patient_type}</span></>}
                        <><span className="text-gray-400">•</span><span className={formData.is_active ? 'text-green-600 font-medium' : 'text-gray-500'}>{formData.is_active ? 'Active' : 'Inactive'}</span></>
                    </p>
                    {(formData.contact_number || formData.address) && (
                        <p className="text-gray-600 text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {formData.contact_number && (
                                <span className="inline-flex items-center gap-1">
                                    <FaPhone className="text-gray-400 text-xs" />
                                    {formatEncValue(formData.contact_number || patient?.contact_number)}
                                </span>
                            )}
                            {formData.address && (
                                <span className="inline-flex items-center gap-1">
                                    <FaHome className="text-gray-400 text-xs" />
                                    {formatEncValue(formData.address || patient?.address)}
                                </span>
                            )}
                        </p>
                    )}
                </div>
    
                {/* Summary stats - inline text */}
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm border-y border-gray-200 py-3">
                    <span className="text-gray-600">Vitals recorded: <strong className="text-blue-700">{vitalsCount}</strong></span>
                    <span className="text-gray-600">Lab tests: <strong className="text-green-700">{labsCount}</strong></span>
                    <span className="text-gray-600">Allergies: <strong className="text-red-700">{allergiesCount}</strong></span>
                </div>
    
                {/* Pregnancy - plain text */}
                {formData.is_pregnant && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Pregnancy</h3>
                        <p className="text-gray-800">
                            {formData.pregnancy_weeks ? `${formData.pregnancy_weeks} weeks` : 'Weeks not recorded'}
                            {formData.pregnancy_trimester && <span className="text-gray-600"> ({formData.pregnancy_trimester})</span>}
                            {formData.edd && <span className="text-gray-600"> • EDD: {new Date(formData.edd).toLocaleDateString()}</span>}
                        </p>
                        {formData.pregnancy_notes && (
                            <p className="text-sm text-gray-600 mt-1">{formData.pregnancy_notes}</p>
                        )}
                    </div>
                )}
    
                {/* Allergies - plain comma list */}
                {allergiesCount > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <FaExclamationTriangle className="text-red-400" /> Allergies
                        </h3>
                        <p className="text-red-700">{formData.allergies.join(', ')}</p>
                    </div>
                )}
    
                {/* Lab findings - text rows */}
                {labResults.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <FaVial className="text-green-400" /> Key Laboratory Findings
                        </h3>
                        <div className="space-y-1.5">
                            {labResults.slice(0, 12).map((lab, idx) => (
                                <div key={idx} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                                    <span className="text-gray-600 min-w-[140px]">{lab.name}:</span>
                                    <span className="font-semibold text-gray-900">{lab.value}</span>
                                    {lab.unit && <span className="text-gray-500 text-xs">{lab.unit}</span>}
                                    {lab.date ? (
                                        <span className="text-gray-400 text-xs ml-auto">
                                            ({new Date(lab.date).toLocaleDateString()})
                                        </span>
                                    ) : (
                                        <span className="text-red-400 text-xs ml-auto">(no test date)</span>
                                    )}
                                </div>
                            ))}
                            {labResults.length > 12 && (
                                <p className="text-xs text-gray-500 pt-1">
                                    + {labResults.length - 12} more results in the <strong>Labs</strong> tab.
                                </p>
                            )}
                        </div>
                    </div>
                )}
    
                {/* Recent vitals - inline text */}
                {hasVitals && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <FaHeartbeat className="text-red-400" /> Recent Vitals
                        </h3>
                        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                            {formData.blood_pressure && (
                                <span className="text-gray-600">BP: <strong className="text-gray-900">{formData.blood_pressure}</strong> <span className="text-gray-400 text-xs">mmHg</span></span>
                            )}
                            {formData.heart_rate && (
                                <span className="text-gray-600">Heart Rate: <strong className="text-gray-900">{formData.heart_rate}</strong> <span className="text-gray-400 text-xs">bpm</span></span>
                            )}
                            {formData.temperature && (
                                <span className="text-gray-600">Temp: <strong className="text-gray-900">{formData.temperature}</strong> <span className="text-gray-400 text-xs">°C</span></span>
                            )}
                            {formData.respiratory_rate && (
                                <span className="text-gray-600">Resp. Rate: <strong className="text-gray-900">{formData.respiratory_rate}</strong> <span className="text-gray-400 text-xs">/min</span></span>
                            )}
                            {formData.oxygen_saturation && (
                                <span className="text-gray-600">SpO₂: <strong className="text-gray-900">{formData.oxygen_saturation}</strong> <span className="text-gray-400 text-xs">%</span></span>
                            )}
                        </div>
                        {formData.last_measured && (
                            <p className="text-xs text-gray-500 mt-1">
                                Last measured: {new Date(formData.last_measured).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                )}
    
                {/* Diagnosis - plain text */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <FaStethoscope className="text-indigo-400" /> Diagnosis
                    </h3>
                    <p className={formData.diagnosis ? 'text-gray-800' : 'text-gray-400 italic'}>
                        {formData.diagnosis || 'No diagnosis recorded'}
                    </p>
                </div>
            </div>
        );
    }, [formData, patient, getCurrentPatientCode, formatAgeDisplay, customLabs, user]);

    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case 'overview':
                return renderOverviewSection();
            case 'demographics':
                return renderDemographicsSection();
            case 'vitals':
                return renderVitalsSection();
            case 'labs':
                return renderLabsSection();
            case 'medications':
                return <MedicationHistory patientCode={getCurrentPatientCode()} encryptionKey={activeKey} />;
            case 'analysis':
                return <CDSSDisplay
                    patientData={formData}
                    encryptionKey={activeKey}
                    onBack={() => { }}
                />;
            case 'drn':
                return <DRNAssessment patientCode={getCurrentPatientCode()} />;
            case 'plan':
                return <PhAssistPlan patientCode={getCurrentPatientCode()} />;
            case 'outcome':
                return <PatientOutcome patientCode={getCurrentPatientCode()} />;
            case 'cost':
                return <CostSection patientCode={getCurrentPatientCode()} />;
            default:
                return renderOverviewSection();
        }
    }, [activeTab, renderOverviewSection, renderDemographicsSection, renderVitalsSection, renderLabsSection, getCurrentPatientCode, formData]);

    return (
        <div className="page-container w-full max-w-full overflow-x-hidden px-3 sm:px-4 md:px-6 lg:px-8">
            {/* Connection Status Banner */}
            {(!isOnline || backendStatus === 'offline') && (
                <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 md:p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <FaWifi className="mr-2 flex-shrink-0" />
                            <p className="font-medium text-sm md:text-base">
                                {!isOnline ? 'You are offline. ' : ''}
                                {backendStatus === 'offline' ? 'Cannot connect to server. ' : ''}
                                Some features may be unavailable.
                            </p>
                        </div>
                        {backendStatus === 'offline' && retryCount < 3 && (
                            <button
                                onClick={handleRetry}
                                className="ml-4 text-xs md:text-sm bg-yellow-600 text-white px-2 md:px-3 py-1 rounded flex items-center gap-1"
                            >
                                <FaSync /> Retry
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 md:p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                                <p className="text-sm md:text-base">{error}</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="ml-4 text-xs md:text-sm bg-red-600 text-white px-2 md:px-3 py-1 rounded flex items-center gap-1"
                            >
                                <FaSync /> Retry
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-2 md:p-6 mb-4 md:mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                                onClick={handleBack}
                                className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
                                title="Back to MRs"
                            >
                                <FaArrowLeft className="text-lg md:text-xl" />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
                                    {isNewPatient ? 'New MR' : `MR: ${getCurrentPatientCode()}`}
                                </h1>
                                {formData.full_name && (
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-gray-600 text-xs md:text-base truncate">
                                            {formatEncValue(formData.full_name, 'MR Profile')} • {formatAgeDisplay(formData.age_in_days, formData.date_of_birth)} • {formData.gender || 'Gender not specified'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">

                            {(isNewPatient || user?.id === patient?.user_id || user?.userId === patient?.user_id) && (
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${isEditing
                                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                        }`}
                                >
                                    <FaEdit /> <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
                                </button>
                            )}
                            {isEditing && (
                                <button
                                    onClick={handleSaveAll}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                >
                                    <FaSave /> <span className="hidden sm:inline">{isNewPatient ? 'Create' : 'Save'}</span>
                                </button>
                            )}
                             {/* 🛡️ Support Activation Button */}
                            {!isNewPatient && (
                                (supportActivated 
                                    ? (user?.userId === patient?.user_id || user?.id === patient?.user_id) 
                                    : (user?.role !== 'admin' && (user?.userId === patient?.user_id || user?.id === patient?.user_id || ['superadmin', 'specialist', 'support'].includes(String(user?.role || '').toLowerCase())))
                                )
                            ) && (
                                <button
                                    onClick={() => supportActivated ? handleDeactivateSupport() : setIsSupportModalOpen(true)}
                                    className={`px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all duration-300 shadow-md active:scale-95 border ${
                                        supportActivated 
                                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
                                    }`}
                                >
                                    {supportActivated ? (
                                        <><FaTimes /> <span className="hidden sm:inline font-bold">Revoke Support Access</span></>
                                    ) : (
                                        <><FaUserShield /> <span className="hidden sm:inline">Activate Support</span></>
                                    )}
                                </button>
                            )}

                            {!isNewPatient && (user?.id === patient?.user_id || user?.userId === patient?.user_id) && (
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                >
                                    <FaTrash /> <span className="hidden sm:inline">Delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-2 md:p-4 mb-4 md:mb-6">
                    {/* Mobile: wrap grid so all tabs visible; Desktop: horizontal scroll */}
                    <nav className="flex flex-wrap gap-1 md:flex-nowrap md:overflow-x-auto md:scrollbar-thin md:scrollbar-thumb-gray-200 md:pb-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-2.5 md:px-4 rounded-lg font-medium text-xs whitespace-nowrap flex-shrink-0 transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4 md:p-6">
                    {/* 🔐 PATIENT UNLOCKER: Gates all content until decrypted */}
                    {!isNewPatient && patient ? (
                        <PatientUnlocker
                            patientData={patient}
                            userSalt={patientOwnerSalt}
                            onUnlocked={(decrypted, workingKey) => {
                                loadPatientData(decrypted, workingKey);
                            }}
                        >
                            {/* All content only renders AFTER decryption */}
                            {activeTab === 'overview' && renderOverviewSection()}
                            {activeTab === 'demographics' && renderDemographicsSection()}
                            {activeTab === 'vitals' && renderVitalsSection()}
                            {activeTab === 'labs' && renderLabsSection()}
                            {activeTab === 'medications' && <MedicationHistory patientCode={getCurrentPatientCode()} />}
                            {activeTab === 'analysis' && <CDSSDisplay
                                patientData={{ ...formData, patient_code: getCurrentPatientCode(), id: patient?.id }}
                                onBack={() => { }}
                            />}
                            {activeTab === 'drn' && <DRNAssessment
                                patientCode={getCurrentPatientCode()}
                                patientData={formData}
                            />}
                            {activeTab === 'plan' && <PhAssistPlan patientCode={getCurrentPatientCode()} />}
                            {activeTab === 'outcome' && <PatientOutcome patientCode={getCurrentPatientCode()} />}
                            {activeTab === 'cost' && <CostSection patientCode={getCurrentPatientCode()} />}
                        </PatientUnlocker>
                    ) : (
                        <>
                            {activeTab === 'overview' && renderOverviewSection()}
                            {activeTab === 'demographics' && renderDemographicsSection()}
                            {activeTab === 'vitals' && renderVitalsSection()}
                            {activeTab === 'labs' && renderLabsSection()}
                            {activeTab === 'medications' && <MedicationHistory patientCode={getCurrentPatientCode()} />}
                            {activeTab === 'analysis' && <CDSSDisplay
                                patientData={{ ...formData, patient_code: getCurrentPatientCode(), id: patient?.id }}
                                onBack={() => { }}
                            />}
                            {activeTab === 'drn' && <DRNAssessment
                                patientCode={getCurrentPatientCode()}
                                patientData={formData}
                            />}
                            {activeTab === 'plan' && <PhAssistPlan patientCode={getCurrentPatientCode()} />}
                            {activeTab === 'outcome' && <PatientOutcome patientCode={getCurrentPatientCode()} />}
                            {activeTab === 'cost' && <CostSection patientCode={getCurrentPatientCode()} />}
                        </>
                    )}
                </div>

                {isEditing && (
                    <div className="fixed bottom-6 right-6 z-10">
                        <button
                            onClick={handleSaveAll}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
                        >
                            <FaSave /> {isNewPatient ? 'Create Patient' : 'Save All Changes'}
                        </button>
                    </div>
                )}

                {/* 🔒 SUPPORT ACTIVATION MODAL */}
                {isSupportModalOpen && (
                    <SupportRequestModal
                        isOpen={isSupportModalOpen}
                        patientId={patient?.id}
                        ownerSalt={patientOwnerSalt}
                        onClose={() => setIsSupportModalOpen(false)}
                        onSuccess={() => {
                            setSupportActivated(true);
                            setTimeout(() => setIsSupportModalOpen(false), 2000);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default PatientDetails;
