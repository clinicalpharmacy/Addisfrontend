import {
    FaClipboardCheck, FaPills, FaStethoscope, FaExclamationTriangle,
    FaDatabase, FaUserMd, FaHeartbeat, FaUserCheck, FaCapsules
} from 'react-icons/fa';

export const drnCategories = {
    Indication: {
        icon: FaClipboardCheck,
        color: 'blue',
        ruleTypes: ['duplicate_therapy', 'no_medical_indication', 'nondrug_therapy_appropriate', 'addiction_or_recreational_medicine_use', 'treating_avoidable_ade', 'prophylaxis_needed', 'untreated_condition', 'synergistic_therapy_needed'],
        description: 'Appropriateness of indication'
    },
    Dosage: {
        icon: FaPills,
        color: 'teal',
        ruleTypes: ['low_dose', 'less_frequent', 'short_duration', 'improper_storage', 'high_dose', 'high_frequent', 'longer_duration', 'dose_titration_slow_or_fast'],
        description: 'Incorrect dose'
    },
    "Rule out Ineffective Drug Therapy": {
        icon: FaStethoscope,
        color: 'yellow',
        ruleTypes: ['more_effective_drug_available', 'condition_refractory_to_drug', 'dosage_form_inappropriate'],
        description: 'Ineffective drug therapy'
    },
    "Contraindication or Caution or ADE or SE or Allergy": {
        icon: FaExclamationTriangle,
        color: 'red',
        ruleTypes: ['undesirable_effect_ade_or_se', 'unsafe_drug_contraindication_or_caution', 'allergic_reaction'],
        description: 'Medication safety'
    },
    "Drug Interaction": {
        icon: FaDatabase,
        color: 'orange',
        ruleTypes: ['di_increase_dose', 'di_decrease_dose', 'di_linked_to_ade'],
        description: 'Drug interactions'
    },
    Administration: {
        icon: FaUserMd,
        color: 'purple',
        ruleTypes: ['incorrect_administration_decrease_dose_or_efficacy', 'incorrect_administration_linked_to_ade', 'patient_does_not_understand_instructions', 'cannot_swallow_or_administer_drug'],
        description: 'Administration related problems'
    },
    Monitoring: {
        icon: FaHeartbeat,
        color: 'pink',
        ruleTypes: ['need_monitoring_to_rule_out_effectiveness', 'need_monitoring_to_rule_out_safety'],
        description: 'Need for monitoring'
    },
    Adherence: {
        icon: FaUserCheck,
        color: 'indigo',
        ruleTypes: ['patient_prefers_not_to_take_drug', 'patient_forgets_to_take_drug', 'drug_not_available', 'more_cost_effective_drug_available', 'cannot_afford_drug'],
        description: 'Adherence to medication'
    },
    "Product Quality": {
        icon: FaCapsules,
        color: 'green',
        ruleTypes: ['product_quality_defect'],
        description: 'Product quality defect'
    }
};

