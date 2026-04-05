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
    FaShieldAlt,
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


// Create memoized LabInputField component
const LabInputField = React.memo(({
    label,
    value,
    field,
    unit,
    placeholder,
    isEditing,
    handleChange,
    normalRange,
    readOnly = false,
    type = "number"
}) => {
    const handleInputChange = (e) => {
        handleChange(field, e.target.value);
    };

    return (
        <div className="space-y-1">
            <label className="block text-xs md:text-sm font-medium text-gray-700">
                {label}
                {normalRange && (
                    <span className="text-xs text-gray-500 ml-1">({normalRange})</span>
                )}
            </label>
            {isEditing ? (
                <div className="flex items-center">
                    <input
                        type={type}
                        step={type === "number" ? "0.01" : undefined}
                        value={value || ''}
                        onChange={handleInputChange}
                        className="flex-1 border border-gray-300 rounded-l-lg p-2 md:p-3 text-sm"
                        placeholder={placeholder}
                        readOnly={readOnly}
                    />
                    <div className="w-12 md:w-16 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg p-2 md:p-3 text-center text-xs md:text-sm text-gray-700">
                        {unit}
                    </div>
                </div>
            ) : (
                <div className="flex items-center">
                    <div className="flex-1 bg-blue-50 border border-blue-200 rounded-l-lg p-2 md:p-3 text-sm">
                        <span className="font-medium text-gray-800">
                            {value || '--'}
                        </span>
                    </div>
                    <div className="w-12 md:w-16 bg-blue-100 border border-l-0 border-blue-200 rounded-r-lg p-2 md:p-3 text-center text-xs md:text-sm text-gray-700">
                        {unit}
                    </div>
                </div>
            )}
        </div>
    );
});

LabInputField.displayName = 'LabInputField';

