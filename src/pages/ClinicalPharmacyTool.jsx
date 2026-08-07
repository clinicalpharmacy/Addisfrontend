import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUser, FaWeight, FaHeartbeat, FaVial, FaNotesMedical,
    FaExclamationCircle, FaPills, FaArrowLeft, FaPlay, FaPlus, FaTrash,
    FaUserShield, FaRobot, FaMoneyBillWave, FaFileMedical, FaChartLine,
    FaCopy, FaTimes
} from 'react-icons/fa';
import CDSSDisplay from '../components/CDSS/CDSSDisplay';
import DRNAssessment from '../components/Patient/DRNAssessment';
import PhAssistPlan from '../components/Patient/PhAssistPlan';
import PatientOutcome from '../components/Patient/PatientOutcome';
import CostSection from '../components/Patient/CostSection';

const CATEGORIES = [
    { id: 'demography', label: 'Demography (Age & Gender)', icon: FaUser },
    { id: 'anthropometry', label: 'Anthropometry', icon: FaWeight },
    { id: 'vitals', label: 'Vitals', icon: FaHeartbeat },
    { id: 'labs', label: 'Labs', icon: FaVial },
    { id: 'diagnosis', label: 'Diagnosis', icon: FaNotesMedical },
    { id: 'special_conditions', label: 'Special Conditions', icon: FaExclamationCircle },
    { id: 'medications', label: 'Medications', icon: FaPills }
];

