import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    FaUser, 
    FaStethoscope, 
    FaFlask, 
    FaSave,
    FaPills,
    FaChartLine,
    FaFileMedical,
    FaMoneyBillWave,
    FaCheckCircle,
    FaArrowLeft,
    FaEdit,
    FaTrash,
    FaPrint,
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
    FaProcedures,
    FaPrescriptionBottleAlt,
    FaWifi,
    FaSync
} from 'react-icons/fa';

// Import components
import MedicationHistory from '../components/Patient/MedicationHistory';
import DRNAssessment from '../components/Patient/DRNAssessment';
import PhAssistPlan from '../components/Patient/PhAssistPlan';
import PatientOutcome from '../components/Patient/PatientOutcome';
import CostSection from '../components/Patient/CostSection';

// API Base URL - Updated to use Vercel backend
const API_BASE_URL = 'https://addis-backend-henna.vercel.app/api';
console.log('Using API URL:', API_BASE_URL);

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
            <label className="block text-sm font-medium text-gray-700">
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
                        className="flex-1 border border-gray-300 rounded-l-lg p-3 text-sm"
                        placeholder={placeholder}
                        readOnly={readOnly}
                    />
                    <div className="w-16 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg p-3 text-center text-sm text-gray-700">
                        {unit}
                    </div>
                </div>
            ) : (
                <div className="flex items-center">
                    <div className="flex-1 bg-blue-50 border border-blue-200 rounded-l-lg p-3 text-sm">
                        <span className="font-medium text-gray-800">
                            {value || '--'}
                        </span>
                    </div>
                    <div className="w-16 bg-blue-100 border border-l-0 border-blue-200 rounded-r-lg p-3 text-center text-sm text-gray-700">
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
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNewPatient, setIsNewPatient] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [newAllergy, setNewAllergy] = useState('');
    const [ageMode, setAgeMode] = useState('years');
    const [showPediatricLabs, setShowPediatricLabs] = useState(false);
    const [currentPatientCode, setCurrentPatientCode] = useState('');
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [backendStatus, setBackendStatus] = useState('checking');
    const [retryCount, setRetryCount] = useState(0);
    
    // Form state with all complete fields
    const [formData, setFormData] = useState({
        // Basic Info
        full_name: '',
        age: '',
        age_in_days: '',
        gender: '',
        date_of_birth: '',
        contact_number: '',
        address: '',
        diagnosis: '',
        appointment_date: '',
        is_active: true,
        allergies: [],
        
        // Patient type
        patient_type: 'adult',
        
        // Pregnancy status
        is_pregnant: false,
        pregnancy_weeks: '',
        pregnancy_trimester: '',
        edd: '',
        pregnancy_notes: '',
        
        // Vitals - Complete
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        length: '',
        head_circumference: '',
        bmi: '',
        last_measured: '',
        
        // Growth percentiles
        weight_percentile: '',
        height_percentile: '',
        head_circumference_percentile: '',
        bmi_percentile: '',
        
        // Pediatric info
        developmental_milestones: '',
        feeding_method: '',
        birth_weight: '',
        birth_length: '',
        vaccination_status: '',
        special_instructions: '',
        
        // Labs - Complete CBC
        hemoglobin: '',
        hematocrit: '',
        wbc_count: '',
        rbc_count: '',
        platelet_count: '',
        mcv: '',
        mch: '',
        mchc: '',
        rdw: '',
        neutrophils: '',
        lymphocytes: '',
        monocytes: '',
        eosinophils: '',
        basophils: '',
        
        // Chemistry
        blood_sugar: '',
        creatinine: '',
        urea: '',
        uric_acid: '',
        sodium: '',
        potassium: '',
        chloride: '',
        bicarbonate: '',
        calcium: '',
        magnesium: '',
        phosphate: '',
        
        // Liver Function
        alt: '',
        ast: '',
        alp: '',
        ggt: '',
        bilirubin_total: '',
        bilirubin_direct: '',
        bilirubin_indirect: '',
        albumin: '',
        total_protein: '',
        
        // Cardiac
        troponin: '',
        ck_mb: '',
        ldh: '',
        myoglobin: '',
        
        // Thyroid
        tsh: '',
        free_t4: '',
        free_t3: '',
        total_t4: '',
        total_t3: '',
        
        // Inflammatory
        crp: '',
        esr: '',
        ferritin: '',
        procalcitonin: '',
        
        // Coagulation
        inr: '',
        pt: '',
        ptt: '',
        fibrinogen: '',
        d_dimer: '',
        
        // Urinalysis
        urine_protein: '',
        urine_glucose: '',
        urine_blood: '',
        urine_leukocytes: '',
        urine_nitrite: '',
        urine_specific_gravity: '',
        urine_ph: '',
        urine_ketones: '',
        urine_bilirubin: '',
        urine_urobilinogen: '',
        
        // Diabetes
        hba1c: '',
        fasting_glucose: '',
        postprandial_glucose: '',
        random_glucose: '',
        insulin: '',
        c_peptide: '',
        
        // Lipid Profile
        total_cholesterol: '',
        hdl_cholesterol: '',
        ldl_cholesterol: '',
        triglycerides: '',
        vldl_cholesterol: '',
        
        // Renal
        egfr: '',
        bun: '',
        
        // Pediatric labs
        bilirubin_neonatal: '',
        glucose_neonatal: '',
        calcium_neonatal: '',
        pku_result: '',
        thyroid_screening: '',
        
        // Last tested
        last_tested: ''
    });

    // Use useMemo for heavy computations that depend on formData
    const pediatricAgeGroups = useMemo(() => [
        { type: 'neonate', minDays: 0, maxDays: 28, label: 'Neonate (0-28 days)', icon: FaBaby },
        { type: 'infant', minDays: 29, maxDays: 365, label: 'Infant (29 days - 1 year)', icon: FaBabyCarriage },
        { type: 'child', minDays: 366, maxDays: 12*365, label: 'Child (1-12 years)', icon: FaChild },
        { type: 'adolescent', minDays: 13*365 + 1, maxDays: 18*365, label: 'Adolescent (13-18 years)', icon: FaUser },
        { type: 'adult', minDays: 18*365 + 1, maxDays: 99999, label: 'Adult (>18 years)', icon: FaUser }
    ], []);

    const tabs = useMemo(() => [
        { id: 'overview', label: 'Overview', icon: FaUser },
        { id: 'demographics', label: 'Demographics', icon: FaUser },
        { id: 'vitals', label: 'Vitals', icon: FaHeartbeat },
        { id: 'labs', label: 'Labs', icon: FaFlask },
        { id: 'medications', label: 'Medications', icon: FaPills },
        { id: 'drn', label: 'DRN Assessment', icon: FaStethoscope },
        { id: 'plan', label: 'PharmAssist Plan', icon: FaFileMedical },
        { id: 'outcome', label: 'Outcome', icon: FaChartLine },
        { id: 'cost', label: 'Cost', icon: FaMoneyBillWave }
    ], []);

    // Debug function
    const debugLog = useCallback((message, data = null) => {
        console.log(`🔍 [PatientDetails] ${message}`, data ? data : '');
    }, []);

    // Network and backend status monitoring
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            console.log('Device is online');
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            console.log('Device is offline');
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Check backend status periodically
        const checkBackendStatus = async () => {
            try {
                console.log('Checking backend status at:', `${API_BASE_URL}/health`);
                const response = await fetch(`${API_BASE_URL}/health`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    setBackendStatus('online');
                    console.log('Backend is online');
                } else {
                    setBackendStatus('offline');
                    console.log('Backend returned error status:', response.status);
                }
            } catch (error) {
                setBackendStatus('offline');
                console.log('Backend is offline:', error.message);
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
        debugLog('Component mounted with patientCode:', patientCode);
        debugLog('API Base URL:', API_BASE_URL);
        
        // Check URL for edit mode
        const searchParams = new URLSearchParams(location.search);
        const isEditMode = searchParams.get('edit') === 'true';
        
        if (isEditMode) {
            debugLog('Edit mode detected from URL');
            setIsEditing(true);
        }
        
        // Always fetch patient data
        fetchPatientData();
        
        // Clean up sessionStorage on unmount
        return () => {
            sessionStorage.removeItem('editPatientData');
            sessionStorage.removeItem('editPatientCode');
        };
    }, [patientCode, location.search, debugLog]);

    // Enhanced fetch with retry logic
    const fetchWithRetry = useCallback(async (url, options, maxRetries = 3) => {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                debugLog(`Attempt ${attempt}/${maxRetries} to fetch ${url}`);
                
                const response = await fetch(url, options);
                
                if (response.ok) {
                    return response;
                }
                
                // Don't retry on 404 or 401 errors
                if (response.status === 404 || response.status === 401) {
                    return response;
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            } catch (error) {
                lastError = error;
                debugLog(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    // Wait before retrying (exponential backoff)
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    debugLog(`Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }, [debugLog]);

    const generatePatientCode = useCallback(() => {
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PAT${timestamp}${randomNum}`;
    }, []);

    const getCurrentPatientCode = useCallback(() => {
        if (currentPatientCode) {
            return currentPatientCode;
        }
        if (patient?.patient_code) {
            return patient.patient_code;
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
            debugLog('Error calculating age in days:', error);
            return '';
        }
    }, [isValidDate, debugLog]);

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
            debugLog('Error calculating age:', error);
            return '';
        }
    }, [isValidDate, debugLog]);

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
        } else if (daysNum < 13*365) {
            const years = Math.floor(daysNum / 365);
            const months = Math.floor((daysNum % 365) / 30.44);
            if (months > 0) {
                return `${years} years ${months} months (Child)`;
            }
            return `${years} years (Child)`;
        } else if (daysNum < 19*365) {
            const years = Math.floor(daysNum / 365);
            return `${years} years (Adolescent)`;
        } else {
            const years = Math.floor(daysNum / 365);
            return `${years} years (Adult)`;
        }
    }, [isValidDate, calculateAgeInDays]);

    const calculateBMI = useCallback((weight, height) => {
        if (!weight || !height || parseFloat(height) <= 0) return '';
        const heightInMeters = parseFloat(height) / 100;
        const weightNum = parseFloat(weight);
        const bmi = weightNum / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
    }, []);

    const calculateTrimester = useCallback((weeks) => {
        if (!weeks) return '';
        const weekNum = parseInt(weeks);
        if (weekNum <= 13) return '1st Trimester';
        if (weekNum <= 27) return '2nd Trimester';
        return '3rd Trimester';
    }, []);

    // FIXED: fetchPatientData with better error handling
    const fetchPatientData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            debugLog('Starting patient fetch for:', patientCode);
            debugLog('API URL will be:', `${API_BASE_URL}/patients/code/${patientCode}`);
            
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login again');
                navigate('/login');
                return;
            }
            
            // CASE 1: Creating a new patient
            if (patientCode === 'new') {
                debugLog('Creating new patient');
                
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
            
            // CASE 2: Fetching existing patient
            debugLog('Fetching existing patient from API...');
            
            const url = `${API_BASE_URL}/patients/code/${patientCode}`;
            debugLog('Fetch URL:', url);
            
            const response = await fetchWithRetry(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            debugLog('API Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                debugLog('API Response data:', result);
                
                if (result.success && result.patient) {
                    debugLog('✅ Patient found:', result.patient.patient_code);
                    loadPatientData(result.patient);
                    
                    const searchParams = new URLSearchParams(location.search);
                    const isEditMode = searchParams.get('edit') === 'true';
                    
                    if (isEditMode) {
                        setIsEditing(true);
                    }
                } else if (result.data) {
                    // Handle case where patient is returned directly in data
                    debugLog('✅ Patient found in data:', result.data.patient_code);
                    loadPatientData(result.data);
                } else {
                    throw new Error('Patient data not found in response');
                }
            } else if (response.status === 404) {
                debugLog('Patient not found (404)');
                setError('Patient not found. This patient may have been deleted or you may not have permission to view it.');
                setIsNewPatient(true);
                setIsEditing(true);
            } else if (response.status === 401 || response.status === 403) {
                debugLog('Authentication error');
                setError('Access denied. Please login again.');
                navigate('/login');
            } else {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }
        } catch (error) {
            debugLog('❌ Error fetching patient:', error);
            
            // Check if it's a network error
            if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed')) {
                setError('Cannot connect to server. Please check your internet connection and try again.');
                setRetryCount(prev => prev + 1);
            } else {
                setError(`Failed to load patient: ${error.message}`);
            }
            
            setIsNewPatient(true);
            setIsEditing(true);
        } finally {
            setLoading(false);
        }
    }, [patientCode, navigate, debugLog, generatePatientCode, location.search, fetchWithRetry]);

    // FIXED: loadPatientData with proper date validation
    const loadPatientData = useCallback((patientData) => {
        debugLog('Loading patient data:', patientData.patient_code);
        
        setIsNewPatient(false);
        setPatient(patientData);
        setCurrentPatientCode(patientData.patient_code);
        
        const data = patientData;
        
        // Validate and calculate age
        const dob = data.date_of_birth;
        let ageInDays = data.age_in_days || '';
        let ageInYears = data.age || '';
        
        if (dob && isValidDate(dob)) {
            ageInDays = calculateAgeInDays(dob);
            ageInYears = calculateAge(dob);
        } else if (data.date_of_birth) {
            // Invalid date in database, clear it
            debugLog('Invalid date of birth in database:', data.date_of_birth);
        }
        
        const patientType = data.patient_type || determinePatientType(ageInDays);
        
        // Build complete form data object
        const formDataToSet = {
            // Basic Info
            full_name: data.full_name || '',
            age: ageInYears,
            age_in_days: ageInDays,
            gender: data.gender || '',
            date_of_birth: (dob && isValidDate(dob)) ? dob.split('T')[0] : '',
            contact_number: data.contact_number || '',
            address: data.address || '',
            diagnosis: data.diagnosis || '',
            appointment_date: (data.appointment_date && isValidDate(data.appointment_date)) ? data.appointment_date.split('T')[0] : '',
            is_active: data.is_active !== false,
            allergies: Array.isArray(data.allergies) ? data.allergies : [],
            patient_type: patientType,
            
            // Pregnancy
            is_pregnant: data.is_pregnant || false,
            pregnancy_weeks: data.pregnancy_weeks || '',
            pregnancy_trimester: data.pregnancy_trimester || '',
            edd: (data.edd && isValidDate(data.edd)) ? data.edd.split('T')[0] : '',
            pregnancy_notes: data.pregnancy_notes || '',
            
            // Vitals
            blood_pressure: data.blood_pressure || '',
            heart_rate: data.heart_rate || '',
            temperature: data.temperature || '',
            respiratory_rate: data.respiratory_rate || '',
            oxygen_saturation: data.oxygen_saturation || '',
            weight: data.weight || '',
            height: data.height || '',
            length: data.length || '',
            head_circumference: data.head_circumference || '',
            bmi: data.bmi || calculateBMI(data.weight, data.height),
            last_measured: (data.last_measured && isValidDate(data.last_measured)) ? data.last_measured.split('T')[0] : new Date().toISOString().split('T')[0],
            
            // Growth percentiles
            weight_percentile: data.weight_percentile || '',
            height_percentile: data.height_percentile || '',
            head_circumference_percentile: data.head_circumference_percentile || '',
            bmi_percentile: data.bmi_percentile || '',
            
            // Pediatric info
            developmental_milestones: data.developmental_milestones || '',
            feeding_method: data.feeding_method || '',
            birth_weight: data.birth_weight || '',
            birth_length: data.birth_length || '',
            vaccination_status: data.vaccination_status || '',
            special_instructions: data.special_instructions || '',
            
            // Labs - CBC
            hemoglobin: data.hemoglobin || '',
            hematocrit: data.hematocrit || '',
            wbc_count: data.wbc_count || '',
            rbc_count: data.rbc_count || '',
            platelet_count: data.platelet_count || '',
            mcv: data.mcv || '',
            mch: data.mch || '',
            mchc: data.mchc || '',
            rdw: data.rdw || '',
            neutrophils: data.neutrophils || '',
            lymphocytes: data.lymphocytes || '',
            monocytes: data.monocytes || '',
            eosinophils: data.eosinophils || '',
            basophils: data.basophils || '',
            
            // Chemistry
            blood_sugar: data.blood_sugar || '',
            creatinine: data.creatinine || '',
            urea: data.urea || '',
            uric_acid: data.uric_acid || '',
            sodium: data.sodium || '',
            potassium: data.potassium || '',
            chloride: data.chloride || '',
            bicarbonate: data.bicarbonate || '',
            calcium: data.calcium || '',
            magnesium: data.magnesium || '',
            phosphate: data.phosphate || '',
            
            // Liver Function
            alt: data.alt || '',
            ast: data.ast || '',
            alp: data.alp || '',
            ggt: data.ggt || '',
            bilirubin_total: data.bilirubin_total || '',
            bilirubin_direct: data.bilirubin_direct || '',
            bilirubin_indirect: data.bilirubin_indirect || '',
            albumin: data.albumin || '',
            total_protein: data.total_protein || '',
            
            // Cardiac
            troponin: data.troponin || '',
            ck_mb: data.ck_mb || '',
            ldh: data.ldh || '',
            myoglobin: data.myoglobin || '',
            
            // Thyroid
            tsh: data.tsh || '',
            free_t4: data.free_t4 || '',
            free_t3: data.free_t3 || '',
            total_t4: data.total_t4 || '',
            total_t3: data.total_t3 || '',
            
            // Inflammatory
            crp: data.crp || '',
            esr: data.esr || '',
            ferritin: data.ferritin || '',
            procalcitonin: data.procalcitonin || '',
            
            // Coagulation
            inr: data.inr || '',
            pt: data.pt || '',
            ptt: data.ptt || '',
            fibrinogen: data.fibrinogen || '',
            d_dimer: data.d_dimer || '',
            
            // Urinalysis
            urine_protein: data.urine_protein || '',
            urine_glucose: data.urine_glucose || '',
            urine_blood: data.urine_blood || '',
            urine_leukocytes: data.urine_leukocytes || '',
            urine_nitrite: data.urine_nitrite || '',
            urine_specific_gravity: data.urine_specific_gravity || '',
            urine_ph: data.urine_ph || '',
            urine_ketones: data.urine_ketones || '',
            urine_bilirubin: data.urine_bilirubin || '',
            urine_urobilinogen: data.urine_urobilinogen || '',
            
            // Diabetes
            hba1c: data.hba1c || '',
            fasting_glucose: data.fasting_glucose || '',
            postprandial_glucose: data.postprandial_glucose || '',
            random_glucose: data.random_glucose || '',
            insulin: data.insulin || '',
            c_peptide: data.c_peptide || '',
            
            // Lipid Profile
            total_cholesterol: data.total_cholesterol || '',
            hdl_cholesterol: data.hdl_cholesterol || '',
            ldl_cholesterol: data.ldl_cholesterol || '',
            triglycerides: data.triglycerides || '',
            vldl_cholesterol: data.vldl_cholesterol || '',
            
            // Renal
            egfr: data.egfr || '',
            bun: data.bun || '',
            
            // Pediatric labs
            bilirubin_neonatal: data.bilirubin_neonatal || '',
            glucose_neonatal: data.glucose_neonatal || '',
            calcium_neonatal: data.calcium_neonatal || '',
            pku_result: data.pku_result || '',
            thyroid_screening: data.thyroid_screening || '',
            
            // Last tested
            last_tested: (data.last_tested && isValidDate(data.last_tested)) ? data.last_tested.split('T')[0] : new Date().toISOString().split('T')[0]
        };
        
        setFormData(formDataToSet);
        
        // Set age mode for pediatric patients
        if (ageInDays && parseInt(ageInDays) < 365) {
            setAgeMode('days');
            setShowPediatricLabs(true);
        } else {
            setAgeMode('years');
            setShowPediatricLabs(false);
        }
        
        debugLog('Patient data loaded successfully');
    }, [debugLog, isValidDate, calculateAgeInDays, calculateAge, determinePatientType, calculateBMI]);

    // Create a memoized change handler for lab inputs
    const handleLabInputChange = useCallback((field, value) => {
        debugLog(`Lab input change: ${field} =`, value);
        
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
            
            // Allow decimal numbers
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
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
    }, [debugLog]);

    // Create a memoized change handler for vitals inputs
    const handleVitalsInputChange = useCallback((field, value) => {
        debugLog(`Vitals input change: ${field} =`, value);
        
        // Handle weight and height for BMI calculation
        if (field === 'weight' || field === 'height') {
            const newWeight = field === 'weight' ? value : formData.weight;
            const newHeight = field === 'height' ? value : formData.height;
            const newBmi = calculateBMI(newWeight, newHeight);
            
            setFormData(prev => ({
                ...prev,
                [field]: value,
                bmi: newBmi
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
    }, [formData.weight, formData.height, debugLog, calculateBMI]);

    const handleInputChange = useCallback((field, value) => {
        debugLog(`Input change: ${field} =`, value);
        
        // Handle date fields with validation
        if (field === 'date_of_birth' && value) {
            if (!isValidDate(value)) {
                debugLog('Invalid date entered:', value);
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
                debugLog('Invalid date for field', field, value);
                // Don't update if invalid
                return;
            }
        }
        
        // For basic text/number fields in demographics
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, [debugLog, isValidDate, calculateAgeInDays, calculateAge, determinePatientType, calculateTrimester]);

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
            if (days < 6*365) return '75-115 bpm';
            if (days < 12*365) return '70-110 bpm';
            if (days < 18*365) return '60-100 bpm';
            return '60-100 bpm';
        }
        
        if (measurement === 'respiratory_rate') {
            if (days < 28) return '40-60 breaths/min';
            if (days < 365) return '30-40 breaths/min';
            if (days < 6*365) return '20-30 breaths/min';
            if (days < 12*365) return '18-25 breaths/min';
            if (days < 18*365) return '12-20 breaths/min';
            return '12-20 breaths/min';
        }
        
        if (measurement === 'blood_pressure') {
            if (days < 28) return '65/45 mmHg';
            if (days < 365) return '80/55 mmHg';
            if (days < 6*365) return '95/60 mmHg';
            if (days < 12*365) return '105/65 mmHg';
            if (days < 18*365) return '110/70 mmHg';
            return '120/80 mmHg';
        }
        
        return '';
    }, []);

    // Test backend connection
    const testBackendConnection = useCallback(async () => {
        try {
            console.log('Testing backend connection to:', API_BASE_URL);
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend is healthy:', data);
                setBackendStatus('online');
                return true;
            } else {
                console.log('❌ Backend returned error:', response.status);
                setBackendStatus('offline');
                return false;
            }
        } catch (error) {
            console.log('❌ Backend connection failed:', error.message);
            setBackendStatus('offline');
            return false;
        }
    }, []);

    // ✅ FIXED: handleSave with proper error handling and data cleaning
    const handleSave = useCallback(async (section = 'all') => {
        try {
            console.log(`💾 Saving ${section}...`);
            
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login again');
                navigate('/login');
                return;
            }

            // Check backend connection first
            const isBackendOnline = await testBackendConnection();
            if (!isBackendOnline) {
                alert('Cannot connect to server. Please check your internet connection and try again.');
                return;
            }

            // For new patients, validate required fields
            if (isNewPatient) {
                if (!formData.full_name || formData.full_name.trim() === '') {
                    alert('Please enter patient name');
                    return;
                }
            }

            let savePatientCode = getCurrentPatientCode();
            
            // For NEW patients, generate code
            if (isNewPatient && (!savePatientCode || savePatientCode.trim() === '')) {
                savePatientCode = generatePatientCode();
                setCurrentPatientCode(savePatientCode);
                console.log('Generated patient code:', savePatientCode);
            }
            
            // For EXISTING patients, ensure we have the code
            if (!isNewPatient && (!savePatientCode || savePatientCode.trim() === '')) {
                console.error('Patient code missing');
                alert('Patient code missing. Please reload.');
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
                if (!value || value.trim() === '') return null;
                return value.trim();
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
                    allergies: Array.isArray(formData.allergies) ? formData.allergies.filter(a => a && a.trim() !== '') : [],
                    patient_type: patientType,
                    is_pregnant: formData.is_pregnant || false,
                    pregnancy_weeks: cleanNumber(formData.pregnancy_weeks),
                    pregnancy_trimester: cleanText(formData.pregnancy_trimester),
                    edd: cleanDate(formData.edd),
                    pregnancy_notes: cleanText(formData.pregnancy_notes),
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
                    bmi: cleanNumber(formData.bmi),
                    last_measured: cleanDate(formData.last_measured),
                    weight_percentile: cleanNumber(formData.weight_percentile),
                    height_percentile: cleanNumber(formData.height_percentile),
                    head_circumference_percentile: cleanNumber(formData.head_circumference_percentile),
                    bmi_percentile: cleanNumber(formData.bmi_percentile),
                    developmental_milestones: cleanText(formData.developmental_milestones),
                    feeding_method: cleanText(formData.feeding_method),
                    birth_weight: cleanNumber(formData.birth_weight),
                    birth_length: cleanNumber(formData.birth_length),
                    vaccination_status: cleanText(formData.vaccination_status),
                    special_instructions: cleanText(formData.special_instructions),
                },
                
                labs: {
                    // CBC
                    hemoglobin: cleanNumber(formData.hemoglobin),
                    hematocrit: cleanNumber(formData.hematocrit),
                    wbc_count: cleanNumber(formData.wbc_count),
                    rbc_count: cleanNumber(formData.rbc_count),
                    platelet_count: cleanNumber(formData.platelet_count),
                    mcv: cleanNumber(formData.mcv),
                    mch: cleanNumber(formData.mch),
                    mchc: cleanNumber(formData.mchc),
                    rdw: cleanNumber(formData.rdw),
                    neutrophils: cleanNumber(formData.neutrophils),
                    lymphocytes: cleanNumber(formData.lymphocytes),
                    monocytes: cleanNumber(formData.monocytes),
                    eosinophils: cleanNumber(formData.eosinophils),
                    basophils: cleanNumber(formData.basophils),
                    
                    // Chemistry
                    blood_sugar: cleanNumber(formData.blood_sugar),
                    creatinine: cleanNumber(formData.creatinine),
                    urea: cleanNumber(formData.urea),
                    uric_acid: cleanNumber(formData.uric_acid),
                    sodium: cleanNumber(formData.sodium),
                    potassium: cleanNumber(formData.potassium),
                    chloride: cleanNumber(formData.chloride),
                    bicarbonate: cleanNumber(formData.bicarbonate),
                    calcium: cleanNumber(formData.calcium),
                    magnesium: cleanNumber(formData.magnesium),
                    phosphate: cleanNumber(formData.phosphate),
                    
                    // Liver Function
                    alt: cleanNumber(formData.alt),
                    ast: cleanNumber(formData.ast),
                    alp: cleanNumber(formData.alp),
                    ggt: cleanNumber(formData.ggt),
                    bilirubin_total: cleanNumber(formData.bilirubin_total),
                    bilirubin_direct: cleanNumber(formData.bilirubin_direct),
                    bilirubin_indirect: cleanNumber(formData.bilirubin_indirect),
                    albumin: cleanNumber(formData.albumin),
                    total_protein: cleanNumber(formData.total_protein),
                    
                    // Cardiac
                    troponin: cleanNumber(formData.troponin),
                    ck_mb: cleanNumber(formData.ck_mb),
                    ldh: cleanNumber(formData.ldh),
                    myoglobin: cleanNumber(formData.myoglobin),
                    
                    // Thyroid
                    tsh: cleanNumber(formData.tsh),
                    free_t4: cleanNumber(formData.free_t4),
                    free_t3: cleanNumber(formData.free_t3),
                    total_t4: cleanNumber(formData.total_t4),
                    total_t3: cleanNumber(formData.total_t3),
                    
                    // Inflammatory
                    crp: cleanNumber(formData.crp),
                    esr: cleanNumber(formData.esr),
                    ferritin: cleanNumber(formData.ferritin),
                    procalcitonin: cleanNumber(formData.procalcitonin),
                    
                    // Coagulation
                    inr: cleanNumber(formData.inr),
                    pt: cleanNumber(formData.pt),
                    ptt: cleanNumber(formData.ptt),
                    fibrinogen: cleanNumber(formData.fibrinogen),
                    d_dimer: cleanNumber(formData.d_dimer),
                    
                    // Urinalysis
                    urine_protein: cleanText(formData.urine_protein),
                    urine_glucose: cleanText(formData.urine_glucose),
                    urine_blood: cleanText(formData.urine_blood),
                    urine_leukocytes: cleanText(formData.urine_leukocytes),
                    urine_nitrite: cleanText(formData.urine_nitrite),
                    urine_specific_gravity: cleanNumber(formData.urine_specific_gravity),
                    urine_ph: cleanNumber(formData.urine_ph),
                    urine_ketones: cleanText(formData.urine_ketones),
                    urine_bilirubin: cleanText(formData.urine_bilirubin),
                    urine_urobilinogen: cleanNumber(formData.urine_urobilinogen),
                    
                    // Diabetes
                    hba1c: cleanNumber(formData.hba1c),
                    fasting_glucose: cleanNumber(formData.fasting_glucose),
                    postprandial_glucose: cleanNumber(formData.postprandial_glucose),
                    random_glucose: cleanNumber(formData.random_glucose),
                    insulin: cleanNumber(formData.insulin),
                    c_peptide: cleanNumber(formData.c_peptide),
                    
                    // Lipid Profile
                    total_cholesterol: cleanNumber(formData.total_cholesterol),
                    hdl_cholesterol: cleanNumber(formData.hdl_cholesterol),
                    ldl_cholesterol: cleanNumber(formData.ldl_cholesterol),
                    triglycerides: cleanNumber(formData.triglycerides),
                    vldl_cholesterol: cleanNumber(formData.vldl_cholesterol),
                    
                    // Renal
                    egfr: cleanNumber(formData.egfr),
                    bun: cleanNumber(formData.bun),
                    
                    // Pediatric labs
                    bilirubin_neonatal: cleanNumber(formData.bilirubin_neonatal),
                    glucose_neonatal: cleanNumber(formData.glucose_neonatal),
                    calcium_neonatal: cleanNumber(formData.calcium_neonatal),
                    pku_result: cleanText(formData.pku_result),
                    thyroid_screening: cleanText(formData.thyroid_screening),
                    
                    last_tested: cleanDate(formData.last_tested)
                }
            };

            // Combine based on section
            let patientData = {};
            
            if (section === 'all' || isNewPatient) {
                patientData = { ...sectionData.basic, ...sectionData.vitals, ...sectionData.labs };
                console.log('📦 Saving ALL data');
            } else if (section === 'vitals') {
                patientData = { ...sectionData.basic, ...sectionData.vitals };
                console.log('📊 Saving VITALS data');
            } else if (section === 'labs') {
                patientData = { ...sectionData.basic, ...sectionData.labs };
                console.log('🧪 Saving LABS data');
            } else if (section === 'basic') {
                patientData = sectionData.basic;
                console.log('👤 Saving BASIC data');
            }

            // Clean data
            const cleanedPatientData = {};
            Object.keys(patientData).forEach(key => {
                if (patientData[key] !== null && patientData[key] !== undefined) {
                    cleanedPatientData[key] = patientData[key];
                }
            });

            console.log(`Saving ${Object.keys(cleanedPatientData).length} fields`);

            // API call
            let endpoint, method;
            
            if (isNewPatient) {
                endpoint = `${API_BASE_URL}/patients`;
                method = 'POST';
            } else {
                endpoint = `${API_BASE_URL}/patients/code/${savePatientCode}`;
                method = 'PUT';
                delete cleanedPatientData.patient_code;
            }

            console.log(`${method} ${endpoint}`);

            const response = await fetchWithRetry(endpoint, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanedPatientData)
            });

            console.log(`Status: ${response.status}`);
            
            // Get response text first
            const responseText = await response.text();
            let responseData;
            
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Invalid JSON:', responseText.substring(0, 200));
                throw new Error('Invalid server response');
            }
            
            if (!response.ok) {
                console.error('Error:', responseData);
                
                // Handle duplicate patient code
                if (responseData.error && responseData.error.includes('patient code already exists')) {
                    if (isNewPatient) {
                        console.log('Switching to update mode...');
                        setIsNewPatient(false);
                        delete cleanedPatientData.patient_code;
                        
                        const updateResponse = await fetchWithRetry(`${API_BASE_URL}/patients/code/${savePatientCode}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(cleanedPatientData)
                        });
                        
                        const updateData = await updateResponse.json();
                        if (!updateResponse.ok) {
                            throw new Error(updateData.error || 'Update failed');
                        }
                        
                        responseData = updateData;
                    } else {
                        throw new Error(responseData.error);
                    }
                } else {
                    throw new Error(responseData.error || `Failed to save (${response.status})`);
                }
            }

            if (!responseData.success) {
                throw new Error(responseData.error || 'Save failed');
            }

            const result = responseData.patient;
            console.log('✅ Saved:', result.patient_code);

            // CRITICAL FIX: Update form state to show in inputs immediately
            if (result) {
                // Create a completely NEW object to force React update
                const updatedFormData = { ...formData };
                
                // Update ALL fields from the saved result
                Object.keys(result).forEach(key => {
                    if (result[key] !== undefined) {
                        updatedFormData[key] = result[key];
                    }
                });
                
                // Ensure patient_code is set
                if (!updatedFormData.patient_code && savePatientCode) {
                    updatedFormData.patient_code = savePatientCode;
                }
                
                console.log('📝 Setting form data with saved values:', {
                    blood_pressure: updatedFormData.blood_pressure,
                    heart_rate: updatedFormData.heart_rate,
                    hemoglobin: updatedFormData.hemoglobin,
                    creatinine: updatedFormData.creatinine
                });
                
                // FORCE React to update by creating a deep copy
                setFormData(JSON.parse(JSON.stringify(updatedFormData)));
                
                if (setPatient) setPatient(result);
                setCurrentPatientCode(result.patient_code);
                
                if (isNewPatient) {
                    setIsNewPatient(false);
                }
            }

            // Exit edit mode for full saves
            if (section === 'all' || isNewPatient) {
                setIsEditing(false);
            }
            
            // Success message
            const messages = {
                'all': isNewPatient ? 'Patient created successfully!' : 'Patient updated successfully!',
                'vitals': 'Vitals saved successfully!',
                'labs': 'Lab results saved successfully!',
                'basic': 'Patient information saved successfully!'
            };
            
            alert(messages[section] || 'Saved successfully!');
            
            // Redirect for new patients
            if (patientCode === 'new' && isNewPatient) {
                navigate(`/patients/${result.patient_code}`);
            }
            
            // CRITICAL: Force immediate UI refresh
            // This makes saved values appear in inputs
            setTimeout(() => {
                // Create a new object to trigger React re-render
                setFormData(prev => ({ ...prev }));
            }, 100);
            
        } catch (error) {
            console.error('❌ Save error:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                errorMessage = 'Session expired. Please login again.';
                navigate('/login');
            }
            
            alert('Error saving patient: ' + errorMessage);
        }
    }, [isNewPatient, formData, getCurrentPatientCode, generatePatientCode, navigate, patientCode, isValidDate, calculateAgeInDays, calculateAge, determinePatientType, testBackendConnection, fetchWithRetry]);

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
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login again');
                navigate('/login');
                return;
            }
            
            const url = `${API_BASE_URL}/patients/code/${deletePatientCode}`;
            console.log('Delete URL:', url);
            
            const response = await fetchWithRetry(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert('Patient deleted successfully!');
                navigate('/patients');
            } else {
                throw new Error(result.error || 'Failed to delete patient');
            }
        } catch (error) {
            debugLog('Error deleting patient:', error);
            alert('Error deleting patient: ' + error.message);
        }
    }, [getCurrentPatientCode, navigate, debugLog, fetchWithRetry]);

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

                    {/* BMI */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            BMI {formData.bmi_percentile && (
                                <span className="text-xs text-blue-600 ml-1">
                                    ({formData.bmi_percentile} percentile)
                                </span>
                            )}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.bmi || ''}
                                readOnly
                                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
                                placeholder="Calculated automatically"
                            />
                        ) : (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-800">
                                        {formData.bmi || '--'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">kg/m²</span>
                                        {formData.bmi_percentile && (
                                            <span className="text-sm text-blue-600 font-medium">
                                                {formData.bmi_percentile}
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
            </div>
        );
    }, [formData, isEditing, handleSaveVitals, formatAgeDisplay, getPediatricNormalRange, handleVitalsInputChange, handleInputChange]);

    const renderLabsSection = useCallback(() => {
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FaFlask className="text-blue-600 text-xl" />
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

                {isPediatric && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowPediatricLabs(!showPediatricLabs)}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <FaBaby />
                            {showPediatricLabs ? 'Hide Pediatric Labs' : 'Show Pediatric Labs'}
                        </button>
                    </div>
                )}

                {showPediatricLabs && isPediatric && (
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-6 border border-pink-200">
                        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                            <FaBaby /> Pediatric/Neonatal Labs
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <LabInputField 
                                label="Bilirubin (Neonatal)"
                                value={formData.bilirubin_neonatal}
                                field="bilirubin_neonatal"
                                unit="mg/dL"
                                placeholder="5.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<5.0"
                            />
                            <LabInputField 
                                label="Glucose (Neonatal)"
                                value={formData.glucose_neonatal}
                                field="glucose_neonatal"
                                unit="mg/dL"
                                placeholder="70"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="40-100"
                            />
                            <LabInputField 
                                label="Calcium (Neonatal)"
                                value={formData.calcium_neonatal}
                                field="calcium_neonatal"
                                unit="mg/dL"
                                placeholder="10.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="8.8-10.8"
                            />
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    PKU Screening
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.pku_result || ''}
                                        onChange={(e) => handleLabInputChange('pku_result', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select result</option>
                                        <option value="Negative">Negative</option>
                                        <option value="Positive">Positive</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Not Tested">Not Tested</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        {formData.pku_result || <span className="text-gray-500 italic">Not tested</span>}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Thyroid Screening
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.thyroid_screening || ''}
                                        onChange={(e) => handleLabInputChange('thyroid_screening', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select result</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Abnormal">Abnormal</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Not Tested">Not Tested</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        {formData.thyroid_screening || <span className="text-gray-500 italic">Not tested</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Section 1: Complete Blood Count */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                            <FaVial /> Complete Blood Count (CBC)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="Hemoglobin"
                                value={formData.hemoglobin}
                                field="hemoglobin"
                                unit="g/dL"
                                placeholder="14.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="13.5-17.5"
                            />
                            <LabInputField 
                                label="Hematocrit"
                                value={formData.hematocrit}
                                field="hematocrit"
                                unit="%"
                                placeholder="42"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="40-50"
                            />
                            <LabInputField 
                                label="WBC Count"
                                value={formData.wbc_count}
                                field="wbc_count"
                                unit="×10³/μL"
                                placeholder="7.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="4.5-11.0"
                            />
                            <LabInputField 
                                label="RBC Count"
                                value={formData.rbc_count}
                                field="rbc_count"
                                unit="×10⁶/μL"
                                placeholder="5.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="4.5-5.9"
                            />
                            <LabInputField 
                                label="Platelet Count"
                                value={formData.platelet_count}
                                field="platelet_count"
                                unit="×10³/μL"
                                placeholder="250"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="150-450"
                            />
                            <LabInputField 
                                label="MCV"
                                value={formData.mcv}
                                field="mcv"
                                unit="fL"
                                placeholder="90"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="80-100"
                            />
                            <LabInputField 
                                label="MCH"
                                value={formData.mch}
                                field="mch"
                                unit="pg"
                                placeholder="30"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="27-33"
                            />
                            <LabInputField 
                                label="MCHC"
                                value={formData.mchc}
                                field="mchc"
                                unit="g/dL"
                                placeholder="34"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="32-36"
                            />
                            <LabInputField 
                                label="RDW"
                                value={formData.rdw}
                                field="rdw"
                                unit="%"
                                placeholder="13"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="11.5-14.5"
                            />
                        </div>
                    </div>

                    {/* Section 2: Differential Count */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Differential Count</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="Neutrophils"
                                value={formData.neutrophils}
                                field="neutrophils"
                                unit="%"
                                placeholder="60"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="40-75"
                            />
                            <LabInputField 
                                label="Lymphocytes"
                                value={formData.lymphocytes}
                                field="lymphocytes"
                                unit="%"
                                placeholder="30"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="20-50"
                            />
                            <LabInputField 
                                label="Monocytes"
                                value={formData.monocytes}
                                field="monocytes"
                                unit="%"
                                placeholder="6"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="2-10"
                            />
                            <LabInputField 
                                label="Eosinophils"
                                value={formData.eosinophils}
                                field="eosinophils"
                                unit="%"
                                placeholder="3"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0-6"
                            />
                            <LabInputField 
                                label="Basophils"
                                value={formData.basophils}
                                field="basophils"
                                unit="%"
                                placeholder="1"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0-2"
                            />
                        </div>
                    </div>

                    {/* Section 3: Basic Chemistry */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Basic Chemistry</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="Blood Sugar (FBS)"
                                value={formData.blood_sugar}
                                field="blood_sugar"
                                unit="mg/dL"
                                placeholder="95"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="70-100"
                            />
                            <LabInputField 
                                label="Creatinine"
                                value={formData.creatinine}
                                field="creatinine"
                                unit="mg/dL"
                                placeholder="0.9"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0.6-1.2"
                            />
                            <LabInputField 
                                label="Urea"
                                value={formData.urea}
                                field="urea"
                                unit="mg/dL"
                                placeholder="25"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="7-20"
                            />
                            <LabInputField 
                                label="Uric Acid"
                                value={formData.uric_acid}
                                field="uric_acid"
                                unit="mg/dL"
                                placeholder="5.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="3.5-7.2"
                            />
                        </div>
                    </div>

                    {/* Section 4: Electrolytes */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Electrolytes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="Sodium (Na)"
                                value={formData.sodium}
                                field="sodium"
                                unit="mmol/L"
                                placeholder="140"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="135-145"
                            />
                            <LabInputField 
                                label="Potassium (K)"
                                value={formData.potassium}
                                field="potassium"
                                unit="mmol/L"
                                placeholder="4.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="3.5-5.0"
                            />
                            <LabInputField 
                                label="Chloride (Cl)"
                                value={formData.chloride}
                                field="chloride"
                                unit="mmol/L"
                                placeholder="100"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="98-106"
                            />
                            <LabInputField 
                                label="Bicarbonate (HCO₃)"
                                value={formData.bicarbonate}
                                field="bicarbonate"
                                unit="mmol/L"
                                placeholder="24"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="22-28"
                            />
                        </div>
                    </div>

                    {/* Section 5: Calcium & Phosphorus */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Calcium & Phosphorus</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <LabInputField 
                                label="Calcium"
                                value={formData.calcium}
                                field="calcium"
                                unit="mg/dL"
                                placeholder="9.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="8.8-10.8"
                            />
                            <LabInputField 
                                label="Magnesium"
                                value={formData.magnesium}
                                field="magnesium"
                                unit="mg/dL"
                                placeholder="2.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="1.7-2.2"
                            />
                            <LabInputField 
                                label="Phosphate"
                                value={formData.phosphate}
                                field="phosphate"
                                unit="mg/dL"
                                placeholder="3.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="2.5-4.5"
                            />
                        </div>
                    </div>

                    {/* Section 6: Liver Function */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Liver Function Tests</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="ALT"
                                value={formData.alt}
                                field="alt"
                                unit="U/L"
                                placeholder="35"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="7-56"
                            />
                            <LabInputField 
                                label="AST"
                                value={formData.ast}
                                field="ast"
                                unit="U/L"
                                placeholder="30"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="10-40"
                            />
                            <LabInputField 
                                label="ALP"
                                value={formData.alp}
                                field="alp"
                                unit="U/L"
                                placeholder="100"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="44-147"
                            />
                            <LabInputField 
                                label="GGT"
                                value={formData.ggt}
                                field="ggt"
                                unit="U/L"
                                placeholder="30"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="9-48"
                            />
                            <LabInputField 
                                label="Total Bilirubin"
                                value={formData.bilirubin_total}
                                field="bilirubin_total"
                                unit="mg/dL"
                                placeholder="0.8"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0.1-1.2"
                            />
                            <LabInputField 
                                label="Direct Bilirubin"
                                value={formData.bilirubin_direct}
                                field="bilirubin_direct"
                                unit="mg/dL"
                                placeholder="0.2"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0-0.3"
                            />
                            <LabInputField 
                                label="Indirect Bilirubin"
                                value={formData.bilirubin_indirect}
                                field="bilirubin_indirect"
                                unit="mg/dL"
                                placeholder="0.6"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0.1-0.9"
                            />
                            <LabInputField 
                                label="Albumin"
                                value={formData.albumin}
                                field="albumin"
                                unit="g/dL"
                                placeholder="4.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="3.5-5.0"
                            />
                            <LabInputField 
                                label="Total Protein"
                                value={formData.total_protein}
                                field="total_protein"
                                unit="g/dL"
                                placeholder="7.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="6.0-8.3"
                            />
                        </div>
                    </div>

                    {/* Section 7: Renal Function */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Renal Function</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <LabInputField 
                                label="BUN"
                                value={formData.bun}
                                field="bun"
                                unit="mg/dL"
                                placeholder="15"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="7-20"
                            />
                            <LabInputField 
                                label="eGFR"
                                value={formData.egfr}
                                field="egfr"
                                unit="mL/min"
                                placeholder="90"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange=">60"
                                readOnly={true}
                            />
                        </div>
                    </div>

                    {/* Section 8: Cardiac Markers */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Cardiac Markers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <LabInputField 
                                label="Troponin"
                                value={formData.troponin}
                                field="troponin"
                                unit="ng/mL"
                                placeholder="0.01"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<0.04"
                            />
                            <LabInputField 
                                label="CK-MB"
                                value={formData.ck_mb}
                                field="ck_mb"
                                unit="ng/mL"
                                placeholder="5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<5"
                            />
                            <LabInputField 
                                label="LDH"
                                value={formData.ldh}
                                field="ldh"
                                unit="U/L"
                                placeholder="150"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="140-280"
                            />
                            <LabInputField 
                                label="Myoglobin"
                                value={formData.myoglobin}
                                field="myoglobin"
                                unit="ng/mL"
                                placeholder="50"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<90"
                            />
                        </div>
                    </div>

                    {/* Section 9: Thyroid Function */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Thyroid Function</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <LabInputField 
                                label="TSH"
                                value={formData.tsh}
                                field="tsh"
                                unit="μIU/mL"
                                placeholder="2.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0.4-4.0"
                            />
                            <LabInputField 
                                label="Free T4"
                                value={formData.free_t4}
                                field="free_t4"
                                unit="ng/dL"
                                placeholder="1.2"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0.8-1.8"
                            />
                            <LabInputField 
                                label="Free T3"
                                value={formData.free_t3}
                                field="free_t3"
                                unit="pg/mL"
                                placeholder="3.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="2.3-4.2"
                            />
                            <LabInputField 
                                label="Total T4"
                                value={formData.total_t4}
                                field="total_t4"
                                unit="μg/dL"
                                placeholder="7.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="5.0-12.0"
                            />
                            <LabInputField 
                                label="Total T3"
                                value={formData.total_t3}
                                field="total_t3"
                                unit="ng/dL"
                                placeholder="120"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="80-200"
                            />
                        </div>
                    </div>

                    {/* Section 10: Inflammatory Markers */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Inflammatory Markers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="CRP"
                                value={formData.crp}
                                field="crp"
                                unit="mg/L"
                                placeholder="3"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<10"
                            />
                            <LabInputField 
                                label="ESR"
                                value={formData.esr}
                                field="esr"
                                unit="mm/hr"
                                placeholder="15"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0-20"
                            />
                            <LabInputField 
                                label="Ferritin"
                                value={formData.ferritin}
                                field="ferritin"
                                unit="ng/mL"
                                placeholder="100"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="20-300"
                            />
                            <LabInputField 
                                label="Procalcitonin"
                                value={formData.procalcitonin}
                                field="procalcitonin"
                                unit="ng/mL"
                                placeholder="0.05"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<0.1"
                            />
                        </div>
                    </div>

                    {/* Section 11: Coagulation Profile */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Coagulation Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="INR"
                                value={formData.inr}
                                field="inr"
                                unit=""
                                placeholder="1.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0.8-1.2"
                            />
                            <LabInputField 
                                label="PT"
                                value={formData.pt}
                                field="pt"
                                unit="sec"
                                placeholder="12"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="11-13.5"
                            />
                            <LabInputField 
                                label="PTT"
                                value={formData.ptt}
                                field="ptt"
                                unit="sec"
                                placeholder="30"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="25-35"
                            />
                            <LabInputField 
                                label="Fibrinogen"
                                value={formData.fibrinogen}
                                field="fibrinogen"
                                unit="mg/dL"
                                placeholder="300"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="200-400"
                            />
                            <LabInputField 
                                label="D-Dimer"
                                value={formData.d_dimer}
                                field="d_dimer"
                                unit="μg/mL"
                                placeholder="0.3"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<0.5"
                            />
                        </div>
                    </div>

                    {/* Section 12: Urinalysis */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Urinalysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Protein
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.urine_protein || ''}
                                        onChange={(e) => handleLabInputChange('urine_protein', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select</option>
                                        <option value="Negative">Negative</option>
                                        <option value="Trace">Trace</option>
                                        <option value="1+">1+</option>
                                        <option value="2+">2+</option>
                                        <option value="3+">3+</option>
                                        <option value="4+">4+</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        {formData.urine_protein || '--'}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Glucose
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.urine_glucose || ''}
                                        onChange={(e) => handleLabInputChange('urine_glucose', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select</option>
                                        <option value="Negative">Negative</option>
                                        <option value="Trace">Trace</option>
                                        <option value="1+">1+</option>
                                        <option value="2+">2+</option>
                                        <option value="3+">3+</option>
                                        <option value="4+">4+</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        {formData.urine_glucose || '--'}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Blood
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.urine_blood || ''}
                                        onChange={(e) => handleLabInputChange('urine_blood', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select</option>
                                        <option value="Negative">Negative</option>
                                        <option value="Trace">Trace</option>
                                        <option value="1+">1+</option>
                                        <option value="2+">2+</option>
                                        <option value="3+">3+</option>
                                        <option value="4+">4+</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        {formData.urine_blood || '--'}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Leukocytes
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.urine_leukocytes || ''}
                                        onChange={(e) => handleLabInputChange('urine_leukocytes', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select</option>
                                        <option value="Negative">Negative</option>
                                        <option value="Trace">Trace</option>
                                        <option value="1+">1+</option>
                                        <option value="2+">2+</option>
                                        <option value="3+">3+</option>
                                        <option value="4+">4+</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        {formData.urine_leukocytes || '--'}
                                    </div>
                                )}
                            </div>
                            <LabInputField 
                                label="Specific Gravity"
                                value={formData.urine_specific_gravity}
                                field="urine_specific_gravity"
                                unit=""
                                placeholder="1.015"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="1.005-1.030"
                            />
                            <LabInputField 
                                label="pH"
                                value={formData.urine_ph}
                                field="urine_ph"
                                unit=""
                                placeholder="6.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="4.5-8.0"
                            />
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Ketones
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.urine_ketones || ''}
                                        onChange={(e) => handleLabInputChange('urine_ketones', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select</option>
                                        <option value="Negative">Negative</option>
                                        <option value="Trace">Trace</option>
                                        <option value="Small">Small</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Large">Large</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        {formData.urine_ketones || '--'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 13: Diabetes Markers */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Diabetes Markers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="HbA1c"
                                value={formData.hba1c}
                                field="hba1c"
                                unit="%"
                                placeholder="5.5"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<5.7"
                            />
                            <LabInputField 
                                label="Fasting Glucose"
                                value={formData.fasting_glucose}
                                field="fasting_glucose"
                                unit="mg/dL"
                                placeholder="95"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="70-100"
                            />
                            <LabInputField 
                                label="Postprandial Glucose"
                                value={formData.postprandial_glucose}
                                field="postprandial_glucose"
                                unit="mg/dL"
                                placeholder="140"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<140"
                            />
                            <LabInputField 
                                label="Random Glucose"
                                value={formData.random_glucose}
                                field="random_glucose"
                                unit="mg/dL"
                                placeholder="110"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<200"
                            />
                            <LabInputField 
                                label="Insulin"
                                value={formData.insulin}
                                field="insulin"
                                unit="μIU/mL"
                                placeholder="10"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="2-25"
                            />
                            <LabInputField 
                                label="C-Peptide"
                                value={formData.c_peptide}
                                field="c_peptide"
                                unit="ng/mL"
                                placeholder="2.0"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="0.9-7.1"
                            />
                        </div>
                    </div>

                    {/* Section 14: Lipid Profile */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-4">Lipid Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <LabInputField 
                                label="Total Cholesterol"
                                value={formData.total_cholesterol}
                                field="total_cholesterol"
                                unit="mg/dL"
                                placeholder="180"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<200"
                            />
                            <LabInputField 
                                label="HDL Cholesterol"
                                value={formData.hdl_cholesterol}
                                field="hdl_cholesterol"
                                unit="mg/dL"
                                placeholder="55"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange=">40"
                            />
                            <LabInputField 
                                label="LDL Cholesterol"
                                value={formData.ldl_cholesterol}
                                field="ldl_cholesterol"
                                unit="mg/dL"
                                placeholder="100"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<100"
                            />
                            <LabInputField 
                                label="Triglycerides"
                                value={formData.triglycerides}
                                field="triglycerides"
                                unit="mg/dL"
                                placeholder="120"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="<150"
                            />
                            <LabInputField 
                                label="VLDL Cholesterol"
                                value={formData.vldl_cholesterol}
                                field="vldl_cholesterol"
                                unit="mg/dL"
                                placeholder="25"
                                isEditing={isEditing}
                                handleChange={handleLabInputChange}
                                normalRange="5-40"
                            />
                        </div>
                    </div>

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
            </div>
        );
    }, [formData, isEditing, showPediatricLabs, handleSaveLabs, handleLabInputChange, handleInputChange]);

    const renderDemographicsSection = useCallback(() => {
        const ageDisplay = formatAgeDisplay(formData.age_in_days, formData.date_of_birth);
        const isPediatric = formData.patient_type && formData.patient_type !== 'adult';
        
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-3 rounded-full">
                        <FaUser className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Patient Demographics</h2>
                        <p className="text-gray-600">Basic patient information</p>
                    </div>
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
                                {formData.allergies.length > 0 && (
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
                                {formData.allergies.length > 0 ? (
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

                    {/* Pregnancy Section */}
                    {formData.gender === 'Female' && (
                        <div className="space-y-2 md:col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_pregnant}
                                    onChange={(e) => handleInputChange('is_pregnant', e.target.checked)}
                                    className="w-4 h-4 text-blue-600"
                                    disabled={!isEditing}
                                />
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <FaBaby className="text-pink-500" /> Pregnant
                                </span>
                            </label>
                            
                            {formData.is_pregnant && (
                                <div className="mt-3 p-4 bg-pink-50 rounded-lg border border-pink-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Pregnancy Weeks
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={formData.pregnancy_weeks || ''}
                                                    onChange={(e) => handleInputChange('pregnancy_weeks', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    placeholder="e.g., 24"
                                                    min="1"
                                                    max="42"
                                                />
                                            ) : (
                                                <div className="p-2 bg-white rounded border">
                                                    {formData.pregnancy_weeks || '--'} weeks
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Trimester
                                            </label>
                                            <div className="p-2 bg-white rounded border">
                                                {formData.pregnancy_trimester || '--'}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Estimated Due Date
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={formData.edd || ''}
                                                    onChange={(e) => handleInputChange('edd', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                />
                                            ) : (
                                                <div className="p-2 bg-white rounded border">
                                                    {formData.edd ? new Date(formData.edd).toLocaleDateString() : '--'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Pregnancy Notes
                                            </label>
                                            {isEditing ? (
                                                <textarea
                                                    value={formData.pregnancy_notes || ''}
                                                    onChange={(e) => handleInputChange('pregnancy_notes', e.target.value)}
                                                    rows="2"
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    placeholder="Any pregnancy-related notes"
                                                />
                                            ) : (
                                                <div className="p-2 bg-white rounded border min-h-[60px]">
                                                    {formData.pregnancy_notes || 'No notes'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg ${
                                isPediatric 
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
                                        {patient?.full_name || `Patient ${patientCodeToDisplay}`}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Patient Code:</span>
                                            <span className="font-semibold text-indigo-600">{patientCodeToDisplay}</span>
                                        </div>
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
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                        formData.is_active
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
                                <p className="text-sm text-gray-600">Vitals</p>
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
                                        const labs = ['hemoglobin', 'creatinine', 'sodium', 'potassium', 'inr', 'tsh'];
                                        return labs.filter(l => formData[l] && formData[l].toString().trim() !== '').length;
                                    })()}
                                </p>
                            </div>
                            <FaFlask className="text-green-400 text-xl" />
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
                {formData.allergies && formData.allergies.length > 0 && (
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
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Blood Pressure</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.blood_pressure}</p>
                                        <p className="text-xs text-gray-500">mmHg</p>
                                    </div>
                                )}
                                {formData.heart_rate && (
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Heart Rate</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.heart_rate}</p>
                                        <p className="text-xs text-gray-500">bpm</p>
                                    </div>
                                )}
                                {formData.temperature && (
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Temperature</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.temperature}</p>
                                        <p className="text-xs text-gray-500">°C</p>
                                    </div>
                                )}
                                {formData.oxygen_saturation && (
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm text-gray-600">SpO₂</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.oxygen_saturation}</p>
                                        <p className="text-xs text-gray-500">%</p>
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

                {/* Recent Labs */}
                {(() => {
                    const hasLabs = ['creatinine', 'potassium', 'sodium', 'hemoglobin'].some(l => formData[l] && formData[l].toString().trim() !== '');
                    if (!hasLabs) return null;
                    
                    return (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FaFlask className="text-green-500" /> Recent Labs
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.creatinine && (
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Creatinine</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.creatinine}</p>
                                        <p className="text-xs text-gray-500">mg/dL</p>
                                    </div>
                                )}
                                {formData.potassium && (
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Potassium</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.potassium}</p>
                                        <p className="text-xs text-gray-500">mmol/L</p>
                                    </div>
                                )}
                                {formData.sodium && (
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Sodium</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.sodium}</p>
                                        <p className="text-xs text-gray-500">mmol/L</p>
                                    </div>
                                )}
                                {formData.hemoglobin && (
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Hemoglobin</p>
                                        <p className="text-xl font-bold text-gray-800">{formData.hemoglobin}</p>
                                        <p className="text-xs text-gray-500">g/dL</p>
                                    </div>
                                )}
                            </div>
                            {formData.last_tested && (
                                <p className="text-xs text-gray-500 mt-4 text-right">
                                    Last tested: {new Date(formData.last_tested).toLocaleDateString()}
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
    }, [formData, patient, getCurrentPatientCode, formatAgeDisplay]);

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
    }, [activeTab, renderOverviewSection, renderDemographicsSection, renderVitalsSection, renderLabsSection, getCurrentPatientCode]);

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
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Connection Status Banner */}
            {(!isOnline || backendStatus === 'offline') && (
                <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <FaWifi className="mr-2" />
                            <p className="font-medium">
                                {!isOnline ? 'You are offline. ' : ''}
                                {backendStatus === 'offline' ? 'Cannot connect to server. ' : ''}
                                Some features may be unavailable.
                            </p>
                        </div>
                        {backendStatus === 'offline' && retryCount < 3 && (
                            <button
                                onClick={handleRetry}
                                className="ml-4 text-sm bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1"
                            >
                                <FaSync /> Retry
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FaExclamationTriangle className="mr-2" />
                                <p>{error}</p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="ml-4 text-sm bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                            >
                                <FaSync /> Retry
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/patients')}
                                className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg"
                                title="Back to Patients"
                            >
                                <FaArrowLeft className="text-xl" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {isNewPatient ? 'New Patient' : `Patient: ${getCurrentPatientCode()}`}
                                </h1>
                                {formData.full_name && (
                                    <p className="text-gray-600 mt-1">
                                        {formData.full_name} • {formatAgeDisplay(formData.age_in_days, formData.date_of_birth)} • {formData.gender || 'Gender not specified'}
                                        {formData.is_pregnant && ` • Pregnancy: ${formData.pregnancy_weeks} weeks`}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    console.log('Testing backend connection...');
                                    testBackendConnection();
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FaWifi /> Test Connection
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <FaPrint /> Print
                            </button>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                    isEditing 
                                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-800' 
                                        : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                }`}
                            >
                                <FaEdit /> {isEditing ? 'Cancel Edit' : 'Edit'}
                            </button>
                            {!isNewPatient && (
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <FaTrash /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                    <nav className="flex space-x-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-2 px-4 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon /> {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    {renderTabContent()}
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
            </div>
        </div>
    );
};

export default PatientDetails;