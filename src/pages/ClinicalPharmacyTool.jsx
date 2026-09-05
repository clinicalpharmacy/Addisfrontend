import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUser, FaWeight, FaHeartbeat, FaVial, FaNotesMedical,
    FaExclamationCircle, FaPills, FaArrowLeft, FaPlay, FaPlus, FaTrash,
    FaUserShield, FaRobot, FaMoneyBillWave, FaFileMedical, FaChartLine,
    FaCopy, FaTimes, FaChevronDown, FaChevronRight
} from 'react-icons/fa';
import supabase from '../utils/supabase';
import CDSSDisplay from '../components/CDSS/CDSSDisplay';
import DRNAssessment from '../components/Patient/DRNAssessment';
import PhAssistPlan from '../components/Patient/PhAssistPlan';
import PatientOutcome from '../components/Patient/PatientOutcome';
import CostSection from '../components/Patient/CostSection';

// Main categories in the correct order
const MAIN_CATEGORIES = [
    { id: 'demography', label: 'Demography', icon: FaUser },
    { id: 'anthropometry', label: 'Anthropometry', icon: FaWeight },
    { id: 'vitals', label: 'Vitals', icon: FaHeartbeat },
    { id: 'labs', label: 'Labs', icon: FaVial },
    { id: 'diagnosis', label: 'Diagnosis', icon: FaNotesMedical },
    { id: 'special_conditions', label: 'Special Conditions', icon: FaExclamationCircle },
    { id: 'medications', label: 'Medications', icon: FaPills }
];

// Static lab categories with their specific tests (sub-categories under Labs)
const LAB_SUB_CATEGORIES = [
    {
        id: 'coagulation',
        label: 'Coagulation test',
        icon: FaVial,
        tests: [
            { name: 'PT', unit: 'sec' },
            { name: 'APTT', unit: 'sec' },
            { name: 'INR', unit: '' },
            { name: 'Fibrinogen', unit: 'mg/dL' }
        ]
    },
    {
        id: 'cbc',
        label: 'Complete blood count (CBC)',
        icon: FaVial,
        tests: [
            { name: 'WBC', unit: 'x10³/µL' },
            { name: 'RBC', unit: 'x10⁶/µL' },
            { name: 'Hemoglobin', unit: 'g/dL' },
            { name: 'Hematocrit', unit: '%' },
            { name: 'Platelets', unit: 'x10³/µL' }
        ]
    },
    {
        id: 'general',
        label: 'General',
        icon: FaVial,
        tests: [
            { name: 'Glucose', unit: 'mg/dL' },
            { name: 'Urea', unit: 'mg/dL' },
            { name: 'Creatinine', unit: 'mg/dL' },
            { name: 'Sodium', unit: 'mEq/L' },
            { name: 'Potassium', unit: 'mEq/L' },
            { name: 'Chloride', unit: 'mEq/L' }
        ]
    },
    {
        id: 'liver_function',
        label: 'Liver function tests',
        icon: FaVial,
        tests: [
            { name: 'ALT', unit: 'U/L' },
            { name: 'AST', unit: 'U/L' },
            { name: 'ALP', unit: 'U/L' },
            { name: 'GGT', unit: 'U/L' },
            { name: 'Total Bilirubin', unit: 'mg/dL' },
            { name: 'Direct Bilirubin', unit: 'mg/dL' },
            { name: 'Total Protein', unit: 'g/dL' },
            { name: 'Albumin', unit: 'g/dL' }
        ]
    },
    {
        id: 'renal_function',
        label: 'Renal function tests',
        icon: FaVial,
        tests: [
            { name: 'Serum Creatinine', unit: 'mg/dL' },
            { name: 'BUN', unit: 'mg/dL' },
            { name: 'eGFR', unit: 'mL/min/1.73m²' },
            { name: 'Uric Acid', unit: 'mg/dL' },
            { name: 'Urine Protein', unit: 'mg/dL' }
        ]
    }
];

