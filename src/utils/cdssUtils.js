import {
    FaPills, FaPrescription, FaFlask, FaExclamationTriangle, FaClipboardCheck,
    FaStethoscope, FaUser, FaChartLine, FaChartBar, FaCheckCircle,
    FaHeartbeat, FaCogs, FaBaby, FaChild, FaUserClock
} from 'react-icons/fa';

export const getRuleTypeInfo = (type) => {
    const types = {
        'drug_interaction': { label: 'Drug Interaction', color: 'bg-red-100 text-red-800', icon: FaPills },
        'dose_check': { label: 'Dose Check', color: 'bg-blue-100 text-blue-800', icon: FaPrescription },
        'lab_monitoring': { label: 'Lab Monitoring', color: 'bg-green-100 text-green-800', icon: FaFlask },
        'contraindication': { label: 'Contraindication', color: 'bg-purple-100 text-purple-800', icon: FaExclamationTriangle },
        'allergy_check': { label: 'Allergy Check', color: 'bg-orange-100 text-orange-800', icon: FaExclamationTriangle },
        'duplicate_therapy': { label: 'Duplicate Therapy', color: 'bg-yellow-100 text-yellow-800', icon: FaClipboardCheck },
        'renal_adjustment': { label: 'Renal Adjustment', color: 'bg-teal-100 text-teal-800', icon: FaStethoscope },
        'hepatic_adjustment': { label: 'Hepatic Adjustment', color: 'bg-indigo-100 text-indigo-800', icon: FaStethoscope },
        'pregnancy_check': { label: 'Pregnancy Safety', color: 'bg-pink-100 text-pink-800', icon: FaUser },
        'therapeutic_monitoring': { label: 'Therapeutic Monitoring', color: 'bg-cyan-100 text-cyan-800', icon: FaChartLine },
        'cost_analysis': { label: 'Cost Analysis', color: 'bg-amber-100 text-amber-800', icon: FaChartBar },
        'quality_check': { label: 'Quality Check', color: 'bg-emerald-100 text-emerald-800', icon: FaCheckCircle },
        'vitals_monitoring': { label: 'Vitals Monitoring', color: 'bg-pink-100 text-pink-800', icon: FaHeartbeat },
        'adherence_check': { label: 'Adherence Check', color: 'bg-lime-100 text-lime-800', icon: FaUser },
        'age_check': { label: 'Age Check', color: 'bg-rose-100 text-rose-800', icon: FaUser },
        'pediatric_check': { label: 'Pediatric Check', color: 'bg-indigo-100 text-indigo-800', icon: FaBaby }
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-800', icon: FaCogs };
};

export const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
};

export const getAgeCategoryIcon = (patientFacts) => {
    if (patientFacts?.is_neonate) return FaBaby;
    if (patientFacts?.is_infant) return FaBaby;
    if (patientFacts?.is_child) return FaChild;
    if (patientFacts?.is_adolescent) return FaUser;
    if (patientFacts?.age > 65) return FaUserClock;
    return FaUser;
};

export const getAgeCategoryLabel = (patientFacts) => {
    if (patientFacts?.is_neonate) return 'Neonate (0-28d)';
    if (patientFacts?.is_infant) return 'Infant (29d-1y)';
    if (patientFacts?.is_child) return 'Child (1-12y)';
    if (patientFacts?.is_adolescent) return 'Adolescent (13-18y)';
    if (patientFacts?.age > 65) return 'Geriatric (>65y)';
    return 'Adult';
};
