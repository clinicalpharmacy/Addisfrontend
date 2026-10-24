// Clinical Display Component - v3.0.0
import React, { useState } from 'react';
import { useCDSSLogic } from '../../hooks/useCDSSLogic';
import { AlertDetails } from './AlertComponents';
import { getRuleTypeInfo, getTimeAgo, getAgeCategoryIcon, getAgeCategoryLabel } from '../../utils/cdssUtils';
import {
    FaBell, FaExclamationTriangle, FaCheckCircle, FaInfoCircle,
    FaUserMd, FaFilter, FaSync, FaDownload,
    FaDatabase, FaEye, FaEyeSlash,
    FaClock, FaUser, FaCapsules, FaRedo, FaRocket,
    FaCalendarDay, FaUserTag, FaVial, FaBaby, FaChevronDown, FaChevronUp,
    FaExclamationCircle, FaHeartbeat, FaBrain, FaRobot, FaLightbulb, FaUserShield,
    FaBookMedical, FaListUl, FaToggleOn, FaToggleOff, FaShieldAlt, FaSearch,
    FaStar, FaMagic, FaClipboardCheck, FaExternalLinkAlt
} from 'react-icons/fa';
import api from '../../utils/api';
import FormattedDosageView from './FormattedDosageView';

const CDSSDisplay = ({ patientData, onBack, onDataChange }) => {

    const {
        alerts, filteredAlerts, loading, analysisStats,
        clinicalRules, medications, analysisError, testResults,
        severityFilter, setSeverityFilter,
        fetchClinicalRules, testSampleRules, analyzePatient, runFullAnalysis,
        acknowledgeAlert, acknowledgeAll, toggleExpandAlert, expandedAlert,
        patientFacts, lastAnalysisTime, decryptedPatient, decryptionFailed,
        dailyMedLabels = [], dailyMedLoading = false
    } = useCDSSLogic(patientData);

    const [expandedDailyMeds, setExpandedDailyMeds] = useState({});
    const toggleDailyMedExpand = (drug) => {
        setExpandedDailyMeds(prev => ({
            ...prev,
            [drug]: !prev[drug]
        }));
    };

    // Pass alerts up to parent for PDF generation
    React.useEffect(() => {
        if (onDataChange && alerts) {
            onDataChange(alerts);
        }
    }, [alerts, onDataChange]);

    const rawUserRole = localStorage.getItem('userRole') || 'admin';
    const userRole = rawUserRole.toLowerCase().trim();
    const isHealthcareClient = userRole === 'healthcare_client';

    const severityColors = {
        critical: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
        high: 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100',
        moderate: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
        low: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
    };

    const severityIcons = {
        critical: FaExclamationTriangle,
        high: FaExclamationTriangle,
        moderate: FaExclamationCircle,
        low: FaInfoCircle
    };

    const severityBgColors = {
        critical: 'bg-red-500',
        high: 'bg-orange-500',
        moderate: 'bg-yellow-500',
        low: 'bg-blue-500'
    };

    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);

    const handleRunAI = async () => {
        if (!patientData && !decryptedPatient) return;

        try {
            setAiLoading(true);
            setAiError(null);

            const patient = decryptedPatient || patientData;

            // Make sure medications are extracted properly
            const medsList = (medications && medications.length > 0)
                ? medications
                : (patient?.medications || patient?.medication_history || []);

            const formattedMeds = Array.isArray(medsList)
                ? medsList.map(m => {
                    if (typeof m === 'string') return { name: m, dose: '' };
                    return {
                        name: m.drug_name || m.name || m.drug || '',
                        dose: `${m.dose || ''} ${m.frequency || ''}`.trim()
                    };
                }).filter(m => m.name)
                : [];

            const conditionsList = [];
            if (patient?.diagnosis) {
                if (Array.isArray(patient.diagnosis)) conditionsList.push(...patient.diagnosis);
                else conditionsList.push(patient.diagnosis);
            }
            if (patient?.conditions && Array.isArray(patient.conditions)) {
                conditionsList.push(...patient.conditions);
            }

            const analysisData = {
                age: patient?.age,
                sex: patient?.gender,
                pregnancy: patient?.is_pregnant,
                conditions: conditionsList,
                medications: formattedMeds,
                dailymed_guidelines: (dailyMedLabels || []).filter(l => l.found).map(l => ({
                    drug: l.query_drug,
                    title: l.label?.label_title,
                    status: l.label?.review_status,
                    dosage_text: l.label?.dosage_text?.slice(0, 1000)
                })),
                labs: patient?.labs || {},
                vitals: {
                    bp: patient?.vitals?.blood_pressure || patient?.blood_pressure,
                    hr: patient?.vitals?.heart_rate || patient?.heart_rate,
                    temp: patient?.vitals?.temperature || patient?.temperature,
                    rr: patient?.vitals?.respiratory_rate || patient?.respiratory_rate,
                    spo2: patient?.vitals?.oxygen_saturation || patient?.oxygen_saturation
                },
                age_category: patientFacts?.patient_type || 'adult'
            };

            console.log("🤖 [CDSSDisplay] Calling Gemini AI:", analysisData);
            const result = await api.post('/ai/cdss-analysis', analysisData);
            console.log("🤖 [CDSSDisplay] Gemini AI Response:", result);

            if (result.success && result.analysis) {
                setAiAnalysis(result.analysis);
            } else {
                setAiError(result.error || "Failed to get AI analysis");
            }
        } catch (err) {
            console.error("🤖 [CDSSDisplay] AI Error:", err);
            setAiError(err?.error || err?.message || "Something went wrong with the AI assistant.");
        } finally {
            setAiLoading(false);
        }
    };

    const formatEncValue = (val, fallback = 'Not specified') => {
        if (!val) return fallback;
        const strVal = String(val);
        if (strVal.includes(':') && strVal.length > 30) return '[Encrypted]';
        return val;
    };

    const downloadReport = async () => {
        if (!patientData) return;

        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');

            const doc = jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('CLINICAL ANALYSIS REPORT', 15, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 30);
            doc.text(`Patient ID: ${patientData.id}`, 15, 35);

            doc.setTextColor(31, 41, 55);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Patient Information', 15, 50);

            doc.setDrawColor(229, 231, 235);
            doc.line(15, 52, 195, 52);

            autoTable(doc, {
                startY: 55,
                head: [],
                body: [
                    ['Full Name:', patientData.full_name || 'N/A', 'Gender:', patientData.gender || 'N/A'],
                    ['Age:', `${patientData.age || 'N/A'} (${patientFacts?.patient_type || 'N/A'})`, 'Primary Diagnosis:', patientData.diagnosis || 'None recorded']
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: {
                    0: { fontStyle: 'bold', width: 30 },
                    2: { fontStyle: 'bold', width: 40 }
                }
            });

            let currentY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Analysis Summary', 15, currentY);
            doc.line(15, currentY + 2, 195, currentY + 2);

            const statsData = [
                ['Total Alerts', analysisStats?.alertsGenerated || 0],
                ['Critical', analysisStats?.bySeverity?.critical || 0],
                ['High Severity', analysisStats?.bySeverity?.high || 0],
                ['Moderate/Low', (analysisStats?.bySeverity?.moderate || 0) + (analysisStats?.bySeverity?.low || 0)]
            ];

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Parameter', 'Count']],
                body: statsData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 }
            });

            if (medications && medications.length > 0) {
                currentY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Current Medications', 15, currentY);

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['#', 'Drug Name', 'Class', 'Dose/Frequency']],
                    body: medications.map((m, i) => [
                        i + 1,
                        m.drug_name,
                        m.drug_class || 'N/A',
                        `${m.dose || ''} ${m.frequency || ''}`
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [107, 114, 128] },
                    styles: { fontSize: 8 }
                });
            }

            currentY = doc.lastAutoTable.finalY + 10;
            if (currentY > 250) { doc.addPage(); currentY = 20; }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Clinical Alerts & Recommendations', 15, currentY);

            const alertRows = alerts.map((alert, index) => {
                const finding = isHealthcareClient
                    ? (alert.client_message || alert.message)
                    : (alert.professional_message || alert.message);
                const drugTriggers = alert.evidence?.matched_medications?.length > 0
                    ? alert.evidence.matched_medications.join(', ')
                    : 'None';
                const recommendation = (isHealthcareClient
                    ? (alert.client_recommendation || alert.details)
                    : (alert.professional_recommendation || alert.details)) || 'Review clinical guidelines';

                return [index + 1, finding, drugTriggers, recommendation];
            });

            autoTable(doc, {
                startY: currentY + 5,
                head: [['#', 'Finding', 'Drug(s) Trigger', 'Evidence Recommendation']],
                body: alertRows,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] },
                styles: { fontSize: 7, cellPadding: 3 },
                columnStyles: {
                    0: { width: 10 },
                    1: { width: 60 },
                    2: { width: 40 },
                    3: { width: 70 }
                }
            });

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

            doc.save(`Clinical_Analysis_${patientData.id}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('PDF generation failed. Library error.');
        }
    };

    const AgeCategoryIcon = getAgeCategoryIcon(patientFacts);

    const [hasAcknowledged, setHasAcknowledged] = useState(sessionStorage.getItem('clinical_ai_acknowledged') === 'true');

    const handleAcknowledge = () => {
        sessionStorage.setItem('clinical_ai_acknowledged', 'true');
        setHasAcknowledged(true);
    };

    if (!hasAcknowledged) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">User Acknowledgment</h2>
                <div className="bg-blue-50 border-1 border-blue-200 p-6 rounded-2xl mb-8 max-w-2xl mx-auto">
                    <p className="text-gray-700 text-lg leading-relaxed">
                        <span className="block">"By continuing, you acknowledge that this supportive clinical information does not replace consultation with a licensed healthcare professional."</span>
                        <span className="block font-bold text-blue-800 text-base border-t border-blue-200 pt-4">"በመቀጠልዎ፤ ይህ መልዕክት ፈቃድ ካለው የጤና ባለሙያ ጋር የሚደረገውን የማማከር አገልግሎት የማይተካ መሆኑን ይስማማሉ።"</span>
                    </p>
                </div>
                <button
                    onClick={handleAcknowledge}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                    <FaCheckCircle />
                    <span>Accept & Continue</span>
                    <span className="border-l border-blue-400 pl-2">ተቀብያለሁ እናም ይቀጥል</span>
                </button>
            </div>
        );
    }

    // --- Summary counts ---
    const criticalCount = analysisStats?.bySeverity?.critical || 0;
    const highCount = analysisStats?.bySeverity?.high || 0;
    const moderateCount = analysisStats?.bySeverity?.moderate || 0;
    const lowCount = analysisStats?.bySeverity?.low || 0;
    const totalAlerts = alerts.length;
    const hasAlerts = totalAlerts > 0;
    const hasFilteredResults = filteredAlerts.length > 0;

    return (
        <div className="space-y-5">

            {/* ── Header Card ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="min-w-0">
                            {decryptedPatient || patientData ? (
                                <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-0.5">
                                    <span className="font-semibold text-gray-700 truncate">
                                        {formatEncValue((decryptedPatient || patientData).full_name, 'MR Profile')}
                                    </span>
                                    {decryptionFailed && (
                                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                            <FaEyeSlash size={10} /> Profile Locked
                                        </span>
                                    )}
                                    {lastAnalysisTime && (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                <FaClock className="text-xs" />
                                                Run: {getTimeAgo ? getTimeAgo(lastAnalysisTime) : new Date(lastAnalysisTime).toLocaleTimeString()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Retrieving patient record...</p>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button
                            onClick={fetchClinicalRules}
                            className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm border border-gray-200 transition-colors font-medium"
                            title="Refresh Clinical Analysis"
                        >
                            <FaSync className={loading ? 'animate-spin' : ''} />
                            <span>Refresh Clinical Analysis</span>
                        </button>

                        <button
                            onClick={handleRunAI}
                            disabled={aiLoading || !patientData}
                            className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-all font-medium"
                            title="Run AI Clinical Assistant"
                        >
                            {aiLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                                <FaRobot />
                            )}
                            <span>{aiLoading ? 'AI Analyzing...' : 'Run AI Clinical Assistant'}</span>
                        </button>

                        {hasAlerts && (
                            <button
                                onClick={downloadReport}
                                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-all font-medium"
                                title="Export PDF Report"
                            >
                                <FaDownload />
                                <span className="hidden sm:inline">Export PDF</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Test Results Banner ── */}
            {testResults && (
                <div className={`p-4 rounded-xl ${testResults.passed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                        {testResults.passed
                            ? <FaCheckCircle className="text-green-600" />
                            : <FaInfoCircle className="text-yellow-600" />
                        }
                        <span className={`font-semibold ${testResults.passed ? 'text-green-700' : 'text-yellow-700'}`}>
                            {testResults.passed ? 'Age-in-Days Rules Test Passed!' : 'Age-in-Days Rules Test'}
                        </span>
                    </div>
                    <p className={`text-sm mt-1 ${testResults.passed ? 'text-green-600' : 'text-yellow-600'}`}>
                        {testResults.message}
                    </p>
                </div>
            )}

            {/* ── Error Display ── */}
            {analysisError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                        <FaExclamationTriangle />
                        <span className="font-semibold">Analysis Error</span>
                    </div>
                    <p className="text-red-600 text-sm">{analysisError}</p>
                    <button
                        onClick={analyzePatient}
                        className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* ── AI Clinical Assistant Loading Banner ── */}
            {aiLoading && (
                <div className="p-6 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border-2 border-dashed border-purple-300 text-center shadow-sm animate-pulse">
                    <FaBrain className="text-4xl text-purple-600 mx-auto mb-3 animate-bounce" />
                    <h4 className="text-base font-bold text-purple-900">Gemini AI Clinical Assistant Analyzing...</h4>
                    <p className="text-xs text-purple-600 mt-1 max-w-md mx-auto">
                        Evaluating drug-drug interactions, contraindications, special population safety, and clinical guidelines. Please wait...
                    </p>
                </div>
            )}

            {/* ── AI Clinical Assistant Error ── */}
            {aiError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 text-red-800">
                    <div className="flex items-start gap-2.5">
                        <FaExclamationTriangle className="text-red-600 mt-0.5 shrink-0" />
                        <div>
                            <span className="font-bold text-sm block">AI Clinical Assistant Error</span>
                            <span className="text-xs text-red-600">{aiError}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleRunAI}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition"
                    >
                        Retry AI
                    </button>
                </div>
            )}

            {/* ── AI Clinical Assistant Results ── */}
            {aiAnalysis && (
                <div className="bg-gradient-to-br from-purple-50/70 via-indigo-50/40 to-white rounded-2xl border border-purple-200 shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-4 text-white flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <FaRobot className="text-xl text-purple-100" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base tracking-wide">Gemini AI Clinical Assistant</h3>
                                    <span className="bg-purple-500/50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300/30">
                                        Generative Reasoning
                                    </span>
                                </div>
                                <p className="text-xs text-purple-200">
                                    Independent AI evidence evaluation — Clinical Pharmacist verification required
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRunAI}
                                disabled={aiLoading}
                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-white/20"
                                title="Re-run AI Analysis"
                            >
                                <FaRedo className={`text-xs ${aiLoading ? 'animate-spin' : ''}`} /> Re-run AI
                            </button>
                            <button
                                onClick={() => setAiAnalysis(null)}
                                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition border border-white/20"
                                title="Dismiss AI Results"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Summary */}
                        {aiAnalysis.summary && (
                            <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                <h4 className="text-xs font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5 mb-2">
                                    <FaLightbulb className="text-purple-600" /> Clinical Overview & Summary
                                </h4>
                                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                    {aiAnalysis.summary}
                                </p>
                            </div>
                        )}

                        {/* Grid: DTPs & Monitoring */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* DTPs */}
                            {aiAnalysis.dtp?.length > 0 && (
                                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                        <FaExclamationTriangle className="text-red-500" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-red-800">
                                            Identified Drug Therapy Problems ({aiAnalysis.dtp.length})
                                        </h4>
                                    </div>
                                    <div className="space-y-2.5">
                                        {aiAnalysis.dtp.map((dtp, idx) => (
                                            <div key={idx} className="p-3 bg-red-50/60 rounded-lg border border-red-100 space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-red-900 bg-red-200/70 px-2 py-0.5 rounded">
                                                        {dtp.category || 'Drug Problem'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-800">{dtp.problem}</p>
                                                {dtp.recommendation && (
                                                    <div className="text-xs text-green-900 bg-green-50/80 p-2 rounded border border-green-200 flex items-start gap-1.5 mt-1">
                                                        <FaCheckCircle className="text-green-600 mt-0.5 shrink-0" />
                                                        <span><strong>Recommendation:</strong> {dtp.recommendation}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dose Adjustments & Monitoring */}
                            <div className="space-y-4">
                                {aiAnalysis.dose_adjustments?.length > 0 && (
                                    <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                            <FaCapsules className="text-amber-600" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                                                Dose Adjustments Suggested ({aiAnalysis.dose_adjustments.length})
                                            </h4>
                                        </div>
                                        <div className="space-y-2">
                                            {aiAnalysis.dose_adjustments.map((da, idx) => (
                                                <div key={idx} className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100 text-xs">
                                                    <div className="font-bold text-amber-900">{da.medication}</div>
                                                    <div className="text-gray-700 mt-0.5"><strong>Reason:</strong> {da.reason}</div>
                                                    <div className="text-amber-800 mt-0.5"><strong>Suggested:</strong> {da.suggested_dose}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {aiAnalysis.monitoring?.length > 0 && (
                                    <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                            <FaHeartbeat className="text-blue-500" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-blue-800">
                                                Recommended Clinical Monitoring
                                            </h4>
                                        </div>
                                        <ul className="space-y-1.5 text-xs text-blue-950">
                                            {aiAnalysis.monitoring.map((m, idx) => (
                                                <li key={idx} className="flex items-start gap-2 bg-blue-50/50 p-2 rounded border border-blue-100">
                                                    <span className="text-blue-500 font-bold">•</span>
                                                    <span>{m}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Citations */}
                        {aiAnalysis.citations?.length > 0 && (
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                                <span className="font-bold uppercase tracking-wider text-gray-500 block">References / Citations:</span>
                                <div className="flex flex-wrap gap-2">
                                    {aiAnalysis.citations.map((c, idx) => (
                                        <span key={idx} className="bg-white px-2 py-0.5 rounded border border-gray-200">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Alerts Section ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Alerts toolbar */}
                {hasAlerts && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-1.5 rounded-lg">
                                <FaExclamationTriangle className="text-white text-sm" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-700">
                                Clinical Alerts
                                <span className="ml-2 bg-red-100 text-red-700 text-xs font-black px-1.5 py-0.5 rounded-full border border-red-200">
                                    {alerts.length}
                                </span>
                            </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={acknowledgeAll}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors"
                            >
                                <FaClipboardCheck /> Mark all reviewed
                            </button>
                            <div className="flex items-center gap-2">
                                <FaFilter className="text-gray-400 text-xs" />
                                <select
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 font-medium"
                                >
                                    <option value="all">All Severities</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content area */}
                <div className="p-5">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium mb-1">Running clinical analysis…</p>
                            <p className="text-gray-400 text-sm">Evaluating {clinicalRules.length} active rules</p>
                        </div>
                    ) : !patientData ? (
                        <div className="text-center py-16">
                            <FaUser className="text-5xl text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium mb-1">No patient selected</p>
                            <p className="text-gray-400 text-sm">Select a patient to run clinical analysis</p>
                        </div>
                    ) : !hasAlerts ? (
                        /* ── Clean slate — no DRPs ── */
                        <div className="text-center py-14 border-2 border-dashed border-green-200 rounded-xl bg-green-50/40">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCheckCircle className="text-green-500 text-2xl" />
                            </div>
                            <p className="text-gray-700 text-lg font-bold mb-1">No drug-related problems detected</p>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                The patient's current medication profile appears safe based on {clinicalRules.length} active clinical rules.
                            </p>
                        </div>
                    ) : !hasFilteredResults ? (
                        /* ── Filter returned nothing ── */
                        <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaSearch className="text-gray-400 text-xl" />
                            </div>
                            <p className="text-gray-600 font-semibold mb-1">No issues found matching current filter</p>
                            <p className="text-gray-400 text-sm mb-4">
                                Try changing the severity filter or view all alerts.
                            </p>
                            <button
                                onClick={() => setSeverityFilter('all')}
                                className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline"
                            >
                                Show all {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
                            </button>
                        </div>
                    ) : (
                        /* ── Alerts list ── */
                        <div className="space-y-4">
                            {filteredAlerts.map((alert) => {
                                const SeverityIcon = severityIcons[alert.severity] || FaBell;
                                const severityColor = severityColors[alert.severity];
                                const severityBgColor = severityBgColors[alert.severity];
                                const ruleTypeInfo = getRuleTypeInfo(alert.rule_type);

                                return (
                                    <div
                                        key={alert.id}
                                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${severityColor} ${alert.acknowledged ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            {/* Primary Finding */}
                                            <div className="flex flex-col gap-2.5 p-4 bg-gray-50/90 rounded-xl border border-gray-200 mb-3 shadow-sm">
                                                <div className="flex items-start gap-2.5">
                                                    <span className="font-black text-blue-700 uppercase text-xs md:text-sm shrink-0 bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-200">Finding:</span>
                                                    <p className="font-semibold text-base md:text-lg text-slate-900 leading-relaxed">
                                                        {isHealthcareClient ? (alert.client_message || alert.message) : (alert.professional_message || alert.message)}
                                                    </p>
                                                </div>
                                            
                                                {/* Drug triggers */}
                                                {alert.evidence?.matched_medications?.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-gray-300/60 mt-1">
                                                        <span className="font-black text-purple-700 uppercase text-xs md:text-sm shrink-0">Drug(s) Trigger:</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {alert.evidence.matched_medications.map((med, i) => (
                                                                <span key={i} className="px-3 py-1 bg-purple-100 text-purple-900 rounded-lg text-sm font-black border border-purple-300 shadow-xs flex items-center gap-1.5">
                                                                    <FaCapsules className="text-sm" /> {med}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            
                                                {/* Recommendation */}
                                                <div className="bg-emerald-50 border-l-8 border-emerald-500 p-4 rounded-r-xl shadow-xs mt-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FaCheckCircle className="text-emerald-600 text-sm md:text-base" />
                                                        <span className="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-800">Evidence Recommendation</span>
                                                    </div>
                                                    <div className="text-base md:text-lg font-black text-slate-950 leading-relaxed whitespace-pre-wrap">
                                                        {(isHealthcareClient
                                                            ? (alert.client_recommendation || alert.recommendation || alert.details)
                                                            : (alert.professional_recommendation || alert.recommendation || alert.details)) || 'Review clinical guidelines'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── DailyMed FDA Dosage & Administration Repository Section ── */}
            {patientData && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-200 bg-gradient-to-r from-blue-100/90 via-indigo-50 to-blue-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-xs">
                                <FaBookMedical className="text-lg" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-xl font-black text-slate-950 flex items-center gap-2.5">
                                    Official FDA DailyMed Monograph (Uses, Dosage, Warnings & Ingredients)
                                    {dailyMedLabels.length > 0 && (
                                        <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                                            {dailyMedLabels.filter(l => l.found).length} Available
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs md:text-sm text-slate-600 font-medium mt-0.5">
                                    Official FDA-approved prescribing information, indications, dosage, warnings & excipients
                                </p>
                            </div>
                        </div>

                        {dailyMedLoading && (
                            <div className="flex items-center gap-2 text-sm text-blue-700 font-bold bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs self-start sm:self-auto">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                <span>Fetching FDA Labels...</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        {dailyMedLoading && dailyMedLabels.length === 0 ? (
                            <div className="py-8 text-center text-base text-gray-600 flex flex-col items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                <span className="font-medium">Querying DailyMed FDA repository for patient's prescribed medications...</span>
                            </div>
                        ) : dailyMedLabels.length === 0 ? (
                            <p className="text-base text-gray-500 italic py-3">
                                No active medications found to query in DailyMed.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {dailyMedLabels.map((item, idx) => {
                                    const isExpanded = !!expandedDailyMeds[item.query_drug];
                                    const isApproved = item.label?.review_status === 'approved';

                                    return (
                                        <div
                                            key={idx}
                                            className={`rounded-2xl border-2 transition-all shadow-xs ${
                                                item.found 
                                                    ? 'bg-white border-gray-300 hover:border-blue-400' 
                                                    : 'bg-amber-50/60 border-amber-300'
                                            }`}
                                        >
                                            <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="font-black text-slate-950 text-xl md:text-2xl">
                                                            {item.query_drug}
                                                        </span>
                                                        {item.original_input && item.original_input !== item.query_drug && (
                                                            <span className="text-sm text-slate-500 font-semibold">
                                                                (prescribed: {item.original_input})
                                                            </span>
                                                        )}
                                                        {item.found && (
                                                            <span className={`text-xs md:text-sm font-black px-3 py-1 rounded-full border ${
                                                                isApproved 
                                                                    ? 'bg-green-100 text-green-900 border-green-300' 
                                                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                                                            }`}>
                                                                {isApproved ? 'Reviewed & Approved' : 'FDA Label (Official SPL)'}
                                                            </span>
                                                        )}
                                                        {item.source === 'dailymed_ondemand' && (
                                                            <span className="text-xs md:text-sm bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 font-bold">
                                                                Live FDA Retrieved
                                                            </span>
                                                        )}
                                                    </div>

                                                    {item.found ? (
                                                        <div className="text-sm md:text-base text-slate-700 leading-normal" title={item.label?.label_title}>
                                                            <strong className="text-slate-950 font-bold">Official SPL:</strong> {item.label?.label_title}
                                                        </div>
                                                    ) : (
                                                        <div className="text-base text-amber-900 font-semibold">
                                                            {item.message || 'No official DailyMed FDA label found for this medication.'}
                                                        </div>
                                                    )}
                                                </div>

                                                {item.found && (
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {item.label?.source_url && (
                                                            <a
                                                                href={item.label.source_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-base text-blue-700 hover:text-blue-900 bg-white border-2 border-gray-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-xs"
                                                                title="View on DailyMed"
                                                            >
                                                                <span>FDA DailyMed</span>
                                                                <FaExternalLinkAlt className="text-xs" />
                                                            </a>
                                                        )}

                                                        <button
                                                            onClick={() => toggleDailyMedExpand(item.query_drug)}
                                                            className="text-base text-slate-900 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 px-5 py-2.5 rounded-xl font-black transition-colors flex items-center gap-2.5 shadow-xs"
                                                        >
                                                            <span>{isExpanded ? 'Hide Harm & Warning Analysis' : 'Check FDA Patient Warnings & Harm Risks'}</span>
                                                            {isExpanded ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Collapsible Patient Harm & Safety Section */}
                                            {item.found && isExpanded && (
                                                <div className="px-6 pb-6 pt-5 border-t-2 border-gray-300 bg-slate-50/70 rounded-b-2xl">
                                                    <div className="text-base md:text-lg font-black text-slate-950 mb-4 flex items-center gap-2.5">
                                                        <FaShieldAlt className="text-red-600 text-lg" />
                                                        <span>FDA Patient Safety & Harm Analysis (Contraindications, Warnings & Adverse Risks):</span>
                                                    </div>
                                                    <FormattedDosageView text={item.label?.dosage_text} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {onBack && (
                <div className="flex justify-center pb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all border border-gray-200 shadow-sm"
                    >
                        <FaSync className="rotate-180" />
                        Back to Case Selection
                    </button>
                </div>
            )}
        </div>
    );
};

export default CDSSDisplay;
