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
    FaStar, FaMagic, FaClipboardCheck
} from 'react-icons/fa';
import api from '../../utils/api';

const CDSSDisplay = ({ patientData, onBack }) => {

    const {
        alerts, filteredAlerts, loading, analysisStats,
        clinicalRules, medications, analysisError, testResults,
        severityFilter, setSeverityFilter,
        fetchClinicalRules, testSampleRules, analyzePatient,
        acknowledgeAlert, acknowledgeAll, toggleExpandAlert, expandedAlert,
        patientFacts, lastAnalysisTime
    } = useCDSSLogic(patientData);

    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);

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

    const handleRunAI = async () => {
        setAiLoading(true);
        setAiResult(null);
        try {
            await analyzePatient();
            setAiResult('Analysis complete.');
        } catch (e) {
            setAiResult('AI analysis encountered an issue.');
        } finally {
            setAiLoading(false);
        }
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

    const [hasAcknowledged, setHasAcknowledged] = useState(false);

    if (!hasAcknowledged) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaUserShield className="text-blue-600 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">User Acknowledgment</h2>
                <div className="bg-blue-50 border-1 border-blue-200 p-6 rounded-2xl mb-8 max-w-2xl mx-auto">
                    <p className="text-gray-700 text-lg leading-relaxed">
                        <span className="block">"By continuing, you acknowledge that this supportive clinical information does not replace consultation with a licensed healthcare professional."</span>
                        <span className="block font-bold text-blue-800 text-base border-t border-blue-200 pt-4">"በመቀጠልዎ፤ ይህ መልዕክት ፈቃድ ካለው የጤና ባለሙያ ጋር የሚደረገውን የማማከር አገልግሎት የማይተካ መሆኑን ይስማማሉ።"</span>
                    </p>
                </div>
                <button
                    onClick={() => setHasAcknowledged(true)}
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
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shrink-0 shadow-md">
                            <FaShieldAlt className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Clinical Analysis</h2>
                            {patientData ? (
                                <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-0.5">
                                    <span className="font-semibold text-gray-700">{patientData.full_name}</span>
                                    {lastAnalysisTime && (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <span className="flex items-center gap-1">
                                                <FaClock className="text-xs" />
                                                Last run: {getTimeAgo ? getTimeAgo(lastAnalysisTime) : new Date(lastAnalysisTime).toLocaleTimeString()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Select a patient to begin</p>
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
                            disabled={aiLoading || loading || !patientData}
                            className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-all font-medium"
                            title="Run AI Clinical Assistant"
                        >
                            {aiLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                                <FaRobot />
                            )}
                            <span>Run AI Clinical Assistant</span>
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

            {/* ── Analysis Summary Card ── */}
            <div className={`rounded-xl border p-5 transition-all ${
                hasAlerts
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            }`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`flex items-center gap-3 flex-1 ${hasAlerts ? 'text-amber-800' : 'text-green-800'}`}>
                        <div className={`p-2.5 rounded-full ${hasAlerts ? 'bg-amber-100' : 'bg-green-100'}`}>
                            {hasAlerts
                                ? <FaExclamationTriangle className="text-amber-600 text-lg" />
                                : <FaCheckCircle className="text-green-600 text-lg" />
                            }
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-0.5 opacity-70">
                                Analysis Summary
                            </p>
                            <p className="font-bold text-base leading-tight">
                                {loading
                                    ? 'Running clinical analysis…'
                                    : hasAlerts
                                        ? `${totalAlerts} drug-related problem${totalAlerts !== 1 ? 's' : ''} detected`
                                        : 'No drug-related problems detected'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Severity chips */}
                    {hasAlerts && (
                        <div className="flex flex-wrap gap-2">
                            {criticalCount > 0 && (
                                <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                    {criticalCount} Critical
                                </span>
                            )}
                            {highCount > 0 && (
                                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                                    {highCount} High
                                </span>
                            )}
                            {moderateCount > 0 && (
                                <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
                                    {moderateCount} Moderate
                                </span>
                            )}
                            {lowCount > 0 && (
                                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                                    {lowCount} Low
                                </span>
                            )}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex gap-3 text-center">
                        <div className="px-3 py-1.5 bg-white/70 rounded-lg border border-white/50">
                            <div className="text-lg font-black text-gray-800">{clinicalRules.length}</div>
                            <div className="text-xs text-gray-500 font-medium">Rules</div>
                        </div>
                        <div className="px-3 py-1.5 bg-white/70 rounded-lg border border-white/50">
                            <div className="text-lg font-black text-gray-800">{medications.length}</div>
                            <div className="text-xs text-gray-500 font-medium">Medications</div>
                        </div>
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
                                        <div className="p-5">
                                            <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                                                <div className={`p-2 md:p-3 rounded-full ${severityBgColor} shrink-0 self-start mt-1`}>
                                                    <SeverityIcon className="text-white text-base md:text-lg" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {/* Primary Finding */}
                                                    <div className="flex flex-col gap-3 p-4 bg-gray-50/80 rounded-xl border border-gray-200 mb-5 shadow-sm">
                                                        <div className="flex items-start gap-3 text-sm md:text-lg text-gray-700">
                                                            <span className="font-black text-blue-600 uppercase text-xs md:text-sm mt-1 shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Finding:</span>
                                                            <p className="italic font-medium leading-relaxed">
                                                                {isHealthcareClient ? (alert.client_message || alert.message) : (alert.professional_message || alert.message)}
                                                            </p>
                                                        </div>

                                                        {/* Drug triggers */}
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

                                                        {/* Recommendation */}
                                                        <div className="bg-green-50 border-l-8 border-green-500 p-4 md:p-5 rounded-r-xl mb-4 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FaCheckCircle className="text-green-600 text-sm" />
                                                                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-green-800">Evidence Recommendation</span>
                                                            </div>
                                                            <div className="text-sm md:text-base font-black text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                                {(isHealthcareClient
                                                                    ? (alert.client_recommendation || alert.recommendation || alert.details)
                                                                    : (alert.professional_recommendation || alert.recommendation || alert.details)) || 'Review clinical guidelines'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex justify-end items-center gap-4 pt-4 border-t border-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${alert.processed ? 'text-green-600' : 'text-orange-500'}`}>
                                                                {alert.processed ? 'Processed' : 'Needs Action'}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    acknowledgeAlert(alert.id, !alert.processed);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-all ${alert.processed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:text-green-600'}`}
                                                                title={alert.processed ? 'Mark as Unprocessed' : 'Mark as Processed'}
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
                    )}
                </div>
            </div>

            {onBack && (
                <div className="flex justify-center pb-4">
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
