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
    FaExclamationCircle, FaHeartbeat
} from 'react-icons/fa';

const CDSSDisplay = ({ patientData, onBack }) => {

    const {
        alerts, filteredAlerts, loading, analysisStats,
        clinicalRules, medications, analysisError, testResults,
        severityFilter, setSeverityFilter,
        fetchClinicalRules, testSampleRules, analyzePatient,
        acknowledgeAlert, acknowledgeAll, toggleExpandAlert, expandedAlert,
        patientFacts
    } = useCDSSLogic(patientData);

    const userRole = localStorage.getItem('userRole') || 'admin';
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
            doc.text('CLINICAL DECISION SUPPORT REPORT', 15, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 30);
            doc.text(`Patient Code: ${patientData.patient_code}`, 15, 35);

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
                let evidence = '';
                if (alert.evidence) {
                    const parts = [];
                    // Medications are now allowed for everyone (including clients)
                    if (alert.evidence.matched_medications?.length > 0) {
                        parts.push(`Meds: ${alert.evidence.matched_medications.join(', ')}`);
                    }
                    // Other technical evidence (like labs) remains restricted for clients
                    if (!isHealthcareClient && alert.evidence.labs) {
                        const labKeys = Object.keys(alert.evidence.labs).filter(k => alert.evidence.labs[k]);
                        if (labKeys.length > 0) {
                            parts.push(`Labs: ${labKeys.map(k => `${k}=${alert.evidence.labs[k]}`).join(', ')}`);
                        }
                    }
                    evidence = parts.join(' | ');
                }

                return [
                    index + 1,
                    {
                        content: `${alert.rule_name}\n[${alert.severity.toUpperCase()}]`,
                        styles: {
                            fillColor: alert.severity === 'critical' ? [254, 226, 226] : (alert.severity === 'high' ? [255, 237, 213] : null),
                            textColor: alert.severity === 'critical' ? [153, 27, 27] : (alert.severity === 'high' ? [154, 52, 18] : null),
                            fontStyle: 'bold'
                        }
                    },
                    isHealthcareClient ? (alert.client_message || alert.message) : (alert.professional_message || alert.message),
                    isHealthcareClient ? (alert.client_recommendation || alert.details || 'N/A') : (alert.professional_recommendation || alert.details || 'N/A'),
                    isHealthcareClient ? 'General Guidance' : (evidence || 'Matched patterns')
                ];
            });

            autoTable(doc, {
                startY: currentY + 5,
                head: [isHealthcareClient
                    ? ['#', 'Alert/Severity', 'Guidance Message', 'Recommendation', 'Note']
                    : ['#', 'Alert/Severity', 'Clinical Message', 'Recommendation', 'Evidence']
                ],
                body: alertRows,
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] }, // Red-600
                styles: { fontSize: 7, cellPadding: 3 },
                columnStyles: {
                    1: { width: 35 },
                    2: { width: 45 },
                    3: { width: 45 },
                    4: { width: 30 }
                }
            });

            // --- FOOTER ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(156, 163, 175);
                doc.text(
                    'DISCLAIMER: This decision support tool should be reviewed by a professional. Patient data is confidential.',
                    15, 285
                );
                doc.text(`Page ${i} of ${pageCount}`, 180, 285);
            }

            doc.save(`Clinical_Analysis_${patientData.patient_code}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('PDF generation failed. Library error.');
        }
    };

    const AgeCategoryIcon = getAgeCategoryIcon(patientFacts);

    const [hasAcknowledged, setHasAcknowledged] = useState(false);

    if (!hasAcknowledged && alerts.length > 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaShieldAlt className="text-blue-600 text-4xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">User Acknowledgment</h2>
                <div className="bg-blue-50 border-1 border-blue-200 p-6 rounded-2xl mb-8 max-w-2xl mx-auto">
                    <p className="text-gray-700 text-lg leading-relaxed">
                        “By continuing, you acknowledge that this supportive clinical information does not replace consultation with a licensed healthcare professional.”
                    </p>
                </div>
                <button
                    onClick={() => setHasAcknowledged(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                    <FaCheckCircle />
                    Accept & Continue
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
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">CDSS Analysis</h2>
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
                    {!isHealthcareClient && (
                        <button
                            onClick={fetchClinicalRules}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm flex-1 md:flex-initial"
                            title="Refresh Rules"
                        >
                            <FaRedo /> <span className="hidden sm:inline">Refresh Rules</span>
                        </button>
                    )}

                    {alerts.length > 0 && (
                        <button
                            onClick={downloadReport}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm flex-1 md:flex-initial shadow-sm transition-all hover:scale-105"
                            title="Download PDF Report"
                        >
                            <FaDownload />
                            <span className="hidden sm:inline">Export PDF</span>
                        </button>
                    )}
                </div>
            </div>

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
            {!isHealthcareClient && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                            <FaCheckCircle /> Available Rules
                        </div>
                        <div className="text-xl font-bold text-green-800">{clinicalRules.length || 0}</div>
                    </div>
                </div>
            )}

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
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{alert.rule_name}</span>
                                                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${ruleTypeInfo.color}`}>
                                                                {ruleTypeInfo.label}
                                                            </span>
                                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                                                                {getTimeAgo(alert.timestamp)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Primary Action / Recommendation - Always visible and STATIC */}
                                                    <div className="bg-green-50 border-l-8 border-green-500 p-4 md:p-5 rounded-r-xl mb-4 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <FaCheckCircle className="text-green-600 text-sm" />
                                                            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-green-800">Required Action</span>
                                                        </div>
                                                        <div className="text-lg md:text-2xl font-black text-gray-900 leading-tight">
                                                            {(isHealthcareClient ? (alert.client_recommendation || alert.details) : (alert.professional_recommendation || alert.details)) || 'Review clinical guidelines'}
                                                        </div>
                                                    </div>

                                                    {/* Secondary Context / Finding */}
                                                    <div className="flex flex-col gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-200 mb-5 shadow-sm">
                                                        <div className="flex items-start gap-3 text-sm md:text-lg text-gray-700">
                                                            <span className="font-black text-blue-600 uppercase text-xs md:text-sm mt-1 shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Finding:</span>
                                                            <p className="italic font-medium leading-relaxed">
                                                                {isHealthcareClient ? (alert.client_message || alert.message) : (alert.professional_message || alert.message)}
                                                            </p>
                                                        </div>

                                                        {/* Medications involved - now visible to everyone */}
                                                        {alert.evidence?.matched_medications?.length > 0 && (
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
                                                        )}
                                                    </div>

                                                    {!alert.acknowledged && (
                                                        <div className="flex justify-end pt-3 border-t border-gray-100">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    acknowledgeAlert(alert.id);
                                                                }}
                                                                className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-400 hover:text-green-600 transition-all flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg"
                                                            >
                                                                <FaCheckCircle className="text-lg" /> Dismiss this alert
                                                            </button>
                                                        </div>
                                                    )}
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