const ClinicalPharmacyTool = () => {
    const navigate = useNavigate();
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis');

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
        bmi: '',
        // Vitals
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        temperature: '',
        oxygen_saturation: '',
        // Labs - Renal Function
        bun: '',
        creatinine: '',
        gfr: '',
        // Labs - Electrolytes
        sodium: '',
        potassium: '',
        chloride: '',
        calcium: '',
        magnesium: '',
        phosphate: '',
        // Labs - Liver Function
        alt: '',
        ast: '',
        alp: '',
        total_bilirubin: '',
        direct_bilirubin: '',
        albumin: '',
        total_protein: '',
        // Labs - CBC / Hematology
        wbc_count: '',
        rbc_count: '',
        hemoglobin: '',
        hematocrit: '',
        platelet_count: '',
        mcv: '',
        mch: '',
        mchc: '',
        // Labs - Lipid Profile
        total_cholesterol: '',
        ldl: '',
        hdl: '',
        triglycerides: '',
        // Labs - Coagulation
        pt: '',
        inr: '',
        aptt: '',
        fibrinogen: '',
        // Labs - Urinalysis
        urine_ph: '',
        specific_gravity: '',
        urine_protein: '',
        urine_glucose: '',
        urine_blood: '',
        // Labs - General
        fasting_glucose: '',
        hba1c: '',
        tsh: '',
        uric_acid: '',
        // Diagnosis
        diagnosis: '',
        // Special Conditions
        kidney_failure: false,
        liver_failure: false,
        is_pregnant: false,
        is_lactating: false,
        // Medications
        medications: []
    });

    const handleCategoryToggle = (categoryId) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
        } else {
            setSelectedCategories([...selectedCategories, categoryId]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Medication handlers
    const addMedication = () => {
        setFormData({
            ...formData,
            medications: [
                ...formData.medications,
                {
                    drug_name: '', dose: '', frequency: '', route: '',
                    start_date: '', drug_class: '', indication: '',
                    administration: '', regimen: '', cycle: '',
                    status: 'Active', stop_date: '', brand_name: '',
                    dosage_form: 'Tablet', strength: '', unit: 'mg',
                    prescriber_name: '', pharmacy_name: '', notes: ''
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
            bmi: formData.bmi,
            blood_pressure: formData.blood_pressure,
            heart_rate: formData.heart_rate,
            respiratory_rate: formData.respiratory_rate,
            temperature: formData.temperature,
            oxygen_saturation: formData.oxygen_saturation,
        },
        labs: {
            bun: formData.bun, creatinine: formData.creatinine, gfr: formData.gfr,
            sodium: formData.sodium, potassium: formData.potassium, chloride: formData.chloride,
            calcium: formData.calcium, magnesium: formData.magnesium, phosphate: formData.phosphate,
            alt: formData.alt, ast: formData.ast, alp: formData.alp,
            total_bilirubin: formData.total_bilirubin, direct_bilirubin: formData.direct_bilirubin,
            albumin: formData.albumin, total_protein: formData.total_protein,
            wbc_count: formData.wbc_count, rbc_count: formData.rbc_count, hemoglobin: formData.hemoglobin,
            hematocrit: formData.hematocrit, platelet_count: formData.platelet_count,
            mcv: formData.mcv, mch: formData.mch, mchc: formData.mchc,
            total_cholesterol: formData.total_cholesterol, ldl: formData.ldl, hdl: formData.hdl, triglycerides: formData.triglycerides,
            pt: formData.pt, inr: formData.inr, aptt: formData.aptt, fibrinogen: formData.fibrinogen,
            urine_ph: formData.urine_ph, specific_gravity: formData.specific_gravity,
            urine_protein: formData.urine_protein, urine_glucose: formData.urine_glucose, urine_blood: formData.urine_blood,
            fasting_glucose: formData.fasting_glucose, hba1c: formData.hba1c, tsh: formData.tsh, uric_acid: formData.uric_acid,
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
                    ['Vitals:', `Weight: ${formData.weight || '-'} kg, BP: ${formData.blood_pressure || '-'}`],
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

            // --- 3. DRN Assessment ---
            if (drnData && drnData.length > 0) {
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

            // --- 4. Pharmacy Plan ---
            if (planData && planData.length > 0) {
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

            // --- 5. Outcome ---
            if (outcomeData && outcomeData.length > 0) {
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

            // --- 6. Cost ---
            if (costData && costData.length > 0) {
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

                    <div className="flex overflow-x-auto gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm hide-scrollbar">
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
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {activeTab === 'analysis' && (
                            <CDSSDisplay
                                patientData={constructedPatientData}
                                onBack={() => setShowAnalysis(false)}
                                onDataChange={(data) => setCdssData(data)}
                            />
                        )}
                        {activeTab === 'drn' && (
                            <DRNAssessment
                                patientCode={constructedPatientData.id}
                                patientData={constructedPatientData}
                                medicationHistory={constructedPatientData.medication_history}
                                standalone={true}
                                onDataChange={(data) => setDrnData(data)}
                            />
                        )}
                        {activeTab === 'plan' && (
                            <PhAssistPlan
                                patientCode={constructedPatientData.id}
                                patientData={constructedPatientData}
                                standalone={true}
                                onDataChange={(data) => setPlanData(data)}
                            />
                        )}
                        {activeTab === 'outcome' && (
                            <PatientOutcome
                                patientCode={constructedPatientData.id}
                                patientData={constructedPatientData}
                                standalone={true}
                                onDataChange={(data) => setOutcomeData(data)}
                            />
                        )}
                        {activeTab === 'cost' && (
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
            <div className="max-w-4xl mx-auto">
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
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">

                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Which of the following data are you going to fill for the medication review?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {CATEGORIES.map(category => {
                            const isSelected = selectedCategories.includes(category.id);
                            return (
                                <div
                                    key={category.id}
                                    onClick={() => handleCategoryToggle(category.id)}
                                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-blue-200 text-gray-600'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => { }} // Handled by div click
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 pointer-events-none"
                                    />
                                    <category.icon className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                                    <span className="font-medium">{category.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {selectedCategories.length > 0 && (
                    <div className="space-y-6">
                        {/* Demography */}
                        {selectedCategories.includes('demography') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                    <FaUser className="text-blue-500" /> Demography
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* Anthropometry */}
                        {selectedCategories.includes('anthropometry') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                    <FaWeight className="text-green-500" /> Anthropometry
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                                        <input
                                            type="number"
                                            name="bmi"
                                            value={formData.bmi}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="Auto-calculated if omitted"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Vitals */}
                        {selectedCategories.includes('vitals') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                    <FaHeartbeat className="text-red-500" /> Vitals
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                        {/* Labs */}
                        {selectedCategories.includes('labs') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                                    <FaVial className="text-yellow-500" /> Laboratory Tests
                                </h3>
                                <div className="space-y-6">

                                    {/* Renal Function Tests */}
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <h4 className="text-sm font-bold text-blue-800 mb-3 uppercase tracking-wide">🧪 Renal Function Tests</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[{n:'bun',l:'BUN (mg/dL)'},{n:'creatinine',l:'Creatinine (mg/dL)'},{n:'gfr',l:'GFR / eGFR (mL/min)'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="number" step="0.1" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                    {/* Electrolytes */}
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                        <h4 className="text-sm font-bold text-green-800 mb-3 uppercase tracking-wide">⚡ Electrolytes</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[{n:'sodium',l:'Sodium Na+ (mEq/L)'},{n:'potassium',l:'Potassium K+ (mEq/L)'},{n:'chloride',l:'Chloride Cl⁻ (mEq/L)'},{n:'calcium',l:'Calcium Ca²+ (mg/dL)'},{n:'magnesium',l:'Magnesium Mg²+ (mg/dL)'},{n:'phosphate',l:'Phosphate PO₄ (mg/dL)'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="number" step="0.1" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                    {/* Liver Function Tests */}
                                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                        <h4 className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-wide">🫀 Liver Function Tests</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[{n:'alt',l:'ALT (U/L)'},{n:'ast',l:'AST (U/L)'},{n:'alp',l:'ALP (U/L)'},{n:'total_bilirubin',l:'Total Bilirubin (mg/dL)'},{n:'direct_bilirubin',l:'Direct Bilirubin (mg/dL)'},{n:'albumin',l:'Albumin (g/dL)'},{n:'total_protein',l:'Total Protein (g/dL)'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="number" step="0.1" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                    {/* Complete Blood Count / Hematology */}
                                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                        <h4 className="text-sm font-bold text-red-800 mb-3 uppercase tracking-wide">🩸 Complete Blood Count (CBC) / Hematology</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[{n:'wbc_count',l:'WBC (×10³/µL)'},{n:'rbc_count',l:'RBC (×10⁶/µL)'},{n:'hemoglobin',l:'Hemoglobin (g/dL)'},{n:'hematocrit',l:'Hematocrit (%)'},{n:'platelet_count',l:'Platelets (×10³/µL)'},{n:'mcv',l:'MCV (fL)'},{n:'mch',l:'MCH (pg)'},{n:'mchc',l:'MCHC (g/dL)'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="number" step="0.1" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                    {/* Lipid Profile */}
                                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                        <h4 className="text-sm font-bold text-purple-800 mb-3 uppercase tracking-wide">💧 Lipid Profile</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[{n:'total_cholesterol',l:'Total Cholesterol (mg/dL)'},{n:'ldl',l:'LDL (mg/dL)'},{n:'hdl',l:'HDL (mg/dL)'},{n:'triglycerides',l:'Triglycerides (mg/dL)'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="number" step="0.1" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                    {/* Coagulation Tests */}
                                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                        <h4 className="text-sm font-bold text-orange-800 mb-3 uppercase tracking-wide">🩹 Coagulation Tests</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[{n:'pt',l:'PT (seconds)'},{n:'inr',l:'INR'},{n:'aptt',l:'aPTT (seconds)'},{n:'fibrinogen',l:'Fibrinogen (mg/dL)'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="number" step="0.1" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                    {/* Urinalysis */}
                                    <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                                        <h4 className="text-sm font-bold text-cyan-800 mb-3 uppercase tracking-wide">🧫 Urinalysis</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[{n:'urine_ph',l:'pH'},{n:'specific_gravity',l:'Specific Gravity'},{n:'urine_protein',l:'Protein'},{n:'urine_glucose',l:'Glucose'},{n:'urine_blood',l:'Blood'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="text" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                    {/* General */}
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">📋 General</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[{n:'fasting_glucose',l:'Fasting Glucose (mg/dL)'},{n:'hba1c',l:'HbA1c (%)'},{n:'tsh',l:'TSH (mIU/L)'},{n:'uric_acid',l:'Uric Acid (mg/dL)'}].map(f=><div key={f.n}><label className="block text-xs font-medium text-gray-700 mb-1">{f.l}</label><input type="number" step="0.1" name={f.n} value={formData[f.n]} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" /></div>)}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Diagnosis */}
                        {selectedCategories.includes('diagnosis') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                    <FaNotesMedical className="text-indigo-500" /> Diagnosis
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary/Secondary Diagnosis</label>
                                    <textarea
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                                        placeholder="e.g. Hypertension, Type 2 Diabetes"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* Special Conditions */}
                        {selectedCategories.includes('special_conditions') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                    <FaExclamationCircle className="text-orange-500" /> Special Conditions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                        {/* Medications */}
                        {selectedCategories.includes('medications') && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <FaPills className="text-purple-500" /> Medications
                                    </h3>
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
                                    <div className="space-y-4">
                                        {formData.medications.map((med, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                                                <button
                                                    onClick={() => removeMedication(index)}
                                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm hover:shadow"
                                                    title="Remove medication"
                                                >
                                                    <FaTimes className="w-3 h-3" />
                                                </button>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                    {/* Row 1: Core details */}
                                                    <div className="col-span-1 md:col-span-2">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Drug Name / Brand Name</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={med.drug_name}
                                                                onChange={(e) => updateMedication(index, 'drug_name', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Generic Name *"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={med.brand_name}
                                                                onChange={(e) => updateMedication(index, 'brand_name', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Brand Name"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Drug Class</label>
                                                        <input
                                                            type="text"
                                                            value={med.drug_class}
                                                            onChange={(e) => updateMedication(index, 'drug_class', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                            placeholder="e.g. Beta Blocker"
                                                        />
                                                    </div>
                                                    
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Indication</label>
                                                        <input
                                                            type="text"
                                                            value={med.indication}
                                                            onChange={(e) => updateMedication(index, 'indication', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                            placeholder="Reason for use"
                                                        />
                                                    </div>
                                                    
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                                        <select
                                                            value={med.status}
                                                            onChange={(e) => updateMedication(index, 'status', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500 bg-white"
                                                        >
                                                            <option value="Active">Active</option>
                                                            <option value="Discontinued">Discontinued</option>
                                                            <option value="On Hold">On Hold</option>
                                                            <option value="Completed">Completed</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Row 2: Dosage and Admin */}
                                                    <div className="col-span-1 md:col-span-2">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Dose / Strength / Unit</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={med.dose}
                                                                onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                                                                className="w-1/3 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Dose"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={med.strength}
                                                                onChange={(e) => updateMedication(index, 'strength', e.target.value)}
                                                                className="w-1/3 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Strength"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={med.unit}
                                                                onChange={(e) => updateMedication(index, 'unit', e.target.value)}
                                                                className="w-1/3 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Unit (mg)"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-span-1">
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
                                                    
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Route & Admin</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={med.route}
                                                                onChange={(e) => updateMedication(index, 'route', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Route (PO)"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={med.administration}
                                                                onChange={(e) => updateMedication(index, 'administration', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Admin"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency & Regimen</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={med.frequency}
                                                                onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Freq (BID)"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={med.regimen}
                                                                onChange={(e) => updateMedication(index, 'regimen', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Regimen"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Row 3: Timeline & Provider */}
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                                        <input
                                                            type="date"
                                                            value={med.start_date}
                                                            onChange={(e) => updateMedication(index, 'start_date', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                    
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Stop Date</label>
                                                        <input
                                                            type="date"
                                                            value={med.stop_date}
                                                            onChange={(e) => updateMedication(index, 'stop_date', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                    
                                                    <div className="col-span-1">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Cycle</label>
                                                        <input
                                                            type="text"
                                                            value={med.cycle}
                                                            onChange={(e) => updateMedication(index, 'cycle', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                            placeholder="Cycle details"
                                                        />
                                                    </div>
                                                    
                                                    <div className="col-span-1 md:col-span-2">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Prescriber / Pharmacy</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={med.prescriber_name}
                                                                onChange={(e) => updateMedication(index, 'prescriber_name', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Prescriber Name"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={med.pharmacy_name}
                                                                onChange={(e) => updateMedication(index, 'pharmacy_name', e.target.value)}
                                                                className="w-1/2 p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                                placeholder="Pharmacy Name"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Row 4: Notes */}
                                                    <div className="col-span-1 md:col-span-5">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Clinical Notes</label>
                                                        <input
                                                            type="text"
                                                            value={med.notes}
                                                            onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                                                            placeholder="Additional clinical notes about this medication..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end pt-4 pb-12">
                            <button
                                onClick={handleRunAnalysis}
                                disabled={selectedCategories.length === 0}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all text-lg ${selectedCategories.length > 0
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:-translate-y-1'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <FaPlay /> Run Clinical Analysis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalPharmacyTool;