const PatientDetails = () => {
    const { patientCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // --- 1. PRIMARY STATE INITIALIZATION ---
    const [patient, setPatient] = useState(null);
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
    const [isSupportActive, setIsSupportActive] = useState(false); // New state
    const [activeAdminName, setActiveAdminName] = useState(''); // New state

    // Effect to fetch initial data
    useEffect(() => {
        if (patientCode && !isNewPatient) {
            fetchPatientData();
        }
    }, [patientCode, isNewPatient]);

    // Check support status once patient is loaded
    useEffect(() => {
        if (patient?.id && !isNewPatient) {
            checkSupportStatus();
        }
    }, [patient?.id, isNewPatient]);

    const checkSupportStatus = async () => {
        try {
            const res = await api.get(`/access/granted?patient_id=${patient?.id || id}`);
            if (res.success && res.request) {
                setIsSupportActive(true);
            } else {
                setIsSupportActive(false);
            }
        } catch (err) {
            console.warn("Error checking support status:", err);
        }
    };

    const handleRevokeSupport = async () => {
        if (!window.confirm("🔒 Termination Protocol: Are you sure you want to revoke the administrator's access to this patient record?")) {
            return;
        }

        try {
            const res = await api.post('/access/revoke-support', { patient_id: patient.id });
            if (res.success) {
                setIsSupportActive(false);
                alert("✨ Session Terminated: The secure vault for this support session has been destroyed.");
                checkSupportStatus();
            }
        } catch (err) {
            alert("Revoke failed: " + err.message);
        }
    };

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
        last_tested: new Date().toISOString().split('T')[0]
    });

    // --- 2. HELPERS & UTILS ---


    // --- 3. EFFECTS ---
    // Initialize user from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try { setUser(JSON.parse(userData)); } catch (e) { }
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

        const allTabs = [
            { id: 'overview', label: 'Overview', icon: FaUser },
            { id: 'demographics', label: 'Demographics', icon: FaUser },
            { id: 'vitals', label: 'Vitals & Anthropometry', icon: FaHeartbeat },
            { id: 'labs', label: 'Labs', icon: FaVial },
            { id: 'medications', label: 'Medications', icon: FaPills },
            ...(user?.role === 'healthcare_client' ? [{ id: 'analysis', label: 'Clinical Case Review', icon: FaShieldAlt }] : []),
            { id: 'drn', label: 'DRN Assessment', icon: FaRobot },
            { id: 'plan', label: 'Ph-Asst & Plan', icon: FaFileMedical },
            { id: 'outcome', label: 'Outcome', icon: FaChartLine },
            ...(isCompanyUser ? [{ id: 'cost', label: 'Cost', icon: FaMoneyBillWave }] : [])
        ];

        const hasActiveSubscription = user?.subscription_status === 'active';
        const isAdmin = user?.role === 'admin';
        const isPharmacistOrStudent = user?.account_type === 'individual' &&
            (user?.role === 'pharmacist' || user?.role === 'pharmacy_student');

        let result = allTabs;

        // Ensure core tabs are ALWAYS included for everyone
        const alwaysVisible = ['overview', 'demographics', 'vitals', 'labs', 'analysis', 'cost'];

        if (!hasActiveSubscription && !isAdmin) {
            // Keep alwaysVisible + others except core clinical tools
            result = allTabs.filter(tab =>
                alwaysVisible.includes(tab.id) ||
                !['plan', 'outcome', 'drn', 'medications'].includes(tab.id)
            );
        } else if (user?.account_type === 'individual' && !isAdmin) {
            // Individual subscribers - remove some tabs but KEEP analysis and cost
            result = allTabs.filter(tab =>
                alwaysVisible.includes(tab.id) ||
                !['plan', 'outcome'].includes(tab.id)
            );

            if (!isPharmacistOrStudent) {
                result = result.filter(tab => tab.id !== 'drn');
            }
        }

        return result;
    }, [user]);



    const generatePatientCode = useCallback(() => {
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        const code = `PAT${timestamp}${randomNum}`;

        return code;
    }, []);

    const getCurrentPatientCode = useCallback(() => {
        if (currentPatientCode) {
            return currentPatientCode;
        }
        if (patient?.id) {
            return patient.id;
        }
        if (patientCode && patientCode !== 'new') {
            return patientCode;
        }
        return '';
    }, [currentPatientCode, patient, patientCode]);

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

    const loadPatientData = useCallback(async (patientData) => {
        if (!patientData) return;

        setIsNewPatient(false);
        setLoading(true);

        // 🔐 ZERO-KNOWLEDGE DECRYPTION
        let decryptedData = { ...patientData };
        try {
            const masterKey = await getEncryptionKey();
            const currentRole = user?.role || '';
            const privateKey = (currentRole === 'healthcare_client' || currentRole === 'admin') ? await loadPrivateKey(masterKey) : null;

            if (masterKey) {
                decryptedData = await decryptPatient(decryptedData, masterKey);
            } else if (privateKey && decryptedData.shared_encryption_key) {
                // Decrypt shared key to get Master Key
                const decryptedMasterKeyHex = await decryptWithPrivateKey(decryptedData.shared_encryption_key, privateKey);
                const rawKeyBytes = hexToBytes(decryptedMasterKeyHex);
                const sharedMasterKey = await crypto.subtle.importKey('raw', rawKeyBytes, { name: 'AES-GCM' }, true, ['decrypt']);
                decryptedData = await decryptPatient(decryptedData, sharedMasterKey);
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
            loadedCustomLabs.push({
                id: Date.now() + Math.random(),
                name: key,
                value: value
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
            last_tested: (data.last_tested && isValidDate(data.last_tested)) ? data.last_tested.split('T')[0] : new Date().toISOString().split('T')[0],
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

        // 🔗 UPDATE PRIMARY STATE: Ensure the main 'patient' object also reflects these updates
        setPatient(data);
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

                const newCode = generatePatientCode();
                setCurrentPatientCode(newCode);

                const today = new Date().toISOString().split('T')[0];
                setFormData(prev => ({
                    ...prev,
                    last_measured: today,
                    last_tested: today,
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
                navigate('/patients/new');
                return;
            }

            // CASE 2: Fetching existing patient


            try {
                // Use the generic identifier route which supports both ID and Code
                const result = await api.get(`/patients/${patientCode}`);


                if (result.success && result.patient) {
                    setPatientOwnerSalt(result.owner_salt || null);

                    // 🔐 ZERO-KNOWLEDGE: Decrypt the patient before loading
                    let patientToLoad = result.patient;
                    const encKey = await getEncryptionKey();
                    if (encKey) {
                        try {
                            patientToLoad = await decryptPatient(result.patient, encKey);
                        } catch (decErr) {
                            console.error('❌ [PatientDetails] Decryption failed:', decErr);
                        }
                    }

                    loadPatientData(patientToLoad);

                    const searchParams = new URLSearchParams(location.search);
                    if (searchParams.get('edit') === 'true') {
                        setIsEditing(true);
                    }
                } else {
                    setError('Patient not found. Please check the patient code.');
                    setIsNewPatient(true);
                    setIsEditing(true);
                }
            } catch (apiError) {

                const errorMsg = apiError?.error || apiError?.message || 'Server error';
                const isNotFound = apiError?.status === 404 || errorMsg.toLowerCase().includes('not found');

                if (isNotFound) {
                    setError('Patient not found. You can create a new patient instead.');
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
    }, [patientCode, navigate, generatePatientCode, location.search, location.pathname, loadPatientData]);

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
        if (field.includes('date') || field.includes('edd') || field === 'appointment_date') {
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

        // Check backend status periodically
        const checkBackendStatus = async () => {
            try {
                const result = await api.get('/health');
                if (result) {
                    setBackendStatus('online');
                } else {
                    setBackendStatus('offline');
                }
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

            let savePatientCode = getCurrentPatientCode();
            const isRestrictedIndividual = user?.account_type === 'individual' && !user?.company_id && user?.role !== 'admin';

            // For NEW patients, generation logic
            if (isNewPatient && !isRestrictedIndividual) {
                savePatientCode = generatePatientCode();
                setCurrentPatientCode(savePatientCode);
            }

            // Validate we have a patient identifier
            if (!savePatientCode || String(savePatientCode).trim() === '') {
                if (isNewPatient) {
                    // For newborns not healthcare client, we use a placeholder or wait for UUID
                    if (!isRestrictedIndividual) {
                        savePatientCode = generatePatientCode();
                        setCurrentPatientCode(savePatientCode);
                    }
                } else if (!patient?.id) {
                    alert('Patient identifier missing. Please reload or go back to MR list.');
                    return;
                }
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

            // COMPLETE section data with ALL fields
            const sectionData = {
                basic: {
                    patient_code: savePatientCode,
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
                                allLabsData[key] = lab.value;
                            }
                        });

                        return allLabsData;
                    })(),
                    last_tested: cleanDate(formData.last_tested)
                }
            };

            // Combine based on section
            let patientData = {};

            if (section === 'all' || isNewPatient) {
                patientData = {
                    ...sectionData.basic,
                    ...sectionData.vitals,
                    labs: sectionData.labs.labs, // Keep inside JSONB object
                    last_tested: sectionData.labs.last_tested
                };
            } else if (section === 'vitals') {
                patientData = { ...sectionData.basic, ...sectionData.vitals };
            } else if (section === 'labs') {
                patientData = {
                    ...sectionData.basic,
                    labs: sectionData.labs.labs, // Keep inside JSONB object
                    last_tested: sectionData.labs.last_tested
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
                fetchClinicalHistory(savePatientCode);

                if (section === 'all' || isNewPatient) {
                    setIsEditing(false);
                }

                alert(isNewPatient ? 'Patient created successfully!' : 'Patient updated successfully!');

                if (patientCode === 'new' && isNewPatient) {
                    navigate(`/patients/${savedPatient.id}`);
                }

                // --- PUSH TO HISTORY TABLES ---
                try {
                    if (section === 'vitals' || section === 'all' || isNewPatient) {
                        const hasVitals = ['blood_pressure', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight', 'height'].some(k => formData[k]);
                        if (hasVitals) {
                            await api.post('/vitals', {
                                patient_id: savedPatient.id,
                                patient_code: savedPatient.patient_code,
                                ...sectionData.vitals,
                                recorded_at: new Date().toISOString()
                            });
                        }
                    }
                    if (section === 'labs' || section === 'all' || isNewPatient) {
                        const hasLabs = Object.keys(sectionData.labs.labs).length > 0;
                        if (hasLabs) {
                            await api.post('/labs-history', {
                                patient_id: savedPatient.id,
                                patient_code: savedPatient.patient_code,
                                labs: sectionData.labs.labs,
                                test_date: formData.last_tested || new Date().toISOString().split('T')[0],
                                recorded_at: new Date().toISOString()
                            });
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
    }, [isNewPatient, formData, getCurrentPatientCode, generatePatientCode, navigate, patientCode, isValidDate, calculateAgeInDays, calculateAge, determinePatientType, customLabs, fetchClinicalHistory, checkPatientLimit, loadPatientData, user]);

    // Helper functions
    const handleSaveAll = useCallback(() => handleSave('all'), [handleSave]);
    const handleSaveVitals = useCallback(() => handleSave('vitals'), [handleSave]);
    const handleSaveLabs = useCallback(() => handleSave('labs'), [handleSave]);
    const handleSaveDemographics = useCallback(() => handleSave('basic'), [handleSave]);

    const handleDelete = useCallback(async () => {
        if (!window.confirm('Are you sure you want to delete this patient? All related data will be lost.')) {
            return;
        }

        const deletePatientCode = getCurrentPatientCode();
        if (!deletePatientCode) {
            alert('Error: Patient code is missing');
            return;
        }

        try {
            // Updated to use the direct ID endpoint for deletion
            const result = await api.delete(`/patients/${patient.id}`);

            if (result.success) {
                alert('Patient deleted successfully!');
                navigate('/patients');
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

    // Memoize the render functions to prevent infinite re-renders
    const renderVitalsSection = useCallback(() => {
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        const ageInDays = parseInt(formData.age_in_days) || 0;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${isPediatric ? 'bg-pink-100' : 'bg-red-100'}`}>
                            <FaHeartbeat className={`${isPediatric ? 'text-pink-600' : 'text-red-600'} text-xl`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                Vital Signs {isPediatric && <span className="text-pink-600">(Pediatric)</span>}
                            </h2>
                            <p className="text-gray-600">
                                {isPediatric
                                    ? 'Pediatric vital signs with age-appropriate ranges'
                                    : 'Record and monitor patient vital signs'}
                            </p>
                        </div>
                    </div>
                    {isEditing && (
                        <button
                            onClick={handleSaveVitals}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <FaSave /> Save Vitals
                        </button>
                    )}
                </div>

                {isPediatric && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-6 border border-pink-200">
                        <div className="flex items-center gap-3">
                            {formData.patient_type === 'neonate' ? (
                                <FaBaby className="text-pink-600 text-2xl" />
                            ) : formData.patient_type === 'infant' ? (
                                <FaBabyCarriage className="text-pink-600 text-2xl" />
                            ) : (
                                <FaChild className="text-pink-600 text-2xl" />
                            )}
                            <div>
                                <h3 className="font-bold text-pink-800">
                                    {formData.patient_type ? formData.patient_type.toUpperCase() : 'Pediatric'} Patient
                                </h3>
                                <p className="text-pink-700 text-sm">
                                    Age: {formatAgeDisplay(formData.age_in_days, formData.date_of_birth)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Blood Pressure */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                                Blood Pressure
                            </label>
                            {isPediatric && (
                                <span className="text-xs text-gray-500">
                                    {getPediatricNormalRange('blood_pressure', formData.age_in_days)}
                                </span>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.blood_pressure || ''}
                                onChange={(e) => handleVitalsInputChange('blood_pressure', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder={isPediatric ? "e.g., 80/55" : "120/80"}
                            />
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.blood_pressure || '--/--'}
                                    </span>
                                    <span className="text-sm text-gray-500">mmHg</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Heart Rate */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                                Heart Rate
                            </label>
                            {isPediatric && (
                                <span className="text-xs text-gray-500">
                                    {getPediatricNormalRange('heart_rate', formData.age_in_days)}
                                </span>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="number"
                                value={formData.heart_rate || ''}
                                onChange={(e) => handleVitalsInputChange('heart_rate', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder={isPediatric ? "e.g., 120" : "72"}
                            />
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.heart_rate || '--'}
                                    </span>
                                    <span className="text-sm text-gray-500">bpm</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Temperature
                        </label>
                        {isEditing ? (
                            <input
                                type="number"
                                step="0.1"
                                value={formData.temperature || ''}
                                onChange={(e) => handleVitalsInputChange('temperature', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder="36.5"
                            />
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.temperature || '--'}
                                    </span>
                                    <span className="text-sm text-gray-500">°C</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Respiratory Rate */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                                Respiratory Rate
                            </label>
                            {isPediatric && (
                                <span className="text-xs text-gray-500">
                                    {getPediatricNormalRange('respiratory_rate', formData.age_in_days)}
                                </span>
                            )}
                        </div>
                        {isEditing ? (
                            <input
                                type="number"
                                value={formData.respiratory_rate || ''}
                                onChange={(e) => handleVitalsInputChange('respiratory_rate', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder={isPediatric ? "e.g., 40" : "16"}
                            />
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.respiratory_rate || '--'}
                                    </span>
                                    <span className="text-sm text-gray-500">breaths/min</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SpO₂ */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Oxygen Saturation (SpO₂)
                        </label>
                        {isEditing ? (
                            <input
                                type="number"
                                value={formData.oxygen_saturation || ''}
                                onChange={(e) => handleVitalsInputChange('oxygen_saturation', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder="98"
                                min="0"
                                max="100"
                            />
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.oxygen_saturation || '--'}
                                    </span>
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Weight */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Weight {formData.weight_percentile && (
                                <span className="text-xs text-blue-600 ml-1">
                                    ({formData.weight_percentile} percentile)
                                </span>
                            )}
                        </label>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.weight || ''}
                                    onChange={(e) => handleVitalsInputChange('weight', e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg p-3"
                                    placeholder={isPediatric ? "e.g., 3.5" : "70"}
                                />
                                <div className="w-20 bg-gray-100 border border-gray-300 rounded-lg p-3 text-center text-gray-700">
                                    kg
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.weight || '--'} kg
                                    </span>
                                    {formData.weight_percentile && (
                                        <span className="text-sm text-blue-600 font-medium">
                                            {formData.weight_percentile}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Height/Length */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {isPediatric && ageInDays < 730 ? 'Length' : 'Height'}
                            {formData.height_percentile && (
                                <span className="text-xs text-blue-600 ml-1">
                                    ({formData.height_percentile} percentile)
                                </span>
                            )}
                        </label>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={isPediatric && ageInDays < 730 ? (formData.length || '') : (formData.height || '')}
                                    onChange={(e) => handleVitalsInputChange(
                                        isPediatric && ageInDays < 730 ? 'length' : 'height',
                                        e.target.value
                                    )}
                                    className="flex-1 border border-gray-300 rounded-lg p-3"
                                    placeholder={isPediatric ? "e.g., 50" : "170"}
                                />
                                <div className="w-20 bg-gray-100 border border-gray-300 rounded-lg p-3 text-center text-gray-700">
                                    cm
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {(isPediatric && ageInDays < 730 ? formData.length : formData.height) || '--'} cm
                                    </span>
                                    {formData.height_percentile && (
                                        <span className="text-sm text-blue-600 font-medium">
                                            {formData.height_percentile}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Head Circumference (Pediatric) */}
                    {isPediatric && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Head Circumference
                                {formData.head_circumference_percentile && (
                                    <span className="text-xs text-blue-600 ml-1">
                                        ({formData.head_circumference_percentile} percentile)
                                    </span>
                                )}
                            </label>
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.head_circumference || ''}
                                        onChange={(e) => handleVitalsInputChange('head_circumference', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., 35"
                                    />
                                    <div className="w-20 bg-gray-100 border border-gray-300 rounded-lg p-3 text-center text-gray-700">
                                        cm
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-800">
                                            {formData.head_circumference || '--'} cm
                                        </span>
                                        {formData.head_circumference_percentile && (
                                            <span className="text-sm text-blue-600 font-medium">
                                                {formData.head_circumference_percentile}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BSA */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            BSA (DuBois) {formData.bsa_percentile && (
                                <span className="text-xs text-blue-600 ml-1">
                                    ({formData.bsa_percentile} percentile)
                                </span>
                            )}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.bsa || ''}
                                readOnly
                                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
                                placeholder="Calculated automatically"
                            />
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.bsa || '--'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">m²</span>
                                        {formData.bsa_percentile && (
                                            <span className="text-sm text-blue-600 font-medium">
                                                {formData.bsa_percentile}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Last Measured */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Last Measured
                        </label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={formData.last_measured || ''}
                                onChange={(e) => handleInputChange('last_measured', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {formData.last_measured ? (
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400" />
                                        {new Date(formData.last_measured).toLocaleDateString()}
                                    </div>
                                ) : <span className="text-gray-500 italic">Not recorded</span>}
                            </div>
                        )}
                    </div>
                </div>





                {/* Vitals History Table */}
                {!isNewPatient && vitalsHistory.length > 0 && (
                    <div className="mt-12 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaHistory className="text-gray-400" /> Previous Vitals Records
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BP</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HR</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SpO₂</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {vitalsHistory.map((h, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(h.created_at || h.recorded_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.blood_pressure || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.heart_rate || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.temperature ? `${h.temperature}°C` : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.oxygen_saturation ? `${h.oxygen_saturation}%` : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{h.weight ? `${h.weight}kg` : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, ...h }));
                                                        alert('Historical vitals copied to form.');
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                    title="Copy to current session"
                                                >
                                                    <FaSync size={12} /> <span className="text-xs">Copy</span>
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

    const renderLabsSection = useCallback(() => {
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FaVial className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Laboratory Results</h2>
                            <p className="text-gray-600">Complete laboratory test results</p>
                        </div>
                    </div>
                    {isEditing && (
                        <button
                            onClick={handleSaveLabs}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
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
                            <div key={cat} className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 mb-6">
                                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2 border-b border-indigo-50 pb-2">
                                    <FaVial className="text-indigo-400" /> {cat}
                                    <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full uppercase ml-2 tracking-wider">System Tests</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {labsInCat.map((lab) => {
                                        const labIndex = customLabs.findIndex(l => l.id === lab.id);
                                        return (
                                            <div key={lab.id} className="relative group">
                                                <LabInputField
                                                    label={lab.name}
                                                    value={lab.value}
                                                    unit={lab.unit}
                                                    normalRange={lab.reference_range}
                                                    isEditing={isEditing}
                                                    placeholder="Enter result..."
                                                    type="text"
                                                    handleChange={(_, val) => {
                                                        const updated = [...customLabs];
                                                        updated[labIndex].value = val;
                                                        setCustomLabs(updated);
                                                    }}
                                                />
                                                {lab.description && (
                                                    <div className="hidden group-hover:block absolute z-10 top-full left-0 mt-2 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg max-w-[200px]">
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



                <div className="space-y-8">
                    {/* --- NON-GLOBAL CUSTOM LABS --- */}
                    {customLabs.filter(l => !l.isGlobal).length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 mt-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                                <FaVial className="text-gray-500" /> Additional Tests
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {customLabs.filter(l => !l.isGlobal).map((lab) => {
                                    const labIndex = customLabs.findIndex(l => l.id === lab.id);
                                    return (
                                        <LabInputField
                                            key={lab.id}
                                            label={lab.name}
                                            value={lab.value}
                                            unit={lab.unit}
                                            normalRange={lab.reference_range}
                                            isEditing={isEditing}
                                            placeholder="Enter result..."
                                            handleChange={(_, val) => {
                                                const updated = [...customLabs];
                                                if (labIndex !== -1) {
                                                    updated[labIndex].value = val;
                                                    setCustomLabs(updated);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Last Tested Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Last Tested Date
                        </label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={formData.last_tested || ''}
                                onChange={(e) => handleInputChange('last_tested', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {formData.last_tested ? (
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400" />
                                        {new Date(formData.last_tested).toLocaleDateString()}
                                    </div>
                                ) : <span className="text-gray-500 italic">Not recorded</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Labs History Table */}
                {!isNewPatient && labsHistory.length > 0 && (
                    <div className="mt-12 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaHistory className="text-gray-400" /> Laboratory History
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Markers</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {labsHistory.map((h, idx) => {
                                        const labData = typeof h.labs === 'string' ? JSON.parse(h.labs) : h.labs;
                                        const markers = Object.entries(labData || {})
                                            .slice(0, 5) // Show first 5 markers
                                            .map(([k, v]) => `${k}: ${v}`)
                                            .join(', ');

                                        return (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(h.test_date || h.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {markers || 'No detailed data'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => {
                                                            const unpacked = {};
                                                            Object.entries(labData || {}).forEach(([k, v]) => {
                                                                // Normalize keys if needed
                                                                unpacked[k] = v;
                                                            });
                                                            setFormData(prev => ({ ...prev, ...unpacked }));
                                                            alert('Historical lab values copied to form.');
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Copy to current session"
                                                    >
                                                        <FaSync />
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

    const renderDemographicsSection = useCallback(() => {
        const ageDisplay = formatAgeDisplay(formData.age_in_days, formData.date_of_birth);
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        const patientCodeToDisplay = getCurrentPatientCode();
        const isIndividual = user?.account_type === 'individual' && user?.role !== 'admin';

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <FaUser className="text-indigo-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Patient Demographics</h2>
                            <p className="text-gray-600">Basic patient information</p>
                        </div>
                    </div>
                    {isEditing && (
                        <button
                            onClick={handleSaveDemographics}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <FaSave /> Save Info
                        </button>
                    )}
                </div>

                {ageDisplay && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                            {isPediatric ? (
                                formData.patient_type === 'neonate' ? <FaBaby className="text-blue-600 text-2xl" /> :
                                    formData.patient_type === 'infant' ? <FaBabyCarriage className="text-blue-600 text-2xl" /> :
                                        <FaChild className="text-blue-600 text-2xl" />
                            ) : (
                                <FaUser className="text-blue-600 text-2xl" />
                            )}
                            <div>
                                <h3 className="font-bold text-blue-800">Age Information</h3>
                                <p className="text-blue-700">{ageDisplay}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    {!isIndividual && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.full_name || ''}
                                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                    placeholder="Enter patient's full name"
                                    required
                                />
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    {patient?.full_name || <span className="text-gray-500 italic">Not specified</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Age Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">
                                Age {ageMode === 'days' && isPediatric ? '(in days)' : '(in years)'}
                            </label>
                            {isEditing && formData.age_in_days && parseInt(formData.age_in_days) < 730 && (
                                <button
                                    type="button"
                                    onClick={() => setAgeMode(ageMode === 'days' ? 'years' : 'days')}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Show in {ageMode === 'days' ? 'years/months' : 'days'}
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="flex gap-2">
                                {ageMode === 'days' && isPediatric ? (
                                    <input
                                        type="number"
                                        value={formData.age_in_days || ''}
                                        onChange={(e) => handleInputChange('age_in_days', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg p-3"
                                        placeholder="Enter age in days"
                                        min="0"
                                        max="365"
                                    />
                                ) : (
                                    <input
                                        type="number"
                                        value={formData.age || ''}
                                        onChange={(e) => handleInputChange('age', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg p-3"
                                        placeholder="Enter age"
                                        min="0"
                                        max="120"
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {ageDisplay || <span className="text-gray-500 italic">Not specified</span>}
                            </div>
                        )}
                    </div>

                    {/* Date of Birth */}
                    {!isIndividual && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Date of Birth
                        </label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={formData.date_of_birth || ''}
                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {patient?.date_of_birth ? (
                                    <div className="flex items-center gap-2">
                                        <FaBirthdayCake className="text-gray-400" />
                                        {new Date(patient.date_of_birth).toLocaleDateString()}
                                    </div>
                                ) : <span className="text-gray-500 italic">Not specified</span>}
                            </div>
                        )}
                    </div>

                    {/* Gender - FIXED: Only Male and Female */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Gender
                        </label>
                        {isEditing ? (
                            <select
                                value={formData.gender || ''}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {patient?.gender || <span className="text-gray-500 italic">Not specified</span>}
                            </div>
                        )}
                    </div>

                    {/* Patient Type */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Patient Category
                        </label>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {formData.patient_type ? (
                                <div className="flex items-center gap-2">
                                    {formData.patient_type === 'neonate' && <FaBaby className="text-pink-500" />}
                                    {formData.patient_type === 'infant' && <FaBabyCarriage className="text-purple-500" />}
                                    {formData.patient_type === 'child' && <FaChild className="text-blue-500" />}
                                    {formData.patient_type === 'adolescent' && <FaUser className="text-green-500" />}
                                    {formData.patient_type === 'adult' && <FaUser className="text-indigo-500" />}
                                    <span className="font-medium capitalize">
                                        {formData.patient_type}
                                        {formData.patient_type === 'neonate' && ' (0-28 days)'}
                                        {formData.patient_type === 'infant' && ' (29 days - 1 year)'}
                                        {formData.patient_type === 'child' && ' (1-12 years)'}
                                        {formData.patient_type === 'adolescent' && ' (13-18 years)'}
                                        {formData.patient_type === 'adult' && ' (>18 years)'}
                                    </span>
                                </div>
                            ) : <span className="text-gray-500 italic">Not determined</span>}
                        </div>
                    </div>

                    {/* Contact Number */}
                    {!isIndividual && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Contact Number
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={formData.contact_number || ''}
                                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder="Phone number"
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {patient?.contact_number ? (
                                    <div className="flex items-center gap-2">
                                        <FaPhone className="text-gray-400" />
                                        {patient.contact_number}
                                    </div>
                                ) : <span className="text-gray-500 italic">Not specified</span>}
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    {!isIndividual && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Address
                        </label>
                        {isEditing ? (
                            <textarea
                                value={formData.address || ''}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                rows="2"
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder="Patient's address"
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {patient?.address || <span className="text-gray-500 italic">Not specified</span>}
                            </div>
                        )}
                    </div>
                    {/* Allergies */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                            <FaAllergies /> Allergies
                        </label>
                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newAllergy}
                                        onChange={(e) => setNewAllergy(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg p-3"
                                        placeholder="Add an allergy (e.g., Penicillin)"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                                    />
                                    <button
                                        onClick={handleAddAllergy}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-2"
                                    >
                                        <FaPlus /> Add
                                    </button>
                                </div>
                                {Array.isArray(formData.allergies) && formData.allergies.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.allergies.map((allergy, index) => (
                                            <div key={index} className="bg-red-100 text-red-800 px-3 py-2 rounded-lg flex items-center gap-2">
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
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {Array.isArray(formData.allergies) && formData.allergies.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.allergies.map((allergy, index) => (
                                            <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg">
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

                    {/* Diagnosis */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Diagnosis
                        </label>
                        {isEditing ? (
                            <textarea
                                value={formData.diagnosis || ''}
                                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                                rows="3"
                                className="w-full border border-gray-300 rounded-lg p-3"
                                placeholder="Enter diagnosis"
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {formData.diagnosis || <span className="text-gray-500 italic">Not specified</span>}
                            </div>
                        )}
                    </div>

                    {/* Appointment Date */}
                    {!isIndividual && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Next Appointment
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.appointment_date || ''}
                                    onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3"
                                />
                            ) : (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    {formData.appointment_date ? (
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-400" />
                                            {new Date(formData.appointment_date).toLocaleDateString()}
                                        </div>
                                    ) : <span className="text-gray-500 italic">Not scheduled</span>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{formData.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>

                    {/* Pregnancy Status (Females Only) - Moved from Vitals */}
                    {(formData.gender && formData.gender.toLowerCase() === 'female') && (
                        <div className="bg-white rounded-xl shadow-lg p-6 mt-6 border border-pink-100 md:col-span-2">
                            <div className="flex justify-between items-center mb-6 border-b border-pink-100 pb-2">
                                <h3 className="text-lg font-bold text-pink-700 flex items-center gap-2">
                                    <FaBaby className="text-pink-500" /> Pregnancy Status
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                                    <label className="block text-xs font-bold text-pink-600 uppercase mb-2">Is Pregnant?</label>
                                    {isEditing ? (
                                        <div className="flex bg-white rounded-lg p-1 border border-pink-200">
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('is_pregnant', false)}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${!formData.is_pregnant ? 'bg-gray-100 text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('is_pregnant', true)}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all ${formData.is_pregnant ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:text-pink-400'}`}
                                            >
                                                Yes
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`p-2 font-bold rounded-md text-center ${formData.is_pregnant ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                            {formData.is_pregnant ? 'PREGNANT' : 'NOT PREGNANT'}
                                        </div>
                                    )}
                                </div>
                                {formData.is_pregnant && (
                                    <>
                                        <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                                            <label className="block text-xs font-bold text-pink-600 uppercase mb-2">Weeks</label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 12"
                                                    value={formData.pregnancy_weeks || ''}
                                                    onChange={e => handleInputChange('pregnancy_weeks', e.target.value)}
                                                    className="w-full px-3 py-2 border border-pink-200 rounded-md outline-none focus:ring-2 focus:ring-pink-500 transition bg-white font-bold text-pink-700"
                                                />
                                            ) : (
                                                <div className="p-2 font-bold text-pink-800 bg-white rounded-md text-center border border-pink-100">
                                                    {formData.pregnancy_weeks || '--'} Weeks
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                                            <label className="block text-xs font-bold text-pink-600 uppercase mb-2">Trimester</label>
                                            <div className="p-2 font-black text-pink-900 bg-pink-200 rounded-md text-center shadow-inner tracking-wider">
                                                {formData.pregnancy_trimester || 'SELECT WEEKS'}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lactation Status (Females Only) - Moved from Vitals */}
                    {(formData.gender && formData.gender.toLowerCase() === 'female') && (
                        <div className="bg-white rounded-xl shadow-lg p-6 mt-6 border border-blue-100 md:col-span-2">
                            <div className="flex justify-between items-center mb-6 border-b border-blue-100 pb-2">
                                <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                                    <FaBabyCarriage className="text-blue-500" /> Lactation Status
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Is Lactating/Breastfeeding?</label>
                                    {isEditing ? (
                                        <select
                                            value={formData.is_lactating ? 'true' : 'false'}
                                            onChange={(e) => handleInputChange('is_lactating', e.target.value === 'true')}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition bg-white font-bold text-blue-700 cursor-pointer"
                                        >
                                            <option value="false">No</option>
                                            <option value="true">Yes</option>
                                        </select>
                                    ) : (
                                        <div className={`p-2 font-bold rounded-md text-center ${formData.is_lactating ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                            {formData.is_lactating ? 'LACTATING' : 'NOT LACTATING'}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Lactation Notes</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            placeholder="e.g. Exclusive breastfeeding"
                                            value={formData.lactation_notes || ''}
                                            onChange={e => handleInputChange('lactation_notes', e.target.value)}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition bg-white font-bold text-blue-700"
                                        />
                                    ) : (
                                        <div className="p-2 font-bold text-blue-800 bg-white rounded-md border border-blue-100">
                                            {formData.lactation_notes || '--'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pediatric Information */}
                    {isPediatric && (
                        <div className="md:col-span-2 space-y-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                            <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                <FaBaby /> Pediatric Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Birth Weight
                                    </label>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.birth_weight || ''}
                                                onChange={(e) => handleInputChange('birth_weight', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg p-2"
                                                placeholder="e.g., 3.5"
                                            />
                                            <div className="w-16 bg-gray-100 border border-gray-300 rounded-lg p-2 text-center">
                                                kg
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-white rounded border">
                                            {formData.birth_weight || '--'} kg
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Birth Length
                                    </label>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={formData.birth_length || ''}
                                                onChange={(e) => handleInputChange('birth_length', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-lg p-2"
                                                placeholder="e.g., 50"
                                            />
                                            <div className="w-16 bg-gray-100 border border-gray-300 rounded-lg p-2 text-center">
                                                cm
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-white rounded border">
                                            {formData.birth_length || '--'} cm
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Feeding Method
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.feeding_method || ''}
                                            onChange={(e) => handleInputChange('feeding_method', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                        >
                                            <option value="">Select method</option>
                                            <option value="Breastfed">Breastfed</option>
                                            <option value="Formula">Formula</option>
                                            <option value="Mixed">Mixed</option>
                                            <option value="Solids">Solids</option>
                                        </select>
                                    ) : (
                                        <div className="p-2 bg-white rounded border">
                                            {formData.feeding_method || 'Not specified'}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Vaccination Status
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.vaccination_status || ''}
                                            onChange={(e) => handleInputChange('vaccination_status', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                        >
                                            <option value="">Select status</option>
                                            <option value="Up to date">Up to date</option>
                                            <option value="Partially vaccinated">Partially vaccinated</option>
                                            <option value="Not vaccinated">Not vaccinated</option>
                                            <option value="Unknown">Unknown</option>
                                        </select>
                                    ) : (
                                        <div className="p-2 bg-white rounded border">
                                            {formData.vaccination_status || 'Not specified'}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Developmental Milestones
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.developmental_milestones || ''}
                                            onChange={(e) => handleInputChange('developmental_milestones', e.target.value)}
                                            rows="2"
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                            placeholder="Describe developmental milestones"
                                        />
                                    ) : (
                                        <div className="p-2 bg-white rounded border min-h-[60px]">
                                            {formData.developmental_milestones || 'Not specified'}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Special Instructions
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.special_instructions || ''}
                                            onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                                            rows="2"
                                            className="w-full border border-gray-300 rounded-lg p-2"
                                            placeholder="Any special care instructions"
                                        />
                                    ) : (
                                        <div className="p-2 bg-white rounded border min-h-[60px]">
                                            {formData.special_instructions || 'None'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isEditing && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSaveDemographics}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                        >
                            <FaSave /> Save Demographics
                        </button>
                    </div>
                )}
            </div>
        );
    }, [formData, patient, isEditing, ageMode, newAllergy, handleSaveDemographics, formatAgeDisplay, handleInputChange, handleAddAllergy, handleRemoveAllergy]);

    const renderOverviewSection = useCallback(() => {
        const ageDisplay = formatAgeDisplay(formData.age_in_days, formData.date_of_birth);
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        const patientCodeToDisplay = getCurrentPatientCode();

        return (
            <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-shrink-0">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${isPediatric
                                ? 'bg-gradient-to-br from-pink-500 to-purple-600'
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                }`}>
                                {isPediatric ? (
                                    formData.patient_type === 'neonate' ? <FaBaby className="text-white text-4xl" /> :
                                        formData.patient_type === 'infant' ? <FaBabyCarriage className="text-white text-4xl" /> :
                                            <FaChild className="text-white text-4xl" />
                                ) : (
                                    <FaUser className="text-white text-4xl" />
                                )}
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">
                                        {patient?.full_name || (user?.account_type !== 'individual' || user?.role === 'admin' ? `Patient ${patientCodeToDisplay}` : 'Patient Profile')}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        {(user?.account_type !== 'individual' || user?.role === 'admin') && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">Patient Code:</span>
                                                <span className="font-semibold text-indigo-600">{patientCodeToDisplay || 'N/A'}</span>
                                            </div>
                                        )}
                                        {ageDisplay && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">Age:</span>
                                                <span className="font-semibold">{ageDisplay}</span>
                                            </div>
                                        )}
                                        {formData.gender && (
                                            <div className="flex items-center gap-2">
                                                <FaVenusMars className="text-gray-400" />
                                                <span className="font-semibold">{formData.gender}</span>
                                            </div>
                                        )}
                                        {isPediatric && (
                                            <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full flex items-center gap-1">
                                                {formData.patient_type === 'neonate' ? <FaBaby /> :
                                                    formData.patient_type === 'infant' ? <FaBabyCarriage /> :
                                                        <FaChild />}
                                                {formData.patient_type.toUpperCase()}
                                            </div>
                                        )}
                                        {formData.is_pregnant && (
                                            <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full flex items-center gap-1">
                                                <FaBaby /> Pregnancy: {formData.pregnancy_weeks} weeks
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${formData.is_active
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                        }`}>
                                        {formData.is_active ? 'Active Patient' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            {(formData.contact_number || formData.address) && (
                                <div className="mt-4 pt-4 border-t border-blue-200">
                                    <div className="flex flex-wrap gap-4">
                                        {formData.contact_number && (
                                            <div className="flex items-center gap-2">
                                                <FaPhone className="text-blue-500" />
                                                <span className="text-gray-700">{formData.contact_number}</span>
                                            </div>
                                        )}
                                        {formData.address && (
                                            <div className="flex items-center gap-2">
                                                <FaHome className="text-blue-500" />
                                                <span className="text-gray-700">{formData.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Vitals & Anthropometry</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {(() => {
                                        const vitals = ['blood_pressure', 'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation', 'weight', 'height'];
                                        return vitals.filter(v => formData[v] && formData[v].toString().trim() !== '').length;
                                    })()}
                                </p>
                            </div>
                            <FaHeartbeat className="text-blue-400 text-xl" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Recorded parameters</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Lab Tests</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {(() => {
                                        const explicitLabs = [
                                            'hemoglobin', 'hematocrit', 'wbc_count', 'rbc_count', 'platelet_count',
                                            'blood_sugar', 'creatinine', 'urea', 'sodium', 'potassium', 'inr', 'tsh',
                                            'crp', 'alt', 'ast', 'bilirubin_total', 'hba1c'
                                        ];
                                        const recordedExplicit = explicitLabs.filter(l => formData[l] && formData[l].toString().trim() !== '').length;
                                        const recordedCustom = customLabs.filter(l => l.value && l.value.toString().trim() !== '').length;
                                        return recordedExplicit + recordedCustom;
                                    })()}
                                </p>
                            </div>
                            <FaVial className="text-green-400 text-xl" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Completed tests</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Allergies</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formData.allergies ? formData.allergies.length : 0}
                                </p>
                            </div>
                            <FaAllergies className="text-red-400 text-xl" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Known allergies</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {formData.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                            <FaUser className="text-indigo-400 text-xl" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Patient status</p>
                    </div>
                </div>

                {/* Pregnancy Status Card */}
                {formData.is_pregnant && (
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-pink-100 p-3 rounded-full">
                                    <FaBaby className="text-pink-600 text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-pink-800">Pregnancy Information</h3>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-pink-700 font-medium">{formData.pregnancy_weeks} weeks</span>
                                            <span className="text-gray-600">({formData.pregnancy_trimester})</span>
                                        </div>
                                        {formData.edd && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">EDD:</span>
                                                <span className="font-medium">{new Date(formData.edd).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {formData.pregnancy_notes && (
                                <div className="text-sm text-gray-600 max-w-md">
                                    {formData.pregnancy_notes}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Allergies Display */}
                {Array.isArray(formData.allergies) && formData.allergies.length > 0 && (
                    <div className="bg-white rounded-lg border border-red-200 p-6">
                        <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                            <FaAllergies /> Allergies
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {formData.allergies.map((allergy, index) => (
                                <div key={index} className="bg-red-100 text-red-800 px-4 py-2 rounded-lg flex items-center gap-2">
                                    <FaExclamationTriangle />
                                    <span className="font-medium">{allergy}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CONSOLIDATED RECENT LABS (HIGH PRIORITY) --- */}
                {(() => {
                    const explicitLabList = [
                        { field: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
                        { field: 'creatinine', label: 'Creatinine', unit: 'mg/dL' },
                        { field: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL' },
                        { field: 'inr', label: 'INR', unit: '' },
                        { field: 'tsh', label: 'TSH', unit: 'μIU/mL' },
                        { field: 'sodium', label: 'Sodium', unit: 'mmol/L' },
                        { field: 'potassium', label: 'Potassium', unit: 'mmol/L' },
                        { field: 'hba1c', label: 'HbA1c', unit: '%' },
                        { field: 'crp', label: 'CRP', unit: 'mg/L' }
                    ];

                    const results = [];
                    // Add explicit ones
                    explicitLabList.forEach(f => {
                        const val = formData[f.field];
                        if (val && val.toString().trim() !== '') {
                            results.push({ name: f.label, value: val, unit: f.unit });
                        }
                    });

                    // Add custom ones
                    const resultsNames = new Set(results.map(r => r.name.toLowerCase()));
                    customLabs.forEach(lab => {
                        if (lab.value && lab.value.toString().trim() !== '' && !resultsNames.has(lab.name.toLowerCase())) {
                            results.push({ name: lab.name, value: lab.value, unit: lab.unit || '' });
                        }
                    });

                    if (results.length === 0) return null;

                    return (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <FaVial className="text-6xl text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                                <FaVial className="text-green-500" /> Key Laboratory Findings
                            </h3>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                                {results.slice(0, 12).map((lab, idx) => (
                                    <div key={idx} className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-green-100 flex items-center justify-between shadow-sm">
                                        <div className="flex flex-col">
                                            <p className="text-[9px] uppercase font-bold text-green-600 tracking-wider text-left">{lab.name}</p>
                                            {lab.unit && <p className="text-[8px] text-gray-400 font-medium">{lab.unit}</p>}
                                        </div>
                                        <p className="text-lg font-black text-gray-800 ml-2">{lab.value}</p>
                                    </div>
                                ))}
                            </div>
                            {results.length > 12 && (
                                <p className="text-xs text-green-600 mt-4 text-center font-medium">
                                    + {results.length - 12} more results available in the <strong>Labs</strong> tab
                                </p>
                            )}
                            {formData.last_tested && (
                                <p className="text-[10px] text-gray-400 mt-4 text-right italic">
                                    Last laboratory update: {new Date(formData.last_tested).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    );
                })()}

                {/* Recent Vitals */}
                {(() => {
                    const hasVitals = ['blood_pressure', 'heart_rate', 'temperature', 'oxygen_saturation'].some(v => formData[v] && formData[v].toString().trim() !== '');
                    if (!hasVitals) return null;

                    return (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaHeartbeat className="text-red-500" /> Recent Vitals
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.blood_pressure && (
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-between shadow-sm">
                                        <div className="flex flex-col">
                                            <p className="text-[9px] uppercase font-bold text-red-600 tracking-wider text-left">BP</p>
                                            <p className="text-[8px] text-gray-400 font-medium">mmHg</p>
                                        </div>
                                        <p className="text-lg font-black text-gray-800 ml-2">{formData.blood_pressure}</p>
                                    </div>
                                )}
                                {formData.heart_rate && (
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-between shadow-sm">
                                        <div className="flex flex-col">
                                            <p className="text-[9px] uppercase font-bold text-red-600 tracking-wider text-left">Heart Rate</p>
                                            <p className="text-[8px] text-gray-400 font-medium">bpm</p>
                                        </div>
                                        <p className="text-lg font-black text-gray-800 ml-2">{formData.heart_rate}</p>
                                    </div>
                                )}
                                {formData.temperature && (
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-between shadow-sm">
                                        <div className="flex flex-col">
                                            <p className="text-[9px] uppercase font-bold text-red-600 tracking-wider text-left">Temp</p>
                                            <p className="text-[8px] text-gray-400 font-medium">°C</p>
                                        </div>
                                        <p className="text-lg font-black text-gray-800 ml-2">{formData.temperature}</p>
                                    </div>
                                )}
                                {formData.oxygen_saturation && (
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex items-center justify-between shadow-sm">
                                        <div className="flex flex-col">
                                            <p className="text-[9px] uppercase font-bold text-red-600 tracking-wider text-left">SpO₂</p>
                                            <p className="text-[8px] text-gray-400 font-medium">%</p>
                                        </div>
                                        <p className="text-lg font-black text-gray-800 ml-2">{formData.oxygen_saturation}</p>
                                    </div>
                                )}
                            </div>
                            {formData.last_measured && (
                                <p className="text-xs text-gray-500 mt-4 text-right">
                                    Last measured: {new Date(formData.last_measured).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    );
                })()}

                {/* Diagnosis */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaStethoscope className="text-indigo-500" /> Diagnosis
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        {formData.diagnosis ? (
                            <p className="text-gray-800">{formData.diagnosis}</p>
                        ) : (
                            <p className="text-gray-500 italic">No diagnosis recorded</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }, [formData, patient, getCurrentPatientCode, formatAgeDisplay, customLabs]);

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
                return <MedicationHistory patientCode={getCurrentPatientCode()} />;
            case 'analysis':
                return <CDSSDisplay
                    patientData={formData}
                    onBack={() => { }} // Empty function since we're already in patient details
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <span className="text-gray-600 mb-2">Loading patient data...</span>
                {!isOnline && (
                    <div className="text-yellow-600 text-sm flex items-center gap-1">
                        <FaExclamationTriangle /> You are currently offline
                    </div>
                )}
            </div>
        );
    }

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
                                onClick={() => navigate('/patients')}
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
                                            {formData.full_name} • {formatAgeDisplay(formData.age_in_days, formData.date_of_birth)} • {formData.gender || 'Gender not specified'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">

                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${isEditing
                                    ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    }`}
                            >
                                <FaEdit /> <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
                            </button>
                            {isEditing && (
                                <button
                                    onClick={handleSaveAll}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                                >
                                    <FaSave /> <span className="hidden sm:inline">{isNewPatient ? 'Create' : 'Save'}</span>
                                </button>
                            )}

                            {/* Activate Support Button (Visible to Owner only and if NOT already active) */}
                            {!isNewPatient && !isSupportActive && (user?.userId === patient?.user_id || user?.id === patient?.user_id) && (
                                <button
                                    onClick={() => setIsSupportModalOpen(true)}
                                    className="bg-white border border-blue-200 text-blue-600 px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow-sm hover:bg-blue-50 transition-all font-bold"
                                    title="Grant encrypted access to an admin"
                                >
                                    <FaShieldAlt /> <span className="hidden sm:inline">Activate Support</span>
                                </button>
                            )}

                            {/* Active Support Indicator & Revoke Button */}
                            {isSupportActive && (user?.userId === patient?.user_id || user?.id === patient?.user_id) && (
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        Support Active
                                    </div>
                                    <button
                                        onClick={handleRevokeSupport}
                                        className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                        title="Close the secure vault and revoke access"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            )}

                            {!isNewPatient && user?.role !== 'healthcare_client' && (
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
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-2.5 md:px-4 rounded-lg font-medium text-xs flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-all ${activeTab === tab.id
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="text-sm flex-shrink-0" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4 md:p-6">
                    {/* 🔐 PATIENT UNLOCKER: Gates all content until decrypted */}
                    {!isNewPatient && patient ? (
                        <PatientUnlocker
                            patientData={patient}
                            userSalt={patientOwnerSalt}
                            onUnlocked={(decrypted) => {
                                loadPatientData(decrypted);
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
                            setIsSupportActive(true);
                            setIsSupportModalOpen(false);
                            checkSupportStatus();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default PatientDetails;
