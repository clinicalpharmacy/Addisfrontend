import React, { useState } from 'react';
import { useCDSSLogic } from '../../hooks/useCDSSLogic';
import { AlertDetails } from './AlertComponents';
import { getRuleTypeInfo, getTimeAgo, getAgeCategoryIcon, getAgeCategoryLabel } from '../../utils/cdssUtils';
import {
    FaBell, FaExclamationTriangle, FaCheckCircle, FaInfoCircle,
    FaUserMd, FaFilter, FaSync, FaDownload,
    FaFlask, FaDatabase, FaEye, FaEyeSlash,
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

        const report = {
            title: 'Clinical Decision Support Report',
            patient: {
                code: patientData.patient_code,
                name: patientData.full_name,
                age: patientData.age,
                gender: patientData.gender,
                diagnosis: patientData.diagnosis,
                age_in_days: patientFacts?.age_in_days,
                patient_type: patientFacts?.patient_type,
                is_pediatric: patientFacts?.is_pediatric
            },
            analysis: analysisStats,
            timestamp: new Date().toISOString(),
            medications: medications.map(m => ({
                name: m.drug_name,
                dose: m.dose,
                frequency: m.frequency,
                indication: m.indication,
                class: m.drug_class
            })),
            alerts: alerts.map(a => ({
                rule: a.rule_name,
                type: a.rule_type,
                severity: a.severity,
                message: a.message,
                recommendation: a.details,
                evidence: a.evidence,
                timestamp: a.timestamp,
                confidence: a.confidence,
                patient_age_in_days: a.patient_age_in_days,
                patient_type: a.patient_type
            })),
            summary: `Clinical analysis generated ${alerts.length} alerts for ${patientData.patient_code}`
        };

        const content = JSON.stringify(report, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CDSS_Report_${patientData.patient_code}_${new Date().toISOString().split('T')[0]}.json`;
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
                                {patientFacts?.age_in_days > 0 && (
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                        <FaCalendarDay className="text-blue-400" />
                                        {patientFacts.age_in_days >= 365
                                            ? `${Math.floor(patientFacts.age_in_days / 365)}y`
                                            : `${patientFacts.age_in_days}d`}
                                    </span>
                                )}
                                {patientFacts?.patient_type && (
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                        <AgeCategoryIcon className="text-indigo-400" /> {getAgeCategoryLabel(patientFacts)}
                                    </span>
                                )}
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
                    {testResults.passed && alerts.length > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                            Age-in-days functionality is working correctly. Rules are triggering based on patient's age in days.
                        </p>
                    )}
                </div>
            )}

            {/* Status Bar */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-1 flex items-center gap-1">
                        <FaCalendarDay /> Age
                    </div>
                    <div className="text-xl font-bold text-blue-800">
                        {patientFacts?.age_in_days ? (
                            patientFacts.age_in_days >= 365
                                ? `${Math.floor(patientFacts.age_in_days / 365)} Years`
                                : `${patientFacts.age_in_days} Days`
                        ) : 'N/A'}
                    </div>
                    {patientFacts?.age_in_days >= 365 && (
                        <div className="text-xs text-blue-600">({patientFacts.age_in_days} days)</div>
                    )}
                </div>

                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <div className="text-sm text-indigo-700 mb-1 flex items-center gap-1">
                        <AgeCategoryIcon /> Age Category
                    </div>
                    <div className="text-xl font-bold text-indigo-800">
                        {getAgeCategoryLabel(patientFacts)}
                    </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-700 mb-1 flex items-center gap-1">
                        <FaCapsules /> Medications
                    </div>
                    <div className="text-xl font-bold text-purple-800">{medications.length}</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                        <FaCheckCircle /> Available Rules
                    </div>
                    <div className="text-xl font-bold text-green-800">{clinicalRules.length || 0}</div>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div className="text-sm text-orange-700 mb-1 flex items-center gap-1">
                        <FaFlask /> Labs
                    </div>
                    <div className="text-xl font-bold text-orange-800">
                        {patientFacts ? Object.keys(patientFacts.labs).length : 0}
                    </div>
                </div>

                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                    <div className="text-sm text-pink-700 mb-1 flex items-center gap-1">
                        <FaHeartbeat /> Vitals
                    </div>
                    <div className="text-xl font-bold text-pink-800">
                        {patientFacts ? Object.keys(patientFacts.vitals).length : 0}
                    </div>
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
                                    <p className="text-sm text-gray-600">
                                        {alerts.filter(a => !a.acknowledged).length} unacknowledged •
                                        {alerts.filter(a => a.severity === 'critical').length} critical
                                    </p>
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

                        {/* Statistics Bar */}
                        {analysisStats && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800">{analysisStats.rulesEvaluated}</div>
                                        <div className="text-sm text-gray-600">Rules Checked</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">{analysisStats.bySeverity.critical || 0}</div>
                                        <div className="text-sm text-gray-600">Critical</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{analysisStats.bySeverity.high || 0}</div>
                                        <div className="text-sm text-gray-600">High</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600">{analysisStats.bySeverity.moderate || 0}</div>
                                        <div className="text-sm text-gray-600">Moderate</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{analysisStats.bySeverity.low || 0}</div>
                                        <div className="text-sm text-gray-600">Low</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alerts List */}
                        <div className="space-y-4">
                            {filteredAlerts.map((alert) => {
                                const SeverityIcon = severityIcons[alert.severity] || FaBell;
                                const severityColor = severityColors[alert.severity];
                                const severityBgColor = severityBgColors[alert.severity];
                                const ruleTypeInfo = getRuleTypeInfo(alert.rule_type);
                                const TypeIcon = ruleTypeInfo.icon;
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
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-base md:text-lg text-gray-800 break-words">{alert.rule_name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${ruleTypeInfo.color} flex items-center gap-1 shrink-0`}>
                                                            <TypeIcon className="text-[10px]" />
                                                            {ruleTypeInfo.label}
                                                        </span>
                                                        <span className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 shrink-0">
                                                            <FaClock />
                                                            {getTimeAgo(alert.timestamp)}
                                                        </span>
                                                        {alert.acknowledged && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded shrink-0">
                                                                <FaCheckCircle /> Reviewed
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mb-3 p-3 bg-white bg-opacity-70 rounded-lg border border-opacity-30">
                                                        <p className="text-gray-700 text-sm md:text-base leading-relaxed">{alert.message}</p>
                                                    </div>

                                                    {alert.details && (
                                                        <div className="mb-3 p-3 bg-white bg-opacity-70 rounded-lg border border-opacity-30">
                                                            <h4 className="font-bold text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                                                                <FaUserMd /> Recommendation
                                                            </h4>
                                                            <p className="text-gray-600 text-sm whitespace-pre-line">{alert.details}</p>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-3 border-t border-opacity-30 gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${alert.severity === 'critical' ? 'text-red-700 bg-red-100/50' :
                                                                alert.severity === 'high' ? 'text-orange-700 bg-orange-100/50' :
                                                                    alert.severity === 'moderate' ? 'text-yellow-700 bg-yellow-100/50' :
                                                                        'text-blue-700 bg-blue-100/50'
                                                                }`}>
                                                                <SeverityIcon size={12} />
                                                                {alert.severity}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                            <button
                                                                onClick={() => toggleExpandAlert(alert.id)}
                                                                className="flex-1 sm:flex-initial justify-center text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1 py-1.5 px-3 bg-white/50 rounded-lg hover:bg-white transition-colors"
                                                            >
                                                                {isExpanded ? (
                                                                    <>
                                                                        <FaChevronUp /> <span className="sm:hidden">Less</span><span className="hidden sm:inline">Show Less</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaChevronDown /> <span className="sm:hidden">Details</span><span className="hidden sm:inline">Show Details</span>
                                                                    </>
                                                                )}
                                                            </button>

                                                            {!alert.acknowledged && (
                                                                <button
                                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                                    className="flex-1 sm:flex-initial justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-1 py-1.5 px-3 rounded-lg shadow-sm transition-all"
                                                                >
                                                                    <FaCheckCircle /> <span className="sm:hidden">Ack</span><span className="hidden sm:inline">Mark Reviewed</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {isExpanded && <AlertDetails alert={alert} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

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
        </div>
    );
};

export default CDSSDisplay;