const ClinicalPharmacyTool = () => {
    const navigate = useNavigate();
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedLabSubCategories, setSelectedLabSubCategories] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis');
    const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(true);
    
    // State for individual section collapse/expand
    const [expandedSections, setExpandedSections] = useState({
        demography: true,
        anthropometry: true,
        vitals: true,
        labs: true,
        diagnosis: true,
        special_conditions: true,
        medications: true
    });

    // ✅ Get user role from localStorage (same logic as sidebar)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user?.role === 'admin' || user?.role?.includes('admin');
    const isPharmacist = user?.role === 'pharmacist';
    const isPharmacyStudent = user?.role === 'pharmacy_student';
    const isIndividual = !user?.role?.includes('admin') && !user?.company_id;
    // Allow organizations (company_admin and company_user) to get the features that pharmacy students have
    const isCompanyUser = user?.role === 'company_admin' || user?.role === 'company_user' || user?.account_type === 'company_user';
    const isPharmacistOrStudent = (isIndividual && (isPharmacist || isPharmacyStudent)) || isCompanyUser;

    // All categories - main categories only (labs is the main category, sub-categories are handled separately)
    const allCategories = MAIN_CATEGORIES;

    // Tab Data States for PDF
    const [cdssData, setCdssData] = useState([]);
    const [drnData, setDrnData] = useState([]);
    const [planData, setPlanData] = useState([]);
    const [outcomeData, setOutcomeData] = useState([]);
    const [costData, setCostData] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        // Demography
        age: '',
        gender: '',
        // Anthropometry
        weight: '',
        height: '',
        bsa: '', // Changed from bmi to bsa
        // Vitals
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        temperature: '',
        oxygen_saturation: '',
        // Diagnosis
        diagnosis: '',
        // Special Conditions
        kidney_failure: false,
        liver_failure: false,
        is_pregnant: false,
        is_lactating: false,
        // Medications - simplified fields
        medications: [],
        // Labs Storage - for all lab tests
        labs: {}
    });

    // Toggle section expansion
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    // Calculate BSA using Du Bois method: BSA = 0.007184 × W^0.425 × H^0.725
    // Weight in kg, Height in cm
    const calculateBSA = (weight, height) => {
        if (!weight || !height || weight <= 0 || height <= 0) return '';
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const bsa = 0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725);
        return bsa.toFixed(2);
    };

    // Calculate eGFR using 2021 CKD-EPI creatinine formula
    // eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1.200 × 0.9938^Age × 1.012 [if female]
    // Where:
    // - Scr = Serum creatinine in mg/dL
    // - κ = 0.7 (female) or 0.9 (male)
    // - α = -0.241 (female) or -0.302 (male)
    const calculateEGFR = (creatinine, age, gender) => {
        if (!creatinine || !age || !gender || creatinine <= 0 || age <= 0) return '';
        
        const scr = parseFloat(creatinine);
        const ageNum = parseFloat(age);
        const isFemale = gender.toLowerCase() === 'female';
        
        // Constants for 2021 CKD-EPI formula
        const kappa = isFemale ? 0.7 : 0.9;
        const alpha = isFemale ? -0.241 : -0.302;
        const sexFactor = isFemale ? 1.012 : 1.0;
        
        // Calculate eGFR
        const minRatio = Math.min(scr / kappa, 1);
        const maxRatio = Math.max(scr / kappa, 1);
        
        const egfr = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, ageNum) * sexFactor;
        
        return Math.round(egfr).toString();
    };

    // Add this useEffect after the formData state declaration
    useEffect(() => {
        // Calculate BSA when weight and height are both provided
        if (formData.weight && formData.height) {
            const weight = parseFloat(formData.weight);
            const height = parseFloat(formData.height);
            
            if (weight > 0 && height > 0) {
                const calculatedBSA = calculateBSA(weight, height);
                
                // Only update if BSA has changed to avoid infinite loop
                if (formData.bsa !== calculatedBSA) {
                    setFormData(prev => ({
                        ...prev,
                        bsa: calculatedBSA
                    }));
                }
            }
        }
    }, [formData.weight, formData.height]);

    // Auto-calculate eGFR when creatinine, age, or gender changes
    useEffect(() => {
        const creatinine = formData.labs?.serum_creatinine;
        const age = formData.age;
        const gender = formData.gender;
        
        // Check if all required fields are filled
        const hasRequiredFields = creatinine && age && gender && 
                                  parseFloat(creatinine) > 0 && 
                                  parseFloat(age) > 0;
        
        if (hasRequiredFields) {
            const calculatedEGFR = calculateEGFR(creatinine, age, gender);
            
            // Only update if eGFR has changed to avoid infinite loop
            if (formData.labs?.egfr !== calculatedEGFR) {
                setFormData(prev => ({
                    ...prev,
                    labs: {
                        ...prev.labs,
                        egfr: calculatedEGFR
                    }
                }));
            }
        } else {
            // If required fields are missing, set eGFR to empty string
            // This will show the placeholder message
            if (formData.labs?.egfr !== '') {
                setFormData(prev => ({
                    ...prev,
                    labs: {
                        ...prev.labs,
                        egfr: ''
                    }
                }));
            }
        }
    }, [formData.labs?.serum_creatinine, formData.age, formData.gender]);
    
    const handleCategoryToggle = (categoryId) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
            // If unchecking labs, clear lab sub-categories
            if (categoryId === 'labs') {
                setSelectedLabSubCategories([]);
            }
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
            // Auto-add one empty medication row when medications checkbox is ticked
            if (categoryId === 'medications' && formData.medications.length === 0) {
                setFormData(prev => ({
                    ...prev,
                    medications: [{
                        drug_name: '',
                        brand_name: '',
                        indication: '',
                        dose: '',
                        strength: '',
                        unit: 'mg',
                        dosage_form: 'Tablet',
                        route: '',
                        frequency: '',
                        duration: '',
                        start_date: '',
                        stop_date: '',
                        status: 'Active'
                    }]
                }));
            }
        }
    };

    const handleLabSubCategoryToggle = (subCategoryId) => {
        if (selectedLabSubCategories.includes(subCategoryId)) {
            setSelectedLabSubCategories(selectedLabSubCategories.filter(id => id !== subCategoryId));
        } else {
            setSelectedLabSubCategories([...selectedLabSubCategories, subCategoryId]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleLabChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            labs: {
                ...formData.labs,
                [name]: value
            }
        });
    };

    // Medication handlers - simplified
    const addMedication = () => {
        setFormData({
            ...formData,
            medications: [
                ...formData.medications,
                {
                    drug_name: '',
                    brand_name: '',
                    indication: '',
                    dose: '',
                    strength: '',
                    unit: 'mg',
                    dosage_form: 'Tablet',
                    route: '',
                    frequency: '',
                    duration: '',
                    start_date: '',
                    stop_date: '',
                    status: 'Active'
                }
            ]
        });
    };

    const updateMedication = (index, field, value) => {
        const newMeds = [...formData.medications];
        newMeds[index][field] = value;
        setFormData({ ...formData, medications: newMeds });
    };

    const removeMedication = (index) => {
        const newMeds = formData.medications.filter((_, i) => i !== index);
        setFormData({ ...formData, medications: newMeds });
    };

    const handleRunAnalysis = () => {
        setShowAnalysis(true);
        // ✅ Set default tab to 'analysis' when showing results
        setActiveTab('analysis');
    };

    const sessionId = React.useMemo(() => 'TEMP-' + Math.floor(Math.random() * 10000), []);

    // Construct patientData object for CDSSDisplay
    const constructedPatientData = React.useMemo(() => ({
        id: sessionId, // Stable ID for the session
        full_name: 'Individual Review',
        age: formData.age,
        gender: formData.gender,
        is_pregnant: formData.is_pregnant,
        is_lactating: formData.is_lactating,
        vitals: {
            weight: formData.weight,
            height: formData.height,
            bsa: formData.bsa, // Changed from bmi to bsa
            blood_pressure: formData.blood_pressure,
            heart_rate: formData.heart_rate,
            respiratory_rate: formData.respiratory_rate,
            temperature: formData.temperature,
            oxygen_saturation: formData.oxygen_saturation,
        },
        labs: {
            ...formData.labs
        },
        medication_history: formData.medications,
        allergies: [], // Add if needed later
        // Note: CDSS rule engine checks for specific terms in diagnosis or fields for kidney/liver failure.
        // We ensure these terms exist in the diagnosis if checked manually.
        diagnosis: [
            formData.diagnosis,
            formData.kidney_failure ? 'Kidney Failure' : '',
            formData.liver_failure ? 'Liver Failure' : ''
        ].filter(Boolean).join(', ') || 'None provided'
    }), [formData, sessionId]);

    const generateFullPDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            // Header
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('COMPREHENSIVE CLINICAL REPORT', 15, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 30);

            let currentY = 50;

            // --- 1. Patient Summary ---
            doc.setTextColor(31, 41, 55);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Patient Information', 15, currentY);
            doc.line(15, currentY + 2, 195, currentY + 2);

            autoTable(doc, {
                startY: currentY + 5,
                body: [
                    ['Age & Gender:', `${formData.age || 'N/A'} - ${formData.gender || 'N/A'}`],
                    ['Vitals:', `Weight: ${formData.weight || '-'} kg, BSA: ${formData.bsa || '-'} m², BP: ${formData.blood_pressure || '-'}`],
                    ['Diagnosis:', constructedPatientData.diagnosis]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 }
            });
            currentY = doc.lastAutoTable.finalY + 10;

            // --- CDSS Clinical Analysis ---
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('CDSS Clinical Analysis Findings', 15, currentY);
            
            if (cdssData && cdssData.length > 0) {
                const alertRows = cdssData.map((alert, index) => {
                    const finding = localStorage.getItem('userRole') === 'healthcare_client' || localStorage.getItem('pharmacare_userRole') === 'healthcare_client'
                        ? (alert.client_message || alert.message)
                        : (alert.professional_message || alert.message);
                    const recommendation = (localStorage.getItem('userRole') === 'healthcare_client' || localStorage.getItem('pharmacare_userRole') === 'healthcare_client'
                        ? (alert.client_recommendation || alert.details)
                        : (alert.professional_recommendation || alert.details)) || 'Review clinical guidelines';
                    return [index + 1, finding, recommendation];
                });

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['#', 'Finding', 'Evidence Recommendation']],
                    body: alertRows,
                    theme: 'grid',
                    headStyles: { fillColor: [220, 38, 38] },
                    styles: { fontSize: 8, cellPadding: 3 },
                    columnStyles: {
                        0: { width: 10 },
                        1: { width: 80 },
                        2: { width: 90 }
                    }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(21, 128, 61); // Green color
                doc.text('No drug-related problems detected based on current analysis.', 15, currentY + 7);
                currentY += 15;
            }

            // --- 2. Current Medications ---
            if (formData.medications.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Current Medications', 15, currentY);
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['#', 'Drug Name', 'Dose']],
                    body: formData.medications.map((m, i) => [i + 1, m.drug_name, m.dose]),
                    theme: 'grid',
                    headStyles: { fillColor: [107, 114, 128] }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // --- 3. DRN Assessment --- (✅ Only if pharmacist/student)
            if (isPharmacistOrStudent && drnData && drnData.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('DRN Assessment', 15, currentY);
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Category', 'DTP Type', 'Severity', 'Status']],
                    body: drnData.map(d => [d.category, d.dtp_type, d.severity, d.status]),
                    theme: 'grid',
                    headStyles: { fillColor: [37, 99, 235] }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // --- 4. Pharmacy Plan --- (✅ Only if pharmacist/student)
            if (isPharmacistOrStudent && planData && planData.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Pharmacy Plan & Assessment', 15, currentY);
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Goals/Assessment', 'Plan Notes', 'Follow Up']],
                    body: planData.map(p => [p.goals || '-', p.notes || '-', p.follow_up || 'None']),
                    theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129] }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // --- 5. Outcome --- (✅ Only if pharmacist/student)
            if (isPharmacistOrStudent && outcomeData && outcomeData.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Patient Outcome', 15, currentY);
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Status', 'Notes']],
                    body: outcomeData.map(o => [o.outcome_status || '-', o.notes || '-']),
                    theme: 'grid',
                    headStyles: { fillColor: [245, 158, 11] }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            }

            // --- 6. Cost --- (✅ Only if pharmacist/student)
            if (isPharmacistOrStudent && costData && costData.length > 0) {
                if (currentY > 250) { doc.addPage(); currentY = 20; }
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Cost Analysis', 15, currentY);
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Type', 'Category', 'Amount', 'Description']],
                    body: costData.map(c => [c.type, c.category, `${c.amount} ETB`, c.description || '-']),
                    theme: 'grid',
                    headStyles: { fillColor: [239, 68, 68] }
                });
            }

            // --- DISCLAIMER & PAGE NUMBERS ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text(
                    'DISCLAIMER: This clinical analysis report only gives information & it cannot replace the decision of a health professional.',
                    15, 285
                );
                doc.text(`Page ${i} of ${pageCount}`, 180, 285);
            }

            doc.save(`Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('PDF generation failed. Please check console.');
        }
    };

    if (showAnalysis) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 animate-in fade-in duration-500">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowAnalysis(false)}
                                className="bg-white p-2.5 rounded-lg shadow-sm hover:bg-gray-100 transition-colors text-gray-600 border border-gray-100"
                            >
                                <FaArrowLeft />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800">Clinical Analysis Results</h1>
                        </div>
                        <button
                            onClick={generateFullPDF}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm"
                        >
                            <FaNotesMedical /> Download Full Report
                        </button>
                    </div>

                    {/* ✅ Tab Navigation - Only show restricted tabs for Pharmacists & Pharmacy Students */}
                    <div className="flex overflow-x-auto gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm hide-scrollbar">

                        {/* Clinical Case Review - Always visible */}
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                                activeTab === 'analysis' 
                                ? 'bg-blue-600 text-white shadow-md font-medium' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <FaUserShield /> Clinical Case Review
                        </button>

                        {/* ✅ DRN Assessment - ONLY for Admin (HIDDEN otherwise) */}
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('drn')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                                    activeTab === 'drn' 
                                    ? 'bg-blue-600 text-white shadow-md font-medium' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <FaRobot /> DRN Assessment
                            </button>
                        )}

                        {/* ✅ Ph-Asst & Plan - ONLY for Admin (HIDDEN otherwise) */}
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('plan')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                                    activeTab === 'plan' 
                                    ? 'bg-blue-600 text-white shadow-md font-medium' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <FaFileMedical /> Ph-Asst & Plan
                            </button>
                        )}

                        {/* ✅ Outcome - ONLY for Admin (HIDDEN otherwise) */}
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('outcome')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                                    activeTab === 'outcome' 
                                    ? 'bg-blue-600 text-white shadow-md font-medium' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <FaChartLine /> Outcome
                            </button>
                        )}

                        {/* ✅ Cost - ONLY for Admin (HIDDEN otherwise) */}
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('cost')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                                    activeTab === 'cost' 
                                    ? 'bg-blue-600 text-white shadow-md font-medium' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <FaMoneyBillWave /> Cost
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {activeTab === 'analysis' && (
                            <CDSSDisplay
                                patientData={constructedPatientData}
                                onBack={() => setShowAnalysis(false)}
                                onDataChange={(data) => setCdssData(data)}
                            />
                        )}
                        
                        {/* ✅ Only render DRN if user is pharmacist/student */}
                        {activeTab === 'drn' && isPharmacistOrStudent && (
                            <DRNAssessment
                                patientCode={constructedPatientData.id}
                                patientData={constructedPatientData}
                                medicationHistory={constructedPatientData.medication_history}
                                standalone={true}
                                onDataChange={(data) => setDrnData(data)}
                            />
                        )}
                        
                        {/* ✅ Only render Ph-Asst if user is pharmacist/student */}
                        {activeTab === 'plan' && isPharmacistOrStudent && (
                            <PhAssistPlan
                                patientCode={constructedPatientData.id}
                                patientData={constructedPatientData}
                                standalone={true}
                                onDataChange={(data) => setPlanData(data)}
                            />
                        )}
                        
                        {/* ✅ Only render Outcome if user is pharmacist/student */}
                        {activeTab === 'outcome' && isPharmacistOrStudent && (
                            <PatientOutcome
                                patientCode={constructedPatientData.id}
                                patientData={constructedPatientData}
                                standalone={true}
                                onDataChange={(data) => setOutcomeData(data)}
                            />
                        )}
                        
                        {/* ✅ Only render Cost if user is pharmacist/student */}
                        {activeTab === 'cost' && isPharmacistOrStudent && (
                            <CostSection
                                patientCode={constructedPatientData.id}
                                patientData={constructedPatientData}
                                standalone={true}
                                onDataChange={(data) => setCostData(data)}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white p-2.5 rounded-lg shadow-sm hover:bg-gray-100 transition-colors text-gray-600 border border-gray-100"
                        >
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Clinical Pharmacy Tool</h1>
                            <p className="text-gray-600">Fill the data for medication review to run clinical analysis</p>
                        </div>
                    </div>
                </div>

                {/* Category Selector - Collapsible, Top-Left */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                    <button
                        onClick={() => setIsCategorySelectorOpen(!isCategorySelectorOpen)}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <div className="flex items-center gap-2">
                            <h2 className="text-md font-semibold text-gray-800">
                                Which data are you going to fill for the medication review?
                            </h2>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {selectedCategories.length} selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                            <span className="text-sm font-medium">
                                {isCategorySelectorOpen ? 'Hide' : 'Show'}
                            </span>
                            {isCategorySelectorOpen ? <FaChevronDown /> : <FaChevronRight />}
                        </div>
                    </button>
                    
                    {isCategorySelectorOpen && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {allCategories.map(category => {
                                    const isSelected = selectedCategories.includes(category.id);
                                    return (
                                        <div
                                            key={category.id}
                                            onClick={() => handleCategoryToggle(category.id)}
                                            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-blue-200 text-gray-600'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 pointer-events-none"
                                            />
                                            <category.icon className={isSelected ? 'text-blue-500' : 'text-gray-400'} size={14} />
                                            <span className="font-medium text-sm">{category.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {selectedCategories.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6">
                            {/* Demography - Left */}
                            {selectedCategories.includes('demography') && (
                                <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('demography')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaUser className="text-blue-500" /> Demography
                                        </h3>
                                        <div className="text-gray-400">
                                            {expandedSections.demography ? <FaChevronDown /> : <FaChevronRight />}
                                        </div>
                                    </button>
                                    {expandedSections.demography && (
                                        <div className="p-4 pt-0">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age (Years)</label>
                                                    <input
                                                        type="number"
                                                        name="age"
                                                        value={formData.age}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="e.g. 45"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                                    <select
                                                        name="gender"
                                                        value={formData.gender}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Anthropometry - Left */}
                            {selectedCategories.includes('anthropometry') && (
                                <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('anthropometry')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaWeight className="text-green-500" /> Anthropometry
                                        </h3>
                                        <div className="text-gray-400">
                                            {expandedSections.anthropometry ? <FaChevronDown /> : <FaChevronRight />}
                                        </div>
                                    </button>
                                    {expandedSections.anthropometry && (
                                        <div className="p-4 pt-0">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                                    <input
                                                        type="number"
                                                        name="weight"
                                                        value={formData.weight}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g. 70"
                                                        step="0.1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                                                    <input
                                                        type="number"
                                                        name="height"
                                                        value={formData.height}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g. 175"
                                                        step="0.1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        BSA (m²)
                                                        <span className="text-xs text-gray-500 ml-1">(auto-calculated)</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="bsa"
                                                        value={formData.bsa}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Auto-calculated"
                                                        step="0.01"
                                                        readOnly
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Du Bois method: BSA = 0.007184 × W^0.425 × H^0.725
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Labs - Left Bottom */}
                            {selectedCategories.includes('labs') && (
                                <div className="bg-white rounded-xl shadow-sm border-l-4 border-yellow-500 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('labs')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaVial className="text-yellow-500" /> Labs
                                        </h3>
                                        <div className="text-gray-400">
                                            {expandedSections.labs ? <FaChevronDown /> : <FaChevronRight />}
                                        </div>
                                    </button>
                                    {expandedSections.labs && (
                                        <div className="p-4 pt-0">
                                            {/* Sub-category selection */}
                                            <div className="mb-4">
                                                <p className="text-sm text-gray-600 mb-2">Select which lab tests you want to fill:</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {LAB_SUB_CATEGORIES.map((subCat) => (
                                                        <label 
                                                            key={subCat.id}
                                                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                                                selectedLabSubCategories.includes(subCat.id)
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                    : 'border-gray-200 hover:border-blue-200 text-gray-600'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLabSubCategories.includes(subCat.id)}
                                                                onChange={() => handleLabSubCategoryToggle(subCat.id)}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm font-medium">{subCat.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Show selected lab categories */}
                                            <div className="space-y-6">
                                                {LAB_SUB_CATEGORIES.filter(subCat => selectedLabSubCategories.includes(subCat.id)).map((labCategory) => (
                                                    <div key={labCategory.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                        <h4 className="text-md font-semibold text-gray-700 mb-3">{labCategory.label}</h4>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {labCategory.tests.map((test) => {
                                                                const key = test.name.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
                                                                const isEGFR = key === 'egfr';
                                                                const hasRequiredFields = formData.age && formData.gender && 
                                                                                         formData.labs?.serum_creatinine &&
                                                                                         parseFloat(formData.age) > 0 &&
                                                                                         parseFloat(formData.labs.serum_creatinine) > 0;
                                                                
                                                                return (
                                                                    <div key={key}>
                                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                            {test.name} {test.unit ? `(${test.unit})` : ''}
                                                                        </label>
                                                                        <input 
                                                                            type="number" 
                                                                            step="any" 
                                                                            name={key} 
                                                                            value={formData.labs[key] || ''} 
                                                                            onChange={handleLabChange} 
                                                                            className={`w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                                                                                isEGFR ? 'bg-gray-100 cursor-not-allowed' : ''
                                                                            }`}
                                                                            readOnly={isEGFR}
                                                                            placeholder={isEGFR && !hasRequiredFields ? 'Please fill required fields' : ''}
                                                                        />
                                                                        {isEGFR && formData.labs.egfr && hasRequiredFields && (
                                                                            <p className="text-xs text-blue-600 mt-1">
                                                                                Auto-calculated (2021 CKD-EPI)
                                                                            </p>
                                                                        )}
                                                                        {isEGFR && !hasRequiredFields && formData.labs.serum_creatinine && (
                                                                            <p className="text-xs text-orange-500 mt-1">
                                                                                Please fill Age and Gender
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {selectedLabSubCategories.length === 0 && (
                                                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                        Please select at least one lab test category from above.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-6">
                            {/* Vitals - Right */}
                            {selectedCategories.includes('vitals') && (
                                <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('vitals')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaHeartbeat className="text-red-500" /> Vitals
                                        </h3>
                                        <div className="text-gray-400">
                                            {expandedSections.vitals ? <FaChevronDown /> : <FaChevronRight />}
                                        </div>
                                    </button>
                                    {expandedSections.vitals && (
                                        <div className="p-4 pt-0">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                                                    <input
                                                        type="text"
                                                        name="blood_pressure"
                                                        value={formData.blood_pressure}
                                                        onChange={handleInputChange}
                                                        placeholder="120/80"
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                                                    <input
                                                        type="number"
                                                        name="heart_rate"
                                                        value={formData.heart_rate}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
                                                    <input
                                                        type="number"
                                                        name="respiratory_rate"
                                                        value={formData.respiratory_rate}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        name="temperature"
                                                        value={formData.temperature}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">O2 Saturation (%)</label>
                                                    <input
                                                        type="number"
                                                        name="oxygen_saturation"
                                                        value={formData.oxygen_saturation}
                                                        onChange={handleInputChange}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Diagnosis - Right */}
                            {selectedCategories.includes('diagnosis') && (
                                <div className="bg-white rounded-xl shadow-sm border-l-4 border-indigo-500 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('diagnosis')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaNotesMedical className="text-indigo-500" /> Diagnosis
                                        </h3>
                                        <div className="text-gray-400">
                                            {expandedSections.diagnosis ? <FaChevronDown /> : <FaChevronRight />}
                                        </div>
                                    </button>
                                    {expandedSections.diagnosis && (
                                        <div className="p-4 pt-0">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary/Secondary Diagnosis</label>
                                                <textarea
                                                    name="diagnosis"
                                                    value={formData.diagnosis}
                                                    onChange={handleInputChange}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                                                    placeholder="e.g. Hypertension, Type 2 Diabetes"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Special Conditions - Right */}
                            {selectedCategories.includes('special_conditions') && (
                                <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('special_conditions')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FaExclamationCircle className="text-orange-500" /> Special Conditions
                                        </h3>
                                        <div className="text-gray-400">
                                            {expandedSections.special_conditions ? <FaChevronDown /> : <FaChevronRight />}
                                        </div>
                                    </button>
                                    {expandedSections.special_conditions && (
                                        <div className="p-4 pt-0">
                                            <div className="grid grid-cols-1 gap-3">
                                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        name="kidney_failure"
                                                        checked={formData.kidney_failure}
                                                        onChange={handleInputChange}
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="font-medium text-gray-700">Kidney Failure / Impaired Renal Function</span>
                                                </label>
                                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        name="liver_failure"
                                                        checked={formData.liver_failure}
                                                        onChange={handleInputChange}
                                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="font-medium text-gray-700">Liver Failure / Hepatic Impairment</span>
                                                </label>
                                                {formData.gender === 'female' && (
                                                    <>
                                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                name="is_pregnant"
                                                                checked={formData.is_pregnant}
                                                                onChange={handleInputChange}
                                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="font-medium text-gray-700">Pregnant</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                name="is_lactating"
                                                                checked={formData.is_lactating}
                                                                onChange={handleInputChange}
                                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="font-medium text-gray-700">Lactating / Breastfeeding</span>
                                                        </label>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Medications - Right Bottom */}
                            {selectedCategories.includes('medications') && (
                                <div className="bg-white rounded-xl shadow-sm border-l-4 border-purple-500 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection('medications')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                <FaPills className="text-purple-500" /> Medications
                                            </h3>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {formData.medications.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!expandedSections.medications && formData.medications.length > 0 && (
                                                <span className="text-xs text-gray-400 mr-2">
                                                    {formData.medications.length} medication{formData.medications.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <div className="text-gray-400">
                                                {expandedSections.medications ? <FaChevronDown /> : <FaChevronRight />}
                                            </div>
                                        </div>
                                    </button>
                                    {expandedSections.medications && (
                                        <div className="p-4 pt-0">
                                            <div className="flex items-center justify-between mb-4">
                                                <button
                                                    onClick={addMedication}
                                                    className="flex items-center gap-2 text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 font-medium"
                                                >
                                                    <FaPlus /> Add Medication
                                                </button>
                                            </div>
                                    
                                            {formData.medications.length === 0 ? (
                                                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                    No medications added. Click "Add Medication" to include drugs in the analysis.
                                                </div>
                                            ) : (
                                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                                    {formData.medications.map((med, index) => (
                                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                                                            <button
                                                                onClick={() => removeMedication(index)}
                                                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm hover:shadow"
                                                                title="Remove medication"
                                                            >
                                                                <FaTimes className="w-3 h-3" />
                                                            </button>
                                                            
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {/* Drug Name */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Drug Name</label>
                                                                    <input
                                                                        type="text"
                                                                        value={med.drug_name}
                                                                        onChange={(e) => updateMedication(index, 'drug_name', e.target.value)}
                                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                        placeholder="Generic Name"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Brand Name */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name</label>
                                                                    <input
                                                                        type="text"
                                                                        value={med.brand_name}
                                                                        onChange={(e) => updateMedication(index, 'brand_name', e.target.value)}
                                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                        placeholder="Brand Name"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Indication */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Indication</label>
                                                                    <input
                                                                        type="text"
                                                                        value={med.indication}
                                                                        onChange={(e) => updateMedication(index, 'indication', e.target.value)}
                                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                        placeholder="Reason for use"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Dose / Unit */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Dose / Unit</label>
                                                                    <div className="flex gap-1">
                                                                        <input
                                                                            type="text"
                                                                            value={med.dose}
                                                                            onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                                                                            className="flex-1 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                            placeholder="Dose"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={med.unit}
                                                                            onChange={(e) => updateMedication(index, 'unit', e.target.value)}
                                                                            className="w-16 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                            placeholder="Unit"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Dosage Form */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Dosage Form</label>
                                                                    <select
                                                                        value={med.dosage_form}
                                                                        onChange={(e) => updateMedication(index, 'dosage_form', e.target.value)}
                                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500 bg-white"
                                                                    >
                                                                        <option value="Tablet">Tablet</option>
                                                                        <option value="Capsule">Capsule</option>
                                                                        <option value="Injection">Injection</option>
                                                                        <option value="Syrup">Syrup</option>
                                                                        <option value="Inhaler">Inhaler</option>
                                                                        <option value="Cream/Ointment">Cream/Ointment</option>
                                                                        <option value="Drops">Drops</option>
                                                                        <option value="Other">Other</option>
                                                                    </select>
                                                                </div>
                                                                
                                                                {/* Route */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                                                                    <input
                                                                        type="text"
                                                                        value={med.route}
                                                                        onChange={(e) => updateMedication(index, 'route', e.target.value)}
                                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                        placeholder="e.g. PO, IV, IM"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Frequency */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                                                                    <input
                                                                        type="text"
                                                                        value={med.frequency}
                                                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                        placeholder="e.g. BID, TID, OD"
                                                                    />
                                                                </div>
                                                                
                                                                {/* Duration */}
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                                                                    <input
                                                                        type="text"
                                                                        value={med.duration}
                                                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                        placeholder="e.g. 7 days, 4 weeks"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Run Analysis Button - Full Width */}
                {selectedCategories.length > 0 && (
                    <div className="flex justify-center pt-6 pb-6 mt-4">
                        <button
                            onClick={handleRunAnalysis}
                            className="flex items-center gap-2 px-10 py-3.5 rounded-xl font-bold shadow-lg transition-all text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:-translate-y-1"
                        >
                            <FaPlay /> Run Clinical Analysis
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalPharmacyTool;
