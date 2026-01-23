import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { 
  FaPills, FaCalendar, FaClock, FaEdit, FaTrash, FaSave, 
  FaFilter, FaSync, FaPrescription, FaUserMd, FaHospital,
  FaCalendarCheck, FaNotesMedical, FaCapsules, FaTint,
  FaExclamationTriangle, FaInfoCircle, FaCalculator,
  FaFilePrescription, FaStethoscope, FaFlask
} from 'react-icons/fa';

const MedicationHistory = ({ patientCode }) => {
    const [medications, setMedications] = useState([]);
    const [filteredMedications, setFilteredMedications] = useState([]);
    const [formData, setFormData] = useState({
        // Required Information
        drug_name: '',
        start_date: '',
        
        // Basic Information
        dose: '',
        roa: 'po',
        frequency: '',
        stop_date: '',
        indication: '',
        drug_class: 'Antimicrobial',
        initiated_at: 'Hospital',
        
        // Additional Information
        generic_name: '',
        brand_name: '',
        dosage_form: 'Tablet',
        strength: '',
        unit: 'mg',
        total_daily_dose: '',
        timing: '',
        duration_days: '',
        quantity: '',
        refills: '0',
        prescribed_date: '',
        diagnosis: '',
        therapeutic_category: '',
        atc_code: '',
        prescriber_name: '',
        prescriber_type: 'Doctor',
        pharmacy_name: '',
        
        // Status & Monitoring
        status: 'Active',
        prn: false,
        notes: '',
        
        // Internal
        id: '',
        is_active: true
    });
    
    const [selectedClass, setSelectedClass] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Dropdown Options
    const roaOptions = [
        { value: 'po', label: 'Oral (PO)', icon: '💊' },
        { value: 'SL', label: 'Sublingual (SL)', icon: '👅' },
        { value: 'IV', label: 'Intravenous (IV)', icon: '💉' },
        { value: 'IM', label: 'Intramuscular (IM)', icon: '💉' },
        { value: 'SubQ', label: 'Subcutaneous (SubQ)', icon: '💉' },
        { value: 'Topical', label: 'Topical', icon: '🧴' },
        { value: 'Inhalation', label: 'Inhalation', icon: '🌬️' },
        { value: 'Nasal', label: 'Nasal', icon: '👃' },
        { value: 'Ophthalmic', label: 'Ophthalmic', icon: '👁️' },
        { value: 'Otic', label: 'Otic', icon: '👂' },
        { value: 'Rectal', label: 'Rectal', icon: '💊' },
        { value: 'Vaginal', label: 'Vaginal', icon: '💊' },
        { value: 'Transdermal', label: 'Transdermal Patch', icon: '🩹' }
    ];

    const dosageForms = [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment',
        'Drops', 'Inhaler', 'Patch', 'Suppository', 'Suspension',
        'Powder', 'Solution', 'Gel', 'Lotion', 'Spray', 'Liniment'
    ];

    const frequencyOptions = [
        'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
        'Every morning', 'Every evening', 'Every night', 'At bedtime',
        'Weekly', 'Every other day', 'Every 4 hours', 'Every 6 hours',
        'Every 8 hours', 'Every 12 hours', 'Before meals', 'After meals',
        'With meals', 'On empty stomach', 'As needed (PRN)'
    ];

    const timingOptions = [
        'Morning (06:00-10:00)', 'Noon (10:00-14:00)', 'Evening (14:00-18:00)',
        'Night (18:00-22:00)', 'Before breakfast', 'After breakfast',
        'Before lunch', 'After lunch', 'Before dinner', 'After dinner',
        'At bedtime', 'On empty stomach', 'With food', 'As directed'
    ];

    const drugClasses = [
        'Analgesics', 'Antimicrobial', 'Antidiabetic', 'Cardiovascular',
        'Antihypertensive', 'Diuretic', 'Bronchodilator', 'Corticosteroid',
        'Antidepressant', 'Antipsychotic', 'Anticonvulsant', 'Antiplatelet',
        'Anticoagulant', 'Antacid', 'PPI', 'H2 Blocker', 'Laxative',
        'Antiemetic', 'Antihistamine', 'Immunosuppressant', 'Chemotherapy',
        'Hormonal', 'Vitamin/Supplement', 'Antifungal', 'Antiviral',
        'Antiparasitic', 'Muscle Relaxant', 'Ophthalmic', 'Dermatological',
        'Other'
    ];

    const statusOptions = [
        { value: 'Active', label: 'Active', color: 'green' },
        { value: 'Completed', label: 'Completed', color: 'blue' },
        { value: 'Discontinued', label: 'Discontinued', color: 'red' },
        { value: 'On Hold', label: 'On Hold', color: 'yellow' },
        { value: 'Planned', label: 'Planned', color: 'purple' }
    ];

    const prescriberTypes = [
        'Doctor', 'Nurse', 'Pharmacist', 'Dentist', 'Midwife',
        'Clinical Officer', 'Specialist', 'Other'
    ];

    const initiatedAtOptions = [
        'Hospital', 'Health Center', 'Clinic', 'Private Clinic',
        'Pharmacy', 'Home', 'Community', 'Referral', 'Telemedicine'
    ];

    const units = [
        'mg', 'g', 'mcg', 'ml', 'L', 'tablet', 'capsule', 'dose',
        'puff', 'drop', 'patch', 'suppository', 'IU', '%', 'unit'
    ];

    useEffect(() => {
        if (patientCode) {
            fetchMedications();
        }
    }, [patientCode]);

    const fetchMedications = async () => {
        try {
            console.log('Fetching medications for patient:', patientCode);
            
            const { data, error } = await supabase
                .from('medication_history')
                .select('*')
                .eq('patient_code', patientCode)
                .order('start_date', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log(`Fetched ${data?.length || 0} medications`);
            setMedications(data || []);
            applyFilters(data || []);
        } catch (error) {
            console.error('Error fetching medications:', error);
            alert('Error loading medications. Please check console for details.');
        }
    };

    const calculateDuration = () => {
        if (!formData.start_date) return '';
        
        const start = new Date(formData.start_date);
        const stop = formData.stop_date ? new Date(formData.stop_date) : new Date();
        
        if (isNaN(start.getTime())) return '';
        
        let years = stop.getFullYear() - start.getFullYear();
        let months = stop.getMonth() - start.getMonth();
        let days = stop.getDate() - start.getDate();
        
        // Adjust for negative days
        if (days < 0) {
            months--;
            const prevMonth = new Date(stop.getFullYear(), stop.getMonth(), 0);
            days += prevMonth.getDate();
        }
        
        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }
        
        const parts = [];
        if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
        if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
        if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
        
        return parts.join(', ');
    };

    const calculateDailyDose = () => {
        if (!formData.dose || !formData.frequency || !formData.unit) return '';
        
        const doseValue = parseFloat(formData.dose);
        if (isNaN(doseValue)) return '';
        
        let multiplier = 1;
        const freq = formData.frequency.toLowerCase();
        
        if (freq.includes('twice') || freq.includes('bid')) multiplier = 2;
        else if (freq.includes('three') || freq.includes('tid') || freq.includes('8 hourly')) multiplier = 3;
        else if (freq.includes('four') || freq.includes('qid') || freq.includes('6 hourly')) multiplier = 4;
        else if (freq.includes('every 4 hours')) multiplier = 6;
        else if (freq.includes('every 6 hours')) multiplier = 4;
        else if (freq.includes('every 8 hours')) multiplier = 3;
        else if (freq.includes('every 12 hours')) multiplier = 2;
        
        const dailyDose = doseValue * multiplier;
        return `${dailyDose} ${formData.unit}`;
    };

    const validateForm = () => {
        if (!formData.drug_name.trim()) {
            alert('Drug Name is required');
            return false;
        }
        
        if (!formData.start_date) {
            alert('Start Date is required');
            return false;
        }
        
        if (formData.start_date && formData.stop_date) {
            const start = new Date(formData.start_date);
            const stop = new Date(formData.stop_date);
            if (stop < start) {
                alert('Stop date cannot be before start date');
                return false;
            }
        }
        
        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        setLoading(true);
        const duration = calculateDuration();
        const isActive = formData.status === 'Active';
        const totalDailyDose = calculateDailyDose();
        
        // Build medication data object
        const medicationData = {
            patient_code: patientCode,
            
            // Required fields
            drug_name: formData.drug_name.trim(),
            start_date: formData.start_date,
            
            // Basic fields
            dose: formData.dose || null,
            roa: formData.roa,
            frequency: formData.frequency || null,
            stop_date: formData.stop_date || null,
            indication: formData.indication || null,
            drug_class: formData.drug_class,
            initiated_at: formData.initiated_at,
            
            // Additional fields
            generic_name: formData.generic_name || null,
            brand_name: formData.brand_name || null,
            dosage_form: formData.dosage_form,
            strength: formData.strength || null,
            unit: formData.unit,
            total_daily_dose: totalDailyDose || null,
            timing: formData.timing || null,
            duration_days: formData.duration_days || null,
            quantity: formData.quantity || null,
            refills: formData.refills,
            prescribed_date: formData.prescribed_date || formData.start_date,
            diagnosis: formData.diagnosis || null,
            therapeutic_category: formData.therapeutic_category || null,
            atc_code: formData.atc_code || null,
            prescriber_name: formData.prescriber_name || null,
            prescriber_type: formData.prescriber_type,
            pharmacy_name: formData.pharmacy_name || null,
            
            // Status fields
            status: formData.status,
            prn: formData.prn,
            notes: formData.notes || null,
            
            // Calculated fields
            duration: duration,
            is_active: isActive,
            updated_at: new Date().toISOString()
        };

        console.log('Saving medication:', medicationData);

        try {
            let result;
            
            if (isEditing && formData.id) {
                // Update existing medication
                result = await supabase
                    .from('medication_history')
                    .update(medicationData)
                    .eq('id', formData.id)
                    .select();
            } else {
                // Add new medication
                result = await supabase
                    .from('medication_history')
                    .insert([medicationData])
                    .select();
            }

            if (result.error) {
                console.error('Database error:', result.error);
                throw result.error;
            }

            await fetchMedications();
            resetForm();
            alert(`✅ Medication ${isEditing ? 'updated' : 'added'} successfully!`);
        } catch (error) {
            console.error('Error saving medication:', error);
            alert(`❌ Error: ${error.message || 'Failed to save medication'}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            drug_name: '',
            start_date: '',
            dose: '',
            roa: 'po',
            frequency: '',
            stop_date: '',
            indication: '',
            drug_class: 'Antimicrobial',
            initiated_at: 'Hospital',
            generic_name: '',
            brand_name: '',
            dosage_form: 'Tablet',
            strength: '',
            unit: 'mg',
            total_daily_dose: '',
            timing: '',
            duration_days: '',
            quantity: '',
            refills: '0',
            prescribed_date: '',
            diagnosis: '',
            therapeutic_category: '',
            atc_code: '',
            prescriber_name: '',
            prescriber_type: 'Doctor',
            pharmacy_name: '',
            status: 'Active',
            prn: false,
            notes: '',
            id: '',
            is_active: true
        });
        setIsEditing(false);
        setShowAdvanced(false);
    };

    const handleEdit = (medication) => {
        setFormData({
            ...medication,
            prn: medication.prn || false,
            dosage_form: medication.dosage_form || 'Tablet',
            unit: medication.unit || 'mg',
            status: medication.status || 'Active',
            initiated_at: medication.initiated_at || 'Hospital',
            prescriber_type: medication.prescriber_type || 'Doctor',
            refills: medication.refills || '0'
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (medicationId) => {
        if (!window.confirm('Are you sure you want to delete this medication record?\nThis action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('medication_history')
                .delete()
                .eq('id', medicationId);

            if (error) throw error;

            await fetchMedications();
            alert('✅ Medication deleted successfully!');
        } catch (error) {
            console.error('Error deleting medication:', error);
            alert(`❌ Error: ${error.message || 'Failed to delete medication'}`);
        }
    };

    const applyFilters = (meds) => {
        let filtered = meds || [];
        
        // Apply search term filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(med => 
                med.drug_name?.toLowerCase().includes(term) ||
                med.generic_name?.toLowerCase().includes(term) ||
                med.indication?.toLowerCase().includes(term) ||
                med.drug_class?.toLowerCase().includes(term)
            );
        }
        
        // Apply class filter
        if (selectedClass) {
            filtered = filtered.filter(med => med.drug_class === selectedClass);
        }
        
        // Apply status filter
        if (activeFilter === 'active') {
            filtered = filtered.filter(med => med.status === 'Active' || med.is_active === true);
        } else if (activeFilter === 'inactive') {
            filtered = filtered.filter(med => med.status !== 'Active' && med.is_active !== true);
        } else if (activeFilter === 'prn') {
            filtered = filtered.filter(med => med.prn === true);
        }
        
        setFilteredMedications(filtered);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCalculate = () => {
        const dailyDose = calculateDailyDose();
        if (dailyDose) {
            setFormData(prev => ({
                ...prev,
                total_daily_dose: dailyDose
            }));
            alert(`Calculated Daily Dose: ${dailyDose}`);
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Active': return 'bg-green-100 text-green-800 border-green-200';
            case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Discontinued': return 'bg-red-100 text-red-800 border-red-200';
            case 'On Hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Planned': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStats = () => {
        const activeMeds = medications.filter(m => m.status === 'Active' || m.is_active === true);
        const prnMeds = medications.filter(m => m.prn === true);
        const oralMeds = medications.filter(m => m.roa === 'po');
        const uniqueClasses = [...new Set(medications.map(m => m.drug_class).filter(Boolean))];
        
        return {
            total: medications.length,
            active: activeMeds.length,
            prn: prnMeds.length,
            oral: oralMeds.length,
            classes: uniqueClasses.length
        };
    };

    useEffect(() => {
        applyFilters(medications);
    }, [medications, selectedClass, activeFilter, searchTerm]);

    const stats = getStats();

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <FaPrescription className="text-blue-600 text-xl" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Medication History</h2>
                        <p className="text-gray-600 flex items-center gap-2">
                            <span>Patient:</span>
                            <span className="font-semibold bg-blue-50 px-2 py-1 rounded">{patientCode}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchMedications}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                >
                    <FaSync className={`${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-700">Total Medications</div>
                    <div className="text-xl font-bold text-blue-800">{stats.total}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="text-sm text-green-700">Active</div>
                    <div className="text-xl font-bold text-green-800">{stats.active}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <div className="text-sm text-yellow-700">PRN</div>
                    <div className="text-xl font-bold text-yellow-800">{stats.prn}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <div className="text-sm text-purple-700">Oral</div>
                    <div className="text-xl font-bold text-purple-800">{stats.oral}</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <div className="text-sm text-indigo-700">Classes</div>
                    <div className="text-xl font-bold text-indigo-800">{stats.classes}</div>
                </div>
            </div>

            {/* Medication Registration Form */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <FaFilePrescription />
                        {isEditing ? 'Edit Medication' : 'Add New Medication'}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleCalculate}
                            className="text-sm bg-green-100 text-green-800 hover:bg-green-200 px-3 py-1 rounded-lg flex items-center gap-1"
                            title="Calculate daily dose"
                        >
                            <FaCalculator /> Calculate
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <FaInfoCircle />
                            {showAdvanced ? 'Basic Fields' : 'All Fields'}
                        </button>
                    </div>
                </div>

                {/* Required Fields */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                        <FaExclamationTriangle /> Required Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Drug Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Drug Name *
                            </label>
                            <input
                                type="text"
                                name="drug_name"
                                value={formData.drug_name}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Metformin"
                                required
                            />
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Drug Class */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Drug Class *
                            </label>
                            <select
                                name="drug_class"
                                value={formData.drug_class}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                {drugClasses.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Dose */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dose
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="dose"
                                value={formData.dose}
                                onChange={handleInputChange}
                                className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 500"
                            />
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleInputChange}
                                className="w-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                            >
                                {units.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency
                        </label>
                        <select
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select frequency</option>
                            {frequencyOptions.map(freq => (
                                <option key={freq} value={freq}>{freq}</option>
                            ))}
                        </select>
                    </div>

                    {/* Route */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Route
                        </label>
                        <select
                            name="roa"
                            value={formData.roa}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        >
                            {roaOptions.map(route => (
                                <option key={route.value} value={route.value}>
                                    {route.icon} {route.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Indication */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Indication
                        </label>
                        <input
                            type="text"
                            name="indication"
                            value={formData.indication}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Type 2 Diabetes"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        >
                            {statusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stop Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stop Date
                        </label>
                        <input
                            type="date"
                            name="stop_date"
                            value={formData.stop_date}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Advanced Fields */}
                {showAdvanced && (
                    <>
                        {/* Additional Drug Information */}
                        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                                <FaCapsules /> Drug Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Generic Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Generic Name
                                    </label>
                                    <input
                                        type="text"
                                        name="generic_name"
                                        value={formData.generic_name}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., Metformin HCl"
                                    />
                                </div>

                                {/* Brand Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Brand Name
                                    </label>
                                    <input
                                        type="text"
                                        name="brand_name"
                                        value={formData.brand_name}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., Glucophage"
                                    />
                                </div>

                                {/* Dosage Form */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dosage Form
                                    </label>
                                    <select
                                        name="dosage_form"
                                        value={formData.dosage_form}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        {dosageForms.map(form => (
                                            <option key={form} value={form}>{form}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Strength */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Strength
                                    </label>
                                    <input
                                        type="text"
                                        name="strength"
                                        value={formData.strength}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., 500mg/5ml"
                                    />
                                </div>

                                {/* ATC Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ATC Code
                                    </label>
                                    <input
                                        type="text"
                                        name="atc_code"
                                        value={formData.atc_code}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., A10BA02"
                                    />
                                </div>

                                {/* Therapeutic Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Therapeutic Category
                                    </label>
                                    <input
                                        type="text"
                                        name="therapeutic_category"
                                        value={formData.therapeutic_category}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., Biguanide"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Prescription Details */}
                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                                <FaFilePrescription /> Prescription Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Duration (Days)
                                    </label>
                                    <input
                                        type="number"
                                        name="duration_days"
                                        value={formData.duration_days}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., 30"
                                    />
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity
                                    </label>
                                    <input
                                        type="text"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="e.g., 30 tablets"
                                    />
                                </div>

                                {/* Refills */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Refills
                                    </label>
                                    <select
                                        name="refills"
                                        value={formData.refills}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="0">No refills</option>
                                        <option value="1">1 refill</option>
                                        <option value="2">2 refills</option>
                                        <option value="3">3 refills</option>
                                        <option value="unlimited">Unlimited</option>
                                    </select>
                                </div>

                                {/* Timing */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Timing
                                    </label>
                                    <select
                                        name="timing"
                                        value={formData.timing}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        <option value="">Select timing</option>
                                        {timingOptions.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* PRN */}
                                <div className="flex items-center col-span-2">
                                    <input
                                        type="checkbox"
                                        id="prn"
                                        name="prn"
                                        checked={formData.prn}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-blue-600 rounded"
                                    />
                                    <label htmlFor="prn" className="ml-2 text-sm text-gray-700">
                                        As Needed (PRN) Medication
                                    </label>
                                </div>

                                {/* Total Daily Dose */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total Daily Dose
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            name="total_daily_dose"
                                            value={formData.total_daily_dose}
                                            onChange={handleInputChange}
                                            className="flex-1 border border-gray-300 rounded-lg p-3"
                                            placeholder="Auto-calculated"
                                            readOnly
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCalculate}
                                            className="px-4 py-3 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                                        >
                                            <FaCalculator />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prescriber & Pharmacy Info */}
                        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                                <FaUserMd /> Prescriber & Pharmacy
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Prescriber Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prescriber Name
                                    </label>
                                    <input
                                        type="text"
                                        name="prescriber_name"
                                        value={formData.prescriber_name}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="Dr. Name"
                                    />
                                </div>

                                {/* Prescriber Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prescriber Type
                                    </label>
                                    <select
                                        name="prescriber_type"
                                        value={formData.prescriber_type}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        {prescriberTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Pharmacy Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FaHospital className="inline mr-1" /> Pharmacy
                                    </label>
                                    <input
                                        type="text"
                                        name="pharmacy_name"
                                        value={formData.pharmacy_name}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="Pharmacy Name"
                                    />
                                </div>

                                {/* Initiated At */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Initiated At
                                    </label>
                                    <select
                                        name="initiated_at"
                                        value={formData.initiated_at}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    >
                                        {initiatedAtOptions.map(place => (
                                            <option key={place} value={place}>{place}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Prescribed Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prescribed Date
                                    </label>
                                    <input
                                        type="date"
                                        name="prescribed_date"
                                        value={formData.prescribed_date}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clinical Information */}
                        <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h4 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
                                <FaStethoscope /> Clinical Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Diagnosis */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Diagnosis
                                    </label>
                                    <input
                                        type="text"
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="Primary diagnosis"
                                    />
                                </div>

                                {/* Notes */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FaNotesMedical className="inline mr-1" /> Clinical Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full border border-gray-300 rounded-lg p-3"
                                        placeholder="Additional clinical notes..."
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <FaSave /> {isEditing ? 'Update Medication' : 'Save Medication'}
                            </>
                        )}
                    </button>

                    {isEditing && (
                        <button
                            onClick={resetForm}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg transition"
                        >
                            Cancel Edit
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (formData.drug_name || formData.start_date) {
                                if (window.confirm('Clear all fields?')) {
                                    resetForm();
                                }
                            } else {
                                resetForm();
                            }
                        }}
                        className="text-gray-600 hover:text-gray-800 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        Clear Form
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaFilter className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filter & Search:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search medications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Status:</span>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {['all', 'active', 'inactive', 'prn'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-3 py-1 text-sm rounded capitalize ${
                                            activeFilter === filter
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Class Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Class:</span>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 bg-white min-w-[150px]"
                            >
                                <option value="">All Classes</option>
                                {drugClasses.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medications List */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Medication List ({filteredMedications.length} of {medications.length})
                    </h3>
                    <div className="text-sm text-gray-600">
                        {filteredMedications.length === 0 ? 'No medications found' : 'Showing all medications'}
                    </div>
                </div>

                {filteredMedications.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <FaPills className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">No medications found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {medications.length > 0 ? 'Try changing your search or filter' : 'Add medications using the form above'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-4 text-left font-medium text-gray-700">Drug Name</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Dose & Route</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Frequency</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Dates</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Indication</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Status</th>
                                    <th className="p-4 text-left font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMedications.map((med) => (
                                    <tr key={med.id} className="border-t hover:bg-gray-50 group">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{med.drug_name}</div>
                                            {med.generic_name && (
                                                <div className="text-sm text-gray-500">{med.generic_name}</div>
                                            )}
                                            {med.brand_name && (
                                                <div className="text-xs text-blue-600">{med.brand_name}</div>
                                            )}
                                            <div className="text-xs text-gray-400 mt-1">{med.drug_class}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{med.dose} {med.unit}</div>
                                            <div className="text-sm text-gray-500 uppercase">{med.roa}</div>
                                            {med.prn && (
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">PRN</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{med.frequency}</div>
                                            {med.timing && (
                                                <div className="text-sm text-gray-500">{med.timing}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FaCalendar className="text-gray-400 text-xs" />
                                                    <span>Start: {med.start_date}</span>
                                                </div>
                                                {med.stop_date && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <FaCalendar className="text-gray-400 text-xs" />
                                                        <span>Stop: {med.stop_date}</span>
                                                    </div>
                                                )}
                                                {med.duration && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <FaClock className="text-gray-400" />
                                                        <span>{med.duration}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-700">{med.indication || '—'}</div>
                                            {med.diagnosis && (
                                                <div className="text-sm text-gray-500">{med.diagnosis}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(med.status)}`}>
                                                {med.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={() => handleEdit(med)}
                                                    className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition"
                                                    title="Edit medication"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(med.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"
                                                    title="Delete medication"
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

            {/* Export/Print Options */}
            {filteredMedications.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                Print List
                            </button>
                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                                Export as CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicationHistory;