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

    const downloadReport = () => {
        if (!patientData) return;

        const timestamp = new Date().toLocaleString();
        const divider = '================================================';

        let reportText = `${divider}\n`;
        reportText += `CLINICAL DECISION SUPPORT REPORT\n`;
        reportText += `${divider}\n\n`;

        reportText += `REPORT DETAILS\n`;
        reportText += `Generated: ${timestamp}\n`;
        reportText += `Patient Code: ${patientData.patient_code}\n`;
        reportText += `Patient Name: ${patientData.full_name || 'N/A'}\n`;
        reportText += `Age/Category: ${patientData.age || 'N/A'} (${patientFacts?.patient_type || 'N/A'})\n`;
        reportText += `Gender: ${patientData.gender || 'N/A'}\n`;
        reportText += `Primary Diagnosis: ${patientData.diagnosis || 'None recorded'}\n\n`;

        reportText += `ANALYSIS SUMMARY\n`;
        reportText += `Total Alerts: ${alerts.length}\n`;
        reportText += `- Critical: ${analysisStats?.bySeverity?.critical || 0}\n`;
        reportText += `- High Severity: ${analysisStats?.bySeverity?.high || 0}\n`;
        reportText += `- Moderate: ${analysisStats?.bySeverity?.moderate || 0}\n`;
        reportText += `- Low: ${analysisStats?.bySeverity?.low || 0}\n\n`;

        if (medications && medications.length > 0) {
            reportText += `CURRENT MEDICATIONS (${medications.length})\n`;
            medications.forEach((m, i) => {
                reportText += `${i + 1}. ${m.drug_name} (${m.drug_class || 'N/A'}) - ${m.dose || ''} ${m.frequency || ''}\n`;
            });
            reportText += `\n`;
        }

        reportText += `CLINICAL ALERTS & RECOMMENDATIONS\n`;
        reportText += `${divider}\n`;

        if (alerts.length === 0) {
            reportText += `No clinical alerts detected during this analysis.\n`;
        } else {
            alerts.forEach((alert, index) => {
                reportText += `\nALERT #${index + 1}: ${alert.rule_name}\n`;
                reportText += `SEVERITY: ${alert.severity.toUpperCase()}\n`;
                reportText += `MESSAGE: ${alert.message}\n`;
                if (alert.details) {
                    reportText += `RECOMMENDATION: ${alert.details}\n`;
                }

                // Simplified evidence
                const evidence = alert.evidence;
                if (evidence) {
                    reportText += `EVIDENCE: `;
                    const evidenceParts = [];
                    if (evidence.matched_medications?.length > 0) {
                        evidenceParts.push(`Medications: ${evidence.matched_medications.join(', ')}`);
                    }
                    if (evidence.labs) {
                        const labKeys = Object.keys(evidence.labs).filter(k => evidence.labs[k]);
                        if (labKeys.length > 0) {
                            evidenceParts.push(`Lab Values: ${labKeys.map(k => `${k}=${evidence.labs[k]}`).join(', ')}`);
                        }
                    }
                    reportText += evidenceParts.join(' | ') || 'Clinical parameters matched';
                    reportText += `\n`;
                }
                reportText += `------------------------------------------------\n`;
            });
        }

        reportText += `\n${divider}\n`;
        reportText += `DISCLAIMER: This report is a decision support tool and should be \n`;
        reportText += `reviewed by a qualified healthcare professional before clinical action.\n`;
        reportText += `${divider}\n`;

        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Clinical_Analysis_${patientData.patient_code}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const AgeCategoryIcon = getAgeCategoryIcon(patientFacts);

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
                    <button
                        onClick={fetchClinicalRules}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm flex-1 md:flex-initial"
                        title="Refresh Rules"
                    >
                        <FaRedo /> <span className="hidden sm:inline">Refresh Rules</span>
                    </button>

                    {alerts.length > 0 && (
                        <button
                            onClick={downloadReport}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm flex-1 md:flex-initial"
                            title="Export Report"
                        >
                            <FaDownload />
                            <span className="hidden sm:inline">Export</span>
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
                                const isExpanded = expandedAlert === alert.id;

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
                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                        <span className="font-bold text-gray-800">{alert.rule_name}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${ruleTypeInfo.color}`}>
                                                            {ruleTypeInfo.label}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                                                            {getTimeAgo(alert.timestamp)}
                                                        </span>
                                                    </div>

                                                    <div className="text-gray-700 font-medium mb-3">
                                                        {alert.message}
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