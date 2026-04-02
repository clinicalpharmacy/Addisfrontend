// Clinical Display Component - v2.1.0 (Gemini Integration)
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
    FaExclamationCircle, FaHeartbeat, FaBrain, FaRobot, FaLightbulb, FaShieldAlt,
    FaBookMedical, FaListUl, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import api from '../../utils/api';

const CDSSDisplay = ({ patientData, onBack }) => {

    const {
        alerts, filteredAlerts, loading, analysisStats,
        clinicalRules, medications, analysisError, testResults,
        severityFilter, setSeverityFilter,
        fetchClinicalRules, testSampleRules, analyzePatient,
        acknowledgeAlert, acknowledgeAll, toggleExpandAlert, expandedAlert,
        patientFacts
    } = useCDSSLogic(patientData);

    console.log("🛠️ CDSSDisplay Render - patientData:", patientData);
    console.log("🛠️ CDSSDisplay Render - clinicalRules:", clinicalRules?.length);
    console.log("🛠️ CDSSDisplay Render - alerts:", alerts?.length);
    console.log('💊 useCDSSLogic initialized with patientData:', patientData?.id);



    const rawUserRole = localStorage.getItem('userRole') || 'admin';
    const userRole = rawUserRole.toLowerCase().trim();
    const isHealthcareClient = userRole === 'healthcare_client';

    console.log("🛠️ CDSSDisplay Auth Status - User Role:", userRole, "isHealthcareClient:", isHealthcareClient);

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

            // --- HEADER DESIGN ---
            doc.setFillColor(37, 99, 235); // Blue-600
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('CLINICAL ANALYSIS REPORT', 15, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 30);
            doc.text(`Patient ID: ${patientData.id}`, 15, 35);

            // --- PATIENT SUMMARY SECTION ---
            doc.setTextColor(31, 41, 55); // Gray-800
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Patient Information', 15, 50);

            doc.setDrawColor(229, 231, 235); // Gray-200
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

            // --- ANALYSIS STATS ---
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
                headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
                styles: { fontSize: 9 }
            });

            // --- MEDICATIONS TABLE ---
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
                    headStyles: { fillColor: [107, 114, 128] }, // Gray-500
                    styles: { fontSize: 8 }
                });
            }

            // --- CLINICAL ALERTS TABLE ---
            currentY = doc.lastAutoTable.finalY + 10;
            if (currentY > 250) { doc.addPage(); currentY = 20; }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Clinical Alerts & Recommendations', 15, currentY);

            const alertRows = alerts.map((alert, index) => {
                // Get the finding/message (this is the primary clinical finding)
                const finding = isHealthcareClient 
                    ? (alert.client_message || alert.message) 
                    : (alert.professional_message || alert.message);
                
                // Get drug triggers (medications that triggered this alert)
                const drugTriggers = alert.evidence?.matched_medications?.length > 0 
                    ? alert.evidence.matched_medications.join(', ')
                    : 'None';
                
                // Get evidence recommendation (clinical recommendation)
                const recommendation = (isHealthcareClient 
                    ? (alert.client_recommendation || alert.details) 
                    : (alert.professional_recommendation || alert.details)) || 'Review clinical guidelines';

                return [
                    index + 1,
                    finding,
                    drugTriggers,
                    recommendation
                ];
            });

            autoTable(doc, {
                startY: currentY + 5,
                head: [['#', 'Finding', 'Drug(s) Trigger', 'Evidence Recommendation']],
                body: alertRows,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] }, // Red-600
                styles: { fontSize: 7, cellPadding: 3 },
                columnStyles: {
                    0: { width: 10 },  // # column
                    1: { width: 60 },  // Finding column
                    2: { width: 40 },  // Drug(s) Trigger column
                    3: { width: 70 }   // Evidence Recommendation column
                }
            });

            // --- FOOTER ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text(
                    'DISCLAIMER: This clinical analysis report only gives informaton & it cannot replace the decision of health professional.',
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

    const [hasAcknowledged, setHasAcknowledged] = useState(false);

    console.log("🛠️ CDSSDisplay - hasAcknowledged:", hasAcknowledged);

    if (!hasAcknowledged) {
        console.log("🛠️ Rendering Acknowledgment Screen");
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaShieldAlt className="text-blue-600 text-4xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">User Acknowledgment</h2>
                <div className="bg-blue-50 border-1 border-blue-200 p-6 rounded-2xl mb-8 max-w-2xl mx-auto">
                    <p className="text-gray-700 text-lg leading-relaxed">
                        <span className="block">“By continuing, you acknowledge that this supportive clinical information does not replace consultation with a licensed healthcare professional.”</span>
                        <span className="block font-bold text-blue-800 text-base border-t border-blue-200 pt-4">“በመቀጠልዎ፤ ይህ መልዕክት ፈቃድ ካለው የጤና ባለሙያ ጋር የሚደረገውን የማማከር አገልግሎት የማይተካ መሆኑን ይስማማሉ።”</span>
                    </p>
                </div>
                <button
                    onClick={() => {
                        console.log("🛠️ Accept button clicked!");
                        setHasAcknowledged(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                    <FaCheckCircle />
                    <span>Accept & Continue</span>
                    <span className="border-l border-blue-400 pl-2">ተቀብያለሁ እናም ይቀጥል</span>
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full shrink-0">
                        <FaBell className="text-white text-xl" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Clinical Analysis</h2>
                        {patientData ? (
                            <div className="text-sm text-gray-600 flex flex-wrap items-center gap-2 mt-1">
                                <span className="font-semibold">{patientData.full_name}</span>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">Select a patient</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={fetchClinicalRules}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm border border-gray-200 transition-colors"
                        title="Refresh Analysis"
                    >
                        <FaSync /> <span className="hidden sm:inline">Refresh Analysis</span>
                    </button>

                    {alerts.length > 0 && (
                        <button
                            onClick={downloadReport}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-all hover:scale-105"
                            title="Download PDF Report"
                        >
                            <FaDownload />
                            <span className="hidden sm:inline">Export PDF</span>
                        </button>
                    )}
                </div>
            </div>

            {/* AI Analysis Result Section */}


            {/* Test Results Banner */}
            {testResults && (
                <div className={`mb-6 p-4 rounded-lg ${testResults.passed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                        {testResults.passed ? (
                            <FaCheckCircle className="text-green-600" />
                        ) : (
                            <FaInfoCircle className="text-yellow-600" />
                        )}
                        <span className={`font-semibold ${testResults.passed ? 'text-green-700' : 'text-yellow-700'}`}>
                            {testResults.passed ? 'Age-in-Days Rules Test Passed!' : 'Age-in-Days Rules Test'}
                        </span>
                    </div>
                    <p className={`text-sm mt-1 ${testResults.passed ? 'text-green-600' : 'text-yellow-600'}`}>
                        {testResults.message}
                    </p>
                </div>
            )}

            {/* Status Bar - Simplified */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                        <FaCheckCircle /> Available Rules
                    </div>
                    <div className="text-xl font-bold text-green-800">{clinicalRules.length || 0}</div>
                </div>
            </div>

            {/* Error Display */}
            {analysisError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                        <FaExclamationTriangle />
                        <span className="font-semibold">Analysis Error</span>
                    </div>
                    <p className="text-red-600">{analysisError}</p>
                    <button
                        onClick={analyzePatient}
                        className="mt-2 text-sm text-red-700 hover:text-red-900"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Analysis Results */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 mb-2">Running clinical analysis...</p>
                    </div>
                ) : !patientData ? (
                    <div className="text-center py-12">
                        <FaUser className="text-4xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No patient selected</p>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium mb-2">No clinical alerts detected</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-lg">
                                    <FaExclamationTriangle className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Clinical Alerts ({alerts.length})
                                    </h3>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={acknowledgeAll}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <FaCheckCircle /> Mark all as reviewed
                                </button>
                                <div className="flex items-center gap-2">
                                    <FaFilter className="text-gray-400" />
                                    <select
                                        value={severityFilter}
                                        onChange={(e) => setSeverityFilter(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
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

                        {/* Alerts List */}
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
                                        <div className="p-5">
                                            <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                                                <div className={`p-2 md:p-3 rounded-full ${severityBgColor} shrink-0 self-start mt-1`}>
                                                    <SeverityIcon className="text-white text-base md:text-lg" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Primary Context / Finding */}
                                                    <div className="flex flex-col gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-200 mb-5 shadow-sm">
                                                        <div className="flex items-start gap-3 text-sm md:text-lg text-gray-700">
                                                            <span className="font-black text-blue-600 uppercase text-xs md:text-sm mt-1 shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Finding:</span>
                                                            <p className="italic font-medium leading-relaxed">
                                                                {isHealthcareClient ? (alert.client_message || alert.message) : (alert.professional_message || alert.message)}
                                                            </p>
                                                        </div>

                                                        {/* Medications involved - now visible to everyone */}
                                                        {alert.evidence?.matched_medications?.length > 0 && (
                                                            <>
                                                                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-300/50 mt-1">
                                                                    <span className="font-black text-purple-600 uppercase text-xs md:text-sm shrink-0">Drug(s) Trigger:</span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {alert.evidence.matched_medications.map((med, i) => (
                                                                            <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs md:text-sm font-black border border-purple-200 shadow-sm flex items-center gap-2">
                                                                                <FaCapsules className="text-sm" /> {med}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                        
                                                        {/* Secondary Action / Recommendation - Always visible and STATIC */}
                                                        <div className="bg-green-50 border-l-8 border-green-500 p-4 md:p-5 rounded-r-xl mb-4 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FaCheckCircle className="text-green-600 text-sm" />
                                                                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-green-800">Evidence Recommendation</span>
                                                            </div>
                                                            <div className="text-sm md:text-base font-black text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                                {(isHealthcareClient ? (alert.client_recommendation || alert.recommendation || alert.details) : (alert.professional_recommendation || alert.recommendation || alert.details)) || 'Review clinical guidelines'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${alert.processed ? 'text-green-600' : 'text-orange-500'}`}>
                                                                {alert.processed ? 'Processed' : 'Needs Action'}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // We'll treat acknowledgement as "Seen" and add a processed toggle
                                                                    acknowledgeAlert(alert.id, !alert.processed);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-all ${alert.processed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:text-green-600'}`}
                                                                title={alert.processed ? "Mark as Unprocessed" : "Mark as Processed"}
                                                            >
                                                                {alert.processed ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                                                            </button>
                                                        </div>

                                                        {!alert.acknowledged && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    acknowledgeAlert(alert.id);
                                                                }}
                                                                className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-all flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-lg"
                                                            >
                                                                <FaEye className="text-lg" /> Seen
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {onBack && (
                <div className="mt-12 flex justify-center pb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all border border-gray-200 shadow-sm"
                    >
                        <FaSync className="rotate-180" />
                        Back to Patient Selection
                    </button>
                </div>
            )}
        </div>
    );
};

export default CDSSDisplay;
