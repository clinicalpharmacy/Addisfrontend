export const sampleTestRules = [
    {
        id: 'RULE_INFANT_01',
        rule_name: 'Infant Tetracycline Contraindication',
        rule_type: 'pediatric_check',
        rule_description: 'Tetracycline contraindicated in infants due to tooth discoloration',
        rule_condition: {
            all: [
                { fact: 'age_in_days', operator: '<', value: 365 },
                { fact: 'medications', operator: 'contains', value: 'tetracycline' }
            ]
        },
        rule_action: {
            message: 'Tetracycline contraindicated in infant',
            recommendation: 'Tetracycline is contraindicated in children under 8 years due to permanent tooth discoloration. Consider alternative antibiotic: amoxicillin or azithromycin.',
            severity: 'critical'
        },
        severity: 'critical',
        dtp_category: 'contraindication',
        is_active: true,
        applies_to: ['neonate', 'infant', 'pediatric']
    },
    {
        id: 'RULE_INFANT_02',
        rule_name: 'Infant NSAID Risk',
        rule_type: 'pediatric_check',
        rule_description: 'NSAIDs caution in infants with dehydration or renal impairment',
        rule_condition: {
            all: [
                { fact: 'age_in_days', operator: '<', value: 365 },
                { fact: 'medications', operator: 'contains', value: 'ibuprofen' },
                { fact: 'labs.creatinine', operator: '>', value: 0.5 }
            ]
        },
        rule_action: {
            message: 'NSAID use in infant with elevated creatinine',
            recommendation: 'Ibuprofen may worsen renal function in infants with elevated creatinine ({{labs.creatinine}}). Monitor renal function closely or consider acetaminophen for fever/pain.',
            severity: 'high'
        },
        severity: 'high',
        dtp_category: 'dose_error',
        is_active: true,
        applies_to: ['neonate', 'infant']
    },
    {
        id: 'RULE_INFANT_03',
        rule_name: 'Infant Gentamicin Dose Check',
        rule_type: 'dose_check',
        rule_description: 'Gentamicin requires weight-based dosing and serum level monitoring',
        rule_condition: {
            all: [
                { fact: 'age_in_days', operator: '<', value: 365 },
                { fact: 'medications', operator: 'contains', value: 'gentamicin' }
            ]
        },
        rule_action: {
            message: 'Gentamicin prescribed for infant',
            recommendation: 'Gentamicin requires weight-based dosing for infants. Calculate dose based on {{weight}} kg. Monitor serum levels to avoid toxicity.',
            severity: 'high'
        },
        severity: 'high',
        dtp_category: 'monitoring_needed',
        is_active: true,
        applies_to: ['neonate', 'infant']
    },
    {
        id: 'RULE_GERI_01',
        rule_name: 'Elderly Warfarin + NSAID Interaction',
        rule_type: 'drug_interaction',
        rule_description: 'Increased bleeding risk with warfarin and NSAIDs in elderly',
        rule_condition: {
            all: [
                { fact: 'age', operator: '>', value: 65 },
                { fact: 'medications', operator: 'contains', value: 'warfarin' },
                { fact: 'medications', operator: 'contains', value: 'ibuprofen' }
            ]
        },
        rule_action: {
            message: 'High bleeding risk: Warfarin + NSAID in elderly',
            recommendation: 'Concurrent use of warfarin and NSAIDs increases bleeding risk in patients >65 years. Monitor INR closely (current: {{labs.inr}}) and consider alternative analgesia (acetaminophen).',
            severity: 'high'
        },
        severity: 'high',
        dtp_category: 'drug_interaction',
        is_active: true,
        applies_to: ['geriatric']
    },
    {
        id: 'RULE_GERI_02',
        rule_name: 'Elderly ACE Inhibitor + Hyperkalemia Risk',
        rule_type: 'drug_interaction',
        rule_description: 'ACE inhibitor + potassium-sparing diuretic causing hyperkalemia in elderly',
        rule_condition: {
            all: [
                { fact: 'age', operator: '>', value: 65 },
                { fact: 'medications', operator: 'contains', value: 'lisinopril' },
                { fact: 'medications', operator: 'contains', value: 'spironolactone' },
                { fact: 'labs.potassium', operator: '>', value: 5.0 }
            ]
        },
        rule_action: {
            message: 'Hyperkalemia risk: ACE inhibitor + Spironolactone in elderly',
            recommendation: 'Combination of ACE inhibitor (lisinopril) and potassium-sparing diuretic (spironolactone) increases hyperkalemia risk in elderly. Potassium is {{labs.potassium}} (high). Consider dose adjustment or alternative.',
            severity: 'critical'
        },
        severity: 'critical',
        dtp_category: 'drug_interaction',
        is_active: true,
        applies_to: ['geriatric', 'renal_impairment']
    }
];
