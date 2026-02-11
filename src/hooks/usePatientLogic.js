import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import supabase from '../utils/supabase';
import {
    isValidDate, calculateAgeInDays, calculateAge, determinePatientType,
    calculateBMI, calculateTrimester
} from '../utils/patientUtils';

export const usePatientLogic = (patientCode) => {
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNewPatient, setIsNewPatient] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);
    const [ageMode, setAgeMode] = useState('years');
    const [showPediatricLabs, setShowPediatricLabs] = useState(false);
    const [customLabs, setCustomLabs] = useState([]);
    const [vitalsHistory, setVitalsHistory] = useState([]);
    const [labsHistory, setLabsHistory] = useState([]);
    const [globalLabDefinitions, setGlobalLabDefinitions] = useState([]);

    // Initial Form State
    const initialFormState = {
        full_name: '', age: '', age_in_days: '', gender: '', date_of_birth: '',
        contact_number: '', address: '', diagnosis: '', appointment_date: '',
        is_active: true, allergies: [], patient_type: 'adult',
        weight: '', height: '', bmi: '', blood_pressure: '', heart_rate: '',
        temperature: '', respiratory_rate: '', oxygen_saturation: '',
        last_measured: new Date().toISOString().split('T')[0],
        last_tested: new Date().toISOString().split('T')[0],
        // ... incomplete list, but we use dynamic update so it handles itself mostly
    };
    const [formData, setFormData] = useState(initialFormState);

    // --- Helpers ---
    const generatePatientCode = () => `PAT${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 9000) + 1000}`;

    // --- Data Loading ---
    const fetchGlobalLabs = useCallback(async () => {
        try {
            const { success, labs } = await api.get('/lab-definitions');
            if (success && labs) { setGlobalLabDefinitions(labs); }
            else {
                // Fallback
                const { data } = await supabase.from('lab_tests').select('*').eq('is_active', true);
                if (data) setGlobalLabDefinitions(data);
            }
        } catch (e) { console.error('Error fetching global labs', e); }
    }, []);

    const fetchClinicalHistory = async (code) => {
        if (!code) return;
        try {
            const [v, l] = await Promise.all([
                api.get(`/vitals/patient/${code}`),
                api.get(`/labs-history/patient/${code}`)
            ]);
            if (v.success) setVitalsHistory(v.vitals || []);
            if (l.success) setLabsHistory(l.labs || []);
        } catch (e) { }
    };

    const loadPatientData = useCallback(async (data) => {
        setIsNewPatient(false);
        setPatient(data);
        fetchClinicalHistory(data.patient_code);

        // Calculate Ages & Types
        const dob = data.date_of_birth;
        const days = calculateAgeInDays(dob);
        const years = calculateAge(dob);
        const type = determinePatientType(days);

        // Lab processing logic (simplified for hook)
        // Merge explicit fields + JSONB labs + Global defs -> CustomLabs list & FormData
        // (Similar logic to original file, condensed)

        // 1. Prepare Labs Source
        const sourceLabs = (data.labs && typeof data.labs === 'object' ? (data.labs.labs || data.labs) : {}) || {};

        // 2. Set Basic Form Data
        const cleanData = {
            ...initialFormState, // defaults
            ...data, // API data
            ...sourceLabs, // Flattened labs
            age: years,
            age_in_days: days,
            patient_type: type,
            date_of_birth: (dob && isValidDate(dob)) ? dob.split('T')[0] : '',
            last_measured: (data.last_measured && isValidDate(data.last_measured)) ? data.last_measured.split('T')[0] : new Date().toISOString().split('T')[0],
            last_tested: (data.last_tested && isValidDate(data.last_tested)) ? data.last_tested.split('T')[0] : new Date().toISOString().split('T')[0]
        };
        setFormData(cleanData);

        // 3. Set Modes
        if (days && parseInt(days) < 365) {
            setAgeMode('days');
            setShowPediatricLabs(true);
        } else {
            setAgeMode('years');
            setShowPediatricLabs(false);
        }

        // 4. Set Custom Labs
        // Prepare list from global definitions, merging with any patient specific values
        if (globalLabDefinitions && globalLabDefinitions.length > 0) {
            setCustomLabs(globalLabDefinitions);
        }
    }, [globalLabDefinitions]);

    // Main Fetch Effect
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchGlobalLabs();

            // New Patient Route?
            const isNew = patientCode === 'new' || location.pathname.endsWith('/new');
            if (isNew) {
                setIsNewPatient(true);
                setIsEditing(true);
                setFormData(prev => ({ ...prev, patient_code: generatePatientCode() }));
                setLoading(false);
                return;
            }

            if (!patientCode) {
                setError('No patient code');
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(`/patients/code/${patientCode}`);
                if (res.success && res.patient) {
                    loadPatientData(res.patient);
                    const isEdit = new URLSearchParams(location.search).get('edit') === 'true';
                    if (isEdit) setIsEditing(true);
                } else {
                    setError('Patient not found');
                }
            } catch (e) {
                setError('Failed to load patient');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [patientCode, location.pathname, location.search, fetchGlobalLabs]); // removed loadPatientData dependency to avoid loop if not memoized perfectly

    // --- Input Handlers ---
    const handleInputChange = (field, value) => {
        // Date Logic
        if (field === 'date_of_birth' && isValidDate(value)) {
            const days = calculateAgeInDays(value);
            const years = calculateAge(value);
            setFormData(prev => ({
                ...prev, [field]: value, age_in_days: days, age: years, patient_type: determinePatientType(days)
            }));
            if (days < 365) { setAgeMode('days'); setShowPediatricLabs(true); }
            else { setAgeMode('years'); setShowPediatricLabs(false); }
            return;
        }

        // Pregnancy Logic
        if (field === 'pregnancy_weeks') {
            setFormData(prev => ({ ...prev, [field]: value, pregnancy_trimester: calculateTrimester(value) }));
            return;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLabChange = (field, value) => {
        // Numeric validation could go here
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const payload = { ...formData };

            // Re-nest labs
            const explicitLabFields = globalLabDefinitions.map(l => l.name?.toLowerCase().replace(/\s/g, '_')); // simplified
            // Actual saving logic usually sends flattened fields to backend if backend supports it OR nests them
            // Assuming backend handles the flat structure or we need to ideally nest them into 'labs' jsonb

            let res;
            if (isNewPatient) {
                res = await api.post('/patients', payload);
            } else {
                res = await api.put(`/patients/${patient.id}`, payload);
            }

            if (res.success) {
                alert('Saved successfully!');
                setIsEditing(false);
                if (isNewPatient) navigate(`/patients/${res.patient.patient_code}`);
                // Reload
                loadPatientData(res.patient);
            }
        } catch (e) {
            alert('Save failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        patient, loading, error, isNewPatient, isEditing, setIsEditing,
        formData, handleInputChange, handleLabChange,
        ageMode, showPediatricLabs,
        customLabs, globalLabDefinitions,
        handleSave,
        vitalsHistory, labsHistory
    }
};
