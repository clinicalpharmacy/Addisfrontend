// src/pages/safety/SafetySection.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaBaby, FaFemale, FaUser, FaKidneys, FaLiver, FaHands,
  FaArrowLeft, FaExclamationTriangle, FaCheckCircle, FaMinusCircle,
  FaPills, FaShieldAlt, FaUserMd, FaSpinner, FaClock
} from 'react-icons/fa';
import { useSafetyRules } from '../../hooks/useSafetyRules';

// Map safety types to their display information
const safetyConfigMap = {
  'pregnancy': {
    title: 'Medication Safety During Pregnancy',
    description: 'FDA pregnancy categories and safety recommendations from CDSS',
    icon: FaBaby,
    color: 'pink',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-600',
    severityColors: {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
  },
  'lactation': {
    title: 'Medication Safety During Lactation',
    description: 'Drug transfer to breast milk and infant safety from CDSS',
    icon: FaFemale,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    severityColors: {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
  },
  'elderly': {
    title: 'Medication Safety in Elderly',
    description: 'Beers Criteria and potentially inappropriate medications from CDSS',
    icon: FaUser,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    severityColors: {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  },
  'kidney': {
    title: 'Unsafe Medications in Renal Impairment',
    description: 'Drugs to avoid or adjust when eGFR < 30 mL/min from CDSS',
    icon: FaKidneys,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    severityColors: {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  },
  'liver': {
    title: 'Medication Safety in Liver Disease',
    description: 'Hepatotoxic drugs and liver function monitoring from CDSS',
    icon: FaLiver,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
    severityColors: {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  },
  'drug-interactions': {
    title: 'Drug-Drug Interaction Safety',
    description: 'Clinically significant drug interactions from CDSS',
    icon: FaHands,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    severityColors: {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  },
  'neonate': {
    title: 'Unsafe Medications in Neonates',
    description: 'Drug safety considerations for neonates (0-28 days) from CDSS',
    icon: FaUserMd,
    color: 'teal',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-600',
    severityColors: {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
  }
};

const SafetySection = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  
  const config = safetyConfigMap[type];
  const { rules, loading, error } = useSafetyRules(type);

  // If config not found
  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Safety information not found</h2>
          <p className="text-gray-500 mt-2">The requested safety category does not exist.</p>
          <button 
            onClick={() => navigate('/home')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  const getSeverityBadge = (severity) => {
    const sev = severity?.toLowerCase() || 'moderate';
    const styles = config.severityColors || {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    const color = styles[sev] || styles.moderate;
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${color}`}>
        {severity?.toUpperCase() || 'MODERATE'}
      </span>
    );
  };

  const getRiskIcon = (severity) => {
    const sev = severity?.toLowerCase();
    if (sev === 'critical' || sev === 'high') {
      return <FaExclamationTriangle className="text-red-500 text-sm" />;
    } else if (sev === 'moderate') {
      return <FaMinusCircle className="text-yellow-500 text-sm" />;
    } else if (sev === 'low') {
      return <FaCheckCircle className="text-green-500 text-sm" />;
    }
    return null;
  };

  // Helper to render condition details
  const renderConditionDetails = (condition) => {
    if (!condition) return null;
    
    const conditions = condition.all || condition.any || [];
    if (!conditions.length) return null;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Condition</p>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {conditions.map((c, idx) => (
            <span key={idx} className="text-xs font-mono bg-white px-2.5 py-1.5 rounded border border-gray-200">
              {c.fact} {c.operator} {typeof c.value === 'string' && !c.value.startsWith('[') ? `"${c.value}"` : JSON.stringify(c.value)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <FaSpinner className="text-4xl text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading safety rules from CDSS...</p>
        <p className="text-sm text-gray-400 mt-1">Please wait</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Error Loading Safety Rules</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
      >
        <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
        Back to Medication Review
      </button>

      {/* Header */}
      <div className={`p-6 rounded-xl border-2 ${config.bgColor} ${config.borderColor} mb-8`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-white rounded-xl shadow-sm ${config.textColor}`}>
            <Icon className="text-3xl" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{config.title}</h1>
            <p className="text-gray-600 mt-1">{config.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FaPills className="text-xs" />
                {rules.length} clinical rules
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FaShieldAlt className="text-xs" />
                CDSS validated
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <FaClock className="text-xs" />
                Real-time from database
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div 
              key={rule.id || index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header with severity and status */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(rule.severity)}
                      <h3 className="text-lg font-semibold text-gray-800">
                        {rule.drug1 || rule.rule_name}
                      </h3>
                    </div>
                    
                    {/* If drug2 exists, show it */}
                    {rule.drug2 && (
                      <>
                        <span className="text-gray-300 font-bold">+</span>
                        <span className="text-lg font-semibold text-gray-800">{rule.drug2}</span>
                      </>
                    )}
                    
                    {getSeverityBadge(rule.severity)}
                    
                    {/* Special badges */}
                    {rule.fdaCategory && (
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        ['X', 'D'].includes(rule.fdaCategory) 
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        Category {rule.fdaCategory}
                      </span>
                    )}
                    
                    {rule.beersCriteria && (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
                        Beers Criteria
                      </span>
                    )}
                    
                    {rule.ageInDays && (
                      <span className="px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full border border-teal-200">
                        {rule.ageInDays} days
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      rule.is_active !== false 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {rule.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {rule.rule_description && (
                  <p className="text-gray-600 text-sm mb-3">{rule.rule_description}</p>
                )}

                {/* Message from action */}
                {rule.message && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-700">{rule.message}</p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {rule.recommendation && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Recommendation</p>
                      <p className="text-sm text-blue-800 mt-1">{rule.recommendation}</p>
                    </div>
                  )}

                  {rule.mechanism && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mechanism</p>
                      <p className="text-sm text-gray-700 mt-1">{rule.mechanism}</p>
                    </div>
                  )}

                  {rule.gfrThreshold && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">GFR Threshold</p>
                      <p className="text-sm text-red-800 mt-1">eGFR {rule.gfrThreshold} {rule.gfrValue}</p>
                    </div>
                  )}

                  {rule.trimester && (
                    <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                      <p className="text-xs font-semibold text-pink-600 uppercase tracking-wider">Trimester</p>
                      <p className="text-sm text-pink-800 mt-1">{rule.trimester}</p>
                    </div>
                  )}
                </div>

                {/* Condition Details */}
                {renderConditionDetails(rule.rule_condition)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-4xl text-gray-300 mb-4">📋</div>
          <p className="text-gray-500 font-medium">No safety rules found for this category</p>
          <p className="text-sm text-gray-400 mt-1">
            Add rules in the Clinical Rules Administration panel
          </p>
          <button
            onClick={() => navigate('/admin/cdss/rules')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Admin Panel
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">CDSS Clinical Decision Support Disclaimer</p>
            <p className="text-sm text-yellow-700 mt-1">
              These rules are from the Clinical Decision Support System (CDSS) and are intended for clinical decision support. 
              Always verify with primary literature and consider individual patient factors before making clinical decisions.
              Consult with a qualified healthcare provider for patient-specific recommendations.
            </p>
            {rules.length > 0 && (
              <p className="text-xs text-yellow-600 mt-2">
                Rules last updated: {new Date(rules[0]?.updated_at || Date.now()).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetySection;