export const menuItemsData = {
    Indication: [
        { name: 'Duplicate Therapy', ruleType: 'duplicate_therapy', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
        { name: 'No medical indication', ruleType: 'no_medical_indication', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
        { name: 'Nondrug therapy appropriate', ruleType: 'nondrug_therapy_appropriate', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
        { name: 'Addiction or recreational medicine use', ruleType: 'addiction_or_recreational_medicine_use', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
        { name: 'Treating avoidable ADE', ruleType: 'treating_avoidable_ade', dtpType: 'Unnecessary Drug Therapy', drn: 'Indication' },
        { name: 'Prophylaxis needed', ruleType: 'prophylaxis_needed', dtpType: 'Needs Additional Drug Therapy', drn: 'Indication' },
        { name: 'Untreated condition', ruleType: 'untreated_condition', dtpType: 'Needs Additional Drug Therapy', drn: 'Indication' },
        { name: 'Synergistic therapy needed', ruleType: 'synergistic_therapy_needed', dtpType: 'Needs Additional Drug Therapy', drn: 'Indication' },
    ],
    Dosage: [
        { name: 'Low Dose', ruleType: 'low_dose', dtpType: 'Low Dose', drn: 'Effectiveness' },
        { name: 'Less Frequent', ruleType: 'less_frequent', dtpType: 'Low Dose', drn: 'Effectiveness' },
        { name: 'Short Duration', ruleType: 'short_duration', dtpType: 'Low Dose', drn: 'Effectiveness' },
        { name: 'Improper Storage', ruleType: 'improper_storage', dtpType: 'Low Dose', drn: 'Effectiveness' },
        { name: 'High Dose', ruleType: 'high_dose', dtpType: 'High Dose', drn: 'Safety' },
        { name: 'More Frequent', ruleType: 'high_frequent', dtpType: 'High Dose', drn: 'Safety' },
        { name: 'Longer Duration', ruleType: 'longer_duration', dtpType: 'High Dose', drn: 'Safety' },
        { name: 'Dose Titration Slow or Fast', ruleType: 'dose_titration_slow_or_fast', dtpType: 'ADE', drn: 'Safety' },
    ],
    "Rule out Ineffective Drug Therapy": [
        { name: 'More effective drug available', ruleType: 'more_effective_drug_available', dtpType: 'Ineffective Drug Therapy', drn: 'Effectiveness' },
        { name: 'Condition refractory to drug', ruleType: 'condition_refractory_to_drug', dtpType: 'Ineffective Drug Therapy', drn: 'Effectiveness' },
        { name: 'Dosage form inappropriate', ruleType: 'dosage_form_inappropriate', dtpType: 'Ineffective Drug Therapy', drn: 'Effectiveness' },
    ],
    "Contraindication or Caution or ADE or SE or Allergy": [
        { name: 'Undesirable Effect (ADE or SE)', ruleType: 'undesirable_effect_ade_or_se', dtpType: 'ADE', drn: 'Safety' },
        { name: 'Unsafe Drug (Contraindication or Caution)', ruleType: 'unsafe_drug_contraindication_or_caution', dtpType: 'ADE', drn: 'Safety' },
        { name: 'Allergic Reaction', ruleType: 'allergic_reaction', dtpType: 'ADE', drn: 'Safety' },
    ],
    "Drug Interaction": [
        { name: 'DI increase dose', ruleType: 'di_increase_dose', dtpType: 'High Dose', drn: 'Safety' },
        { name: 'DI decrease dose', ruleType: 'di_decrease_dose', dtpType: 'Low Dose', drn: 'Effectiveness' },
        { name: 'DI linked to ADE', ruleType: 'di_linked_to_ade', dtpType: 'ADE', drn: 'Safety' },
    ],
    Administration: [
        { name: 'Incorrect administration decrease dose or efficacy', ruleType: 'incorrect_administration_decrease_dose_or_efficacy', dtpType: 'Low Dose', drn: 'Effectiveness' },
        { name: 'Incorrect administration linked to ADE', ruleType: 'incorrect_administration_linked_to_ade', dtpType: 'ADE', drn: 'Safety' },
        { name: 'Patient does not understand instructions', ruleType: 'patient_does_not_understand_instructions', dtpType: 'Non-Adherence', drn: 'Adherence' },
        { name: 'Cannot swallow or administer drug', ruleType: 'cannot_swallow_or_administer_drug', dtpType: 'Non-Adherence', drn: 'Adherence' },
    ],
    Monitoring: [
        { name: 'Need Monitoring to rule out effectiveness', ruleType: 'need_monitoring_to_rule_out_effectiveness', dtpType: 'Needs additional monitoring', drn: 'Effectiveness' },
        { name: 'Need Monitoring to rule out safety', ruleType: 'need_monitoring_to_rule_out_safety', dtpType: 'Needs additional monitoring', drn: 'Safety' },
    ],
    Adherence: [
        { name: 'Patient prefers not to take drug', ruleType: 'patient_prefers_not_to_take_drug', dtpType: 'Non-Adherence', drn: 'Adherence' },
        { name: 'Patient forgets to take drug', ruleType: 'patient_forgets_to_take_drug', dtpType: 'Non-Adherence', drn: 'Adherence' },
        { name: 'Drug not available', ruleType: 'drug_not_available', dtpType: 'Non-Adherence', drn: 'Adherence' },
        { name: 'More cost-effective drug available', ruleType: 'more_cost_effective_drug_available', dtpType: 'Cost', drn: 'Adherence' },
        { name: 'Cannot afford drug', ruleType: 'cannot_afford_drug', dtpType: 'Cost', drn: 'Adherence' },
    ],
    "Product Quality": [
        { name: 'Product Quality Defect', ruleType: 'product_quality_defect', dtpType: 'Product Quality Defect', drn: 'Product Quality' },
    ]
};
