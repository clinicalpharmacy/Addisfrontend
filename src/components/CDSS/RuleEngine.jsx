// src/components/CDSS/RuleEngine.js - COMPLETE VERSION WITH PAIR SUPPORT
import api from '../../utils/api';

// Helper function to safely parse JSON
const safeJsonParse = (str, defaultValue = {}) => {
    if (!str || typeof str !== 'string') return defaultValue;
    try {
        return JSON.parse(str);
    } catch (e) {
        console.warn('JSON parse error:', e, 'String:', str.substring(0, 100));
        return defaultValue;
    }
};

export const mapPatientToFacts = (patientData, medicationHistory = []) => {
    if (!patientData) return {};

    console.log('🔍 Mapping patient to facts - RAW DATA:', {
        age: patientData.age,
        age_in_days: patientData.age_in_days,
        date_of_birth: patientData.date_of_birth,
        patient_type: patientData.patient_type
    });

    // ✅ FIXED: AGE IN DAYS EXTRACTION
    let ageInDays = 0;
    let calculatedAge = 0;

    // Method 1: Direct age_in_days from patient data (highest priority)
    if (patientData.age_in_days !== undefined && patientData.age_in_days !== null && patientData.age_in_days !== '') {
        const val = parseInt(patientData.age_in_days);
        if (!isNaN(val)) {
            ageInDays = val;
            console.log(`✅ Using direct age_in_days from patient: ${ageInDays}`);
        }
    }

    // Method 2: If patientData has an "age" field (in years), convert to days
    if (!ageInDays && patientData.age !== undefined && patientData.age !== null && patientData.age !== '') {
        const ageYears = parseFloat(patientData.age);
        if (!isNaN(ageYears)) {
            // For age less than 1 year, use decimal precision
            if (ageYears < 1) {
                ageInDays = Math.round(ageYears * 365.25);
                console.log(`✅ Converted age ${ageYears} years to ${ageInDays} days`);
            } else {
                // For older ages, we'll use the age field for general rules
                // but still need days for neonate/infant rules
                ageInDays = Math.round(ageYears * 365.25);
                console.log(`✅ Converted ${ageYears} years to ~${ageInDays} days for pediatric rules`);
            }
            calculatedAge = Math.floor(ageYears);
        }
    }

    // Method 3: Calculate from date_of_birth
    if (!ageInDays && patientData.date_of_birth) {
        try {
            const birthDate = new Date(patientData.date_of_birth);
            const today = new Date();

            if (!isNaN(birthDate.getTime())) {
                const diffTime = today - birthDate;
                ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                console.log(`✅ Calculated ${ageInDays} days from date_of_birth: ${patientData.date_of_birth}`);

                // Also calculate age in years
                calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();

                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
            }
        } catch (error) {
            console.warn('❌ Error calculating age from date_of_birth:', error);
        }
    }

    // ✅ FIXED: Always use the patient's age if available
    const age = parseInt(patientData.age) || calculatedAge || 0;

    // ✅ FIXED: Pregnancy detection
    let pregnancy = false;
    let pregnancyWeeks = 0;
    let pregnancyTrimester = '';

    if (patientData.is_pregnant !== undefined) {
        pregnancy = patientData.is_pregnant === true || patientData.is_pregnant === 'true';
    }

    if (patientData.pregnancy_weeks) {
        pregnancyWeeks = parseFloat(patientData.pregnancy_weeks) || 0;
    }

    if (patientData.pregnancy_trimester) {
        pregnancyTrimester = patientData.pregnancy_trimester;
    }

    // ✅ FIXED: Allergies extraction
    let allergies = [];
    if (Array.isArray(patientData.allergies)) {
        allergies = patientData.allergies.map(a => {
            if (typeof a === 'string') return a.toLowerCase().trim();
            if (a && typeof a === 'object' && a.name) return a.name.toLowerCase().trim();
            return String(a).toLowerCase().trim();
        }).filter(a => a && a !== '');
    } else if (patientData.allergies) {
        if (typeof patientData.allergies === 'string') {
            try {
                const parsed = JSON.parse(patientData.allergies);
                if (Array.isArray(parsed)) {
                    allergies = parsed.map(a => String(a).toLowerCase().trim()).filter(a => a);
                }
            } catch {
                allergies = patientData.allergies.split(',')
                    .map(a => a.trim().toLowerCase())
                    .filter(a => a);
            }
        }
    }

    // ✅ COMPREHENSIVE: Initialize facts with ALL patient details inputs
    const facts = {
        // ===== DEMOGRAPHICS =====
        age: age,
        age_in_days: ageInDays,
        age_days: ageInDays,
        gender: (patientData.gender || '').toLowerCase(),
        full_name: patientData.full_name || '',
        contact_number: patientData.contact_number || '',
        address: patientData.address || '',
        patient_id: patientData.id || '',
        patient_code: patientData.id || '',

        // ===== PREGNANCY INFORMATION =====
        pregnancy: pregnancy,
        is_pregnant: pregnancy,
        pregnancy_weeks: pregnancyWeeks,
        pregnancy_trimester: pregnancyTrimester,
        edd: patientData.edd || '',
        pregnancy_notes: patientData.pregnancy_notes || '',

        // ===== LACTATION INFORMATION =====
        lactating: patientData.is_lactating === true || patientData.is_lactating === 'true',
        is_lactating: patientData.is_lactating === true || patientData.is_lactating === 'true',
        lactation_notes: patientData.lactation_notes || '',

        // ===== LABS - Organized in nested structure =====
        labs: {},

        // ===== MEDICATIONS =====
        medications: [],
        medication_names: [],
        medication_classes: [],

        // ===== ALLERGIES & CONDITIONS =====
        allergies: allergies,
        conditions: patientData.diagnosis ? [patientData.diagnosis] : [],
        diagnosis: patientData.diagnosis || '',

        // ===== VITALS =====
        vitals: patientData.vitals || {},

        // ===== DIRECT VITALS VALUES FOR EASY ACCESS =====
        weight: 0,
        height: 0,
        length: 0,
        head_circumference: 0,
        bmi: 0,
        blood_pressure: '',
        heart_rate: 0,
        temperature: 0,
        respiratory_rate: 0,
        oxygen_saturation: 0,
        last_measured: patientData.last_measured || '',

        // ===== GROWTH PERCENTILES =====
        weight_percentile: 0,
        height_percentile: 0,
        head_circumference_percentile: 0,
        bmi_percentile: 0,

        // ===== PEDIATRIC INFORMATION =====
        developmental_milestones: patientData.developmental_milestones || '',
        feeding_method: patientData.feeding_method || '',
        birth_weight: 0,
        birth_length: 0,
        vaccination_status: patientData.vaccination_status || '',
        special_instructions: patientData.special_instructions || '',

        // ===== DIRECT LAB VALUES FOR EASY ACCESS =====
        // CBC (Complete Blood Count)
        hemoglobin: 0,
        hematocrit: 0,
        wbc_count: 0,
        rbc_count: 0,
        platelet_count: 0,
        mcv: 0,
        mch: 0,
        mchc: 0,
        rdw: 0,
        neutrophils: 0,
        lymphocytes: 0,
        monocytes: 0,
        eosinophils: 0,
        basophils: 0,

        // Chemistry
        creatinine: 0,
        bun: 0,
        urea: 0,
        uric_acid: 0,
        sodium: 0,
        potassium: 0,
        chloride: 0,
        bicarbonate: 0,
        calcium: 0,
        magnesium: 0,
        phosphate: 0,

        // Liver Function
        alt: 0,
        ast: 0,
        alp: 0,
        ggt: 0,
        bilirubin_total: 0,
        bilirubin_direct: 0,
        bilirubin_indirect: 0,
        albumin: 0,
        total_protein: 0,

        // Cardiac Markers
        troponin: 0,
        ck_mb: 0,
        ldh: 0,
        myoglobin: 0,

        // Thyroid Function
        tsh: 0,
        free_t4: 0,
        free_t3: 0,
        total_t4: 0,
        total_t3: 0,

        // Inflammatory Markers
        crp: 0,
        esr: 0,
        ferritin: 0,
        procalcitonin: 0,

        // Coagulation Profile
        inr: 0,
        pt: 0,
        ptt: 0,
        fibrinogen: 0,
        d_dimer: 0,

        // Urinalysis
        urine_protein: '',
        urine_glucose: '',
        urine_blood: '',
        urine_leukocytes: '',
        urine_nitrite: '',
        urine_specific_gravity: 0,
        urine_ph: 0,
        urine_ketones: '',
        urine_bilirubin: '',
        urine_urobilinogen: 0,

        // Diabetes Markers
        blood_sugar: 0,
        glucose: 0,
        fasting_glucose: 0,
        postprandial_glucose: 0,
        random_glucose: 0,
        hba1c: 0,
        insulin: 0,
        c_peptide: 0,

        // Lipid Profile
        total_cholesterol: 0,
        hdl_cholesterol: 0,
        ldl_cholesterol: 0,
        triglycerides: 0,
        vldl_cholesterol: 0,

        // Renal Function
        egfr: 0,

        // Pediatric/Neonatal Labs
        bilirubin_neonatal: 0,
        glucose_neonatal: 0,
        calcium_neonatal: 0,
        pku_result: '',
        thyroid_screening: '',

        // ===== COUNTS =====
        medication_count: 0,
        allergy_count: allergies.length,

        // ===== AGE CATEGORY FLAGS =====
        is_pediatric: false,
        is_neonate: false,
        is_infant: false,
        is_child: false,
        is_adolescent: false,
        is_adult: false,
        is_geriatric: false,

        // ===== ALIASES FOR EASY RULE WRITING =====
        patient_type: 'adult',
        is_newborn: false,
        is_baby: false,
        is_toddler: false,
        is_teenager: false,

        // ===== NUMERIC AGE CHECKS FOR PRECISE RULES =====
        is_age_under_28_days: false,
        is_age_under_1_year: false,
        is_age_1_to_12_years: false,
        is_age_13_to_18_years: false,
        is_age_over_18: false,
        is_age_over_65: false,

        // ===== APPOINTMENT INFORMATION =====
        appointment_date: patientData.appointment_date || '',
        is_active: patientData.is_active !== false,
        last_tested: patientData.last_tested || ''
    };

    // ✅ FIXED: AGE CATEGORY DETERMINATION (Allow 0 for newborns)
    if (ageInDays >= 0) {
        console.log(`📊 Determining age categories for ${ageInDays} days old patient`);

        // Set precise age flags
        facts.is_age_under_28_days = ageInDays <= 28;
        facts.is_age_under_1_year = ageInDays <= 365;
        facts.is_age_1_to_12_years = ageInDays > 365 && ageInDays <= (12 * 365);
        facts.is_age_13_to_18_years = ageInDays > (12 * 365) && ageInDays <= (18 * 365);
        facts.is_age_over_18 = ageInDays > (18 * 365);
        facts.is_age_over_65 = age >= 65;

        // Set category flags
        if (ageInDays <= 28) {
            facts.patient_type = 'neonate';
            facts.is_neonate = true;
            facts.is_newborn = true;
            facts.is_pediatric = true;
            console.log('👶 Patient classified as: NEONATE');
        } else if (ageInDays <= 365) {
            facts.patient_type = 'infant';
            facts.is_infant = true;
            facts.is_baby = true;
            facts.is_pediatric = true;
            console.log('🍼 Patient classified as: INFANT');
        } else if (ageInDays <= (12 * 365)) {
            facts.patient_type = 'child';
            facts.is_child = true;
            facts.is_pediatric = true;
            console.log('🧒 Patient classified as: CHILD');
        } else if (ageInDays <= (18 * 365)) {
            facts.patient_type = 'adolescent';
            facts.is_adolescent = true;
            facts.is_teenager = true;
            facts.is_pediatric = true;
            console.log('🧑‍🎓 Patient classified as: ADOLESCENT');
        } else if (age >= 65) {
            facts.patient_type = 'geriatric';
            facts.is_geriatric = true;
            facts.is_adult = true;
            console.log('👴 Patient classified as: GERIATRIC');
        } else {
            facts.patient_type = 'adult';
            facts.is_adult = true;
            console.log('👨 Patient classified as: ADULT');
        }
    } else if (age >= 0) {
        // Fallback using age in years (Allow 0)
        facts.is_age_over_65 = age >= 65;

        if (age < 1) {
            facts.patient_type = 'infant';
            facts.is_infant = true;
            facts.is_baby = true;
            facts.is_pediatric = true;
            facts.is_age_under_1_year = true;
        } else if (age <= 12) {
            facts.patient_type = 'child';
            facts.is_child = true;
            facts.is_pediatric = true;
            facts.is_age_1_to_12_years = true;
        } else if (age <= 18) {
            facts.patient_type = 'adolescent';
            facts.is_adolescent = true;
            facts.is_teenager = true;
            facts.is_pediatric = true;
            facts.is_age_13_to_18_years = true;
        } else if (age >= 65) {
            facts.patient_type = 'geriatric';
            facts.is_geriatric = true;
            facts.is_adult = true;
        } else {
            facts.patient_type = 'adult';
            facts.is_adult = true;
        }
    }

    // ✅ FIXED: EXTRACT MEDICATIONS
    facts.medication_data = {};
    if (Array.isArray(medicationHistory)) {
        let allIndications = [];
        let allConditions = facts.conditions || [];

        medicationHistory.forEach(med => {
            if (med && typeof med === 'object') {
                // Add indication to global collection if present
                if (med.indication) {
                    const ind = med.indication.toLowerCase().trim();
                    allIndications.push(ind);
                    allConditions.push(ind);
                }

                // Add medical_condition to global collection if present
                if (med.medical_condition) {
                    const cond = med.medical_condition.toLowerCase().trim();
                    allConditions.push(cond);
                }

                if (med.drug_name) {
                    const drugName = med.drug_name.toLowerCase().trim();
                    const drugKey = drugName.replace(/\s+/g, '_');

                    facts.medication_names.push(drugName);
                    facts.medications.push(drugName);

                    // Calculate days since start
                    let daysSinceStart = null;
                    if (med.start_date) {
                        try {
                            const startDate = new Date(med.start_date);
                            const today = new Date();
                            if (!isNaN(startDate.getTime())) {
                                const diffTime = today - startDate;
                                daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            }
                        } catch (e) {
                            console.warn('Error calculating drug duration:', e);
                        }
                    }

                    // Store full details for specific checks (dose, frequency, etc.)
                    facts.medication_data[drugKey] = {
                        dose: med.dose,
                        frequency: med.frequency,
                        roa: med.roa || med.route,
                        start_date: med.start_date,
                        days_since_start: daysSinceStart,
                        stop_date: med.stop_date,
                        status: med.status,
                        indication: med.indication,
                        medical_condition: med.medical_condition,
                        drug_name: med.drug_name,
                        drug_class: med.drug_class
                    };

                    if (med.generic_name) {
                        const genericName = med.generic_name.toLowerCase().trim();
                        facts.medications.push(genericName);
                        facts.medication_data[genericName.replace(/\s+/g, '_')] = facts.medication_data[drugKey];
                    }

                    if (med.brand_name) {
                        const brandName = med.brand_name.toLowerCase().trim();
                        facts.medications.push(brandName);
                        facts.medication_data[brandName.replace(/\s+/g, '_')] = facts.medication_data[drugKey];
                    }
                }

                if (med.drug_class) {
                    const drugClass = med.drug_class.toLowerCase().trim();
                    facts.medication_classes.push(drugClass);
                    facts.medications.push(drugClass);
                }
            }
        });

        facts.medications = [...new Set(facts.medications)];
        facts.medication_names = [...new Set(facts.medication_names)];
        facts.medication_classes = [...new Set(facts.medication_classes)];
        facts.indication_names = [...new Set(allIndications)];
        facts.conditions = [...new Set(allConditions.filter(c => c))];
        facts.medication_count = facts.medication_names.length;
    }

    // ✅ COMPLETE: EXTRACT ALL LAB VALUES FROM PATIENT FORM
    const extractLabValue = (source, key) => {
        if (!source) return null;

        // Helper to check object recursively
        const findValue = (obj, targetKey) => {
            if (!obj || typeof obj !== 'object') return null;

            const variations = [
                targetKey,
                targetKey.toLowerCase(),
                targetKey.replace(/_/g, ' '),
                targetKey.replace(/ /g, '_'),
                targetKey.replace(/_/g, '')
            ];

            for (const v of variations) {
                if (obj[v] !== undefined && obj[v] !== null && obj[v] !== '') return obj[v];
            }

            // Check nested 'labs' or 'labs.labs'
            if (obj.labs) {
                const nested = obj.labs.labs || obj.labs;
                const val = findValue(nested, targetKey);
                if (val !== null) return val;
            }

            return null;
        };

        return findValue(source, key);
    };

    const getULNFromRange = (rangeText) => {
        if (!rangeText) return null;
        const text = String(rangeText).trim();

        // Patterns: "0-40", "< 40", "10 - 45", "Up to 40"
        const matches = text.match(/[-\s]([0-9.]+)\s*$/) ||
            text.match(/<\s*([0-9.]+)/) ||
            text.match(/(\d+\.?\d*)\s*$/);

        if (matches && matches[1]) {
            const val = parseFloat(matches[1]);
            return !isNaN(val) ? val : null;
        }
        return null;
    };

    // Fallback registry for standard lab limits. Clinicians can refine these in LabSettings.
    const labDefinitions = {
        creatinine: { name: 'Creatinine', range_male: '0.7-1.3', range_female: '0.6-1.1', unit: 'mg/dL' },
        hemoglobin: { name: 'Hemoglobin', range_male: '13.8-17.2', range_female: '12.1-15.1', unit: 'g/dL' },
        alt: { name: 'ALT', range_male: '0-40', range_female: '0-40', unit: 'U/L' },
        ast: { name: 'AST', range_male: '0-40', range_female: '0-40', unit: 'U/L' },
        alp: { name: 'ALP', range_male: '44-147', range_female: '44-147', unit: 'U/L' },
        bilirubin_total: { name: 'Total Bilirubin', range_male: '0.1-1.2', range_female: '0.1-1.2', unit: 'mg/dL' }
    };

    // COMPLETE list of ALL lab tests from your PatientDetails form
    const allLabs = [
        // ===== COMPLETE BLOOD COUNT (CBC) =====
        'hemoglobin', 'hematocrit', 'wbc_count', 'rbc_count', 'platelet_count',
        'mcv', 'mch', 'mchc', 'rdw', 'neutrophils', 'lymphocytes', 'monocytes',
        'eosinophils', 'basophils',

        // ===== BASIC CHEMISTRY =====
        'blood_sugar', 'creatinine', 'urea', 'uric_acid',

        // ===== ELECTROLYTES =====
        'sodium', 'potassium', 'chloride', 'bicarbonate',

        // ===== MINERALS =====
        'calcium', 'magnesium', 'phosphate',

        // ===== LIVER FUNCTION TESTS =====
        'alt', 'ast', 'alp', 'ggt', 'bilirubin_total', 'bilirubin_direct',
        'bilirubin_indirect', 'albumin', 'total_protein',

        // ===== CARDIAC MARKERS =====
        'troponin', 'ck_mb', 'ldh', 'myoglobin',

        // ===== THYROID FUNCTION =====
        'tsh', 'free_t4', 'free_t3', 'total_t4', 'total_t3',

        // ===== INFLAMMATORY MARKERS =====
        'crp', 'esr', 'ferritin', 'procalcitonin',

        // ===== COAGULATION PROFILE =====
        'inr', 'pt', 'ptt', 'fibrinogen', 'd_dimer',

        // ===== URINALYSIS NUMERIC VALUES =====
        'urine_specific_gravity', 'urine_ph', 'urine_urobilinogen',

        // ===== DIABETES MARKERS =====
        'hba1c', 'fasting_glucose', 'postprandial_glucose', 'random_glucose',
        'insulin', 'c_peptide',

        // ===== LIPID PROFILE =====
        'total_cholesterol', 'hdl_cholesterol', 'ldl_cholesterol',
        'triglycerides', 'vldl_cholesterol',

        // ===== RENAL FUNCTION =====
        'egfr', 'bun',
        'zinc',

        // ===== PEDIATRIC/NEONATAL LABS =====
        'bilirubin_neonatal', 'glucose_neonatal', 'calcium_neonatal'
    ];

    // ✅ COMPLETE: EXTRACT ALL LAB VALUES FROM PATIENT FORM (INCLUDING FLATTENED)
    allLabs.forEach(lab => {
        // Search in top-level, nested 'labs', and aliases
        const value = extractLabValue(patientData, lab);
        
        if (value !== null && value !== '') {
            let val = parseFloat(value);
            const factValue = !isNaN(val) ? val : value;
            
            // Populate facts.labs and top-level facts
            facts.labs[lab] = factValue;
            if (facts[lab] === undefined || facts[lab] === 0 || facts[lab] === null) {
                facts[lab] = factValue;
            }

            // Auto-calculate ULN multipliers for standard labs
            const stdKey = lab;
            if (!isNaN(val) && val !== null) {
                let activeULN = null;
                
                // Fallback: Use the range from labDefinitions based on gender
                if (labDefinitions[stdKey]) {
                    const defs = labDefinitions[stdKey];
                    const isFemale = facts.gender && ['female', 'f'].includes(facts.gender.toLowerCase());
                    const defRange = isFemale && defs.range_female ? defs.range_female : defs.range_male;
                    const finalRange = defRange || defs.range;
                    if (finalRange) {
                        activeULN = getULNFromRange(finalRange);
                    }
                }

                if (activeULN > 0) {
                    const multiplier = val / activeULN;
                    facts[`${stdKey}_x_uln`] = multiplier;
                    facts.labs[`${stdKey}_x_uln`] = multiplier;
                }
            }
        }
    });

    // ✅ FIXED: Handle patientData.labs if it's a string (JSONB) or nested object
    if (patientData.labs) {
        let sourceLabs = patientData.labs;
        if (typeof sourceLabs === 'string') {
            try {
                sourceLabs = JSON.parse(sourceLabs);
            } catch {
                sourceLabs = {};
            }
        }

        sourceLabs = sourceLabs.labs || sourceLabs;

        if (sourceLabs && typeof sourceLabs === 'object') {
            // Common mappings for System Labs -> Standard Keys
            const labAliases = {
                'c_reactive_protein': 'crp', 'c-reactive_protein': 'crp',
                'high_sensitivity_crp': 'crp', 'hs_crp': 'crp',
                'erythrocyte_sedimentation_rate': 'esr',
                'thyroid_stimulating_hormone': 'tsh',
                'blood_sugar_fasting': 'fasting_glucose', 'fasting_blood_sugar': 'fasting_glucose',
                'random_blood_sugar': 'random_glucose', 'rbs': 'random_glucose',
                'post_prandial_blood_sugar': 'postprandial_glucose', 'ppbs': 'postprandial_glucose',
                'glycosylated_hemoglobin': 'hba1c', 'hemoglobin_a1c': 'hba1c',
                'white_blood_cell_count': 'wbc_count', 'wbc': 'wbc_count',
                'red_blood_cell_count': 'rbc_count', 'rbc': 'rbc_count',
                'platelet_count': 'platelet_count', 'platelets': 'platelet_count',
                'blood_urea_nitrogen': 'bun',
                'low_density_lipoprotein': 'ldl_cholesterol', 'ldl': 'ldl_cholesterol',
                'high_density_lipoprotein': 'hdl_cholesterol', 'hdl': 'hdl_cholesterol',
                'total_cholesterol_count': 'total_cholesterol',
                'alanine_aminotransferase': 'alt', 'sgpt': 'alt',
                'aspartate_aminotransferase': 'ast', 'sgot': 'ast'
            };

            Object.keys(sourceLabs).forEach(lab => {
                const entry = sourceLabs[lab];
                if (entry !== null && entry !== '') {
                    let val = null;
                    if (typeof entry === 'object' && entry !== null) {
                        val = parseFloat(entry.result || entry.value || entry.val);
                    } else {
                        val = parseFloat(entry);
                    }

                    const normalizedLab = lab.toLowerCase().trim();
                    const snakeCaseLab = normalizedLab.replace(/[ -]/g, '_');
                    const factValue = !isNaN(val) ? val : entry;

                    // Apply aliases
                    const stdKey = labAliases[snakeCaseLab] || snakeCaseLab;
                    if (labAliases[snakeCaseLab]) {
                        const alias = labAliases[snakeCaseLab];
                        facts.labs[alias] = factValue;
                        if (facts[alias] === undefined) facts[alias] = factValue;
                    }

                    if (facts.labs[normalizedLab] === undefined) {
                        facts.labs[normalizedLab] = factValue;
                    }
                    if (facts[normalizedLab] === undefined || facts[normalizedLab] === 0) {
                        facts[normalizedLab] = factValue;
                    }
                }
            });
        }
    }

    // ✅ COMPLETE: EXTRACT URINALYSIS TEXT VALUES
    const urinalysisTextFields = [
        'urine_protein', 'urine_glucose', 'urine_blood', 'urine_leukocytes',
        'urine_nitrite', 'urine_ketones', 'urine_bilirubin'
    ];

    urinalysisTextFields.forEach(field => {
        if (patientData[field]) {
            facts[field] = patientData[field];
            facts.labs[field] = patientData[field];
        }
    });

    // ✅ COMPLETE: EXTRACT PEDIATRIC INFORMATION
    const extractPediatricValue = (value) => {
        if (!value || value === '' || value === null) return 0;
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };

    // Pediatric numeric values
    facts.birth_weight = extractPediatricValue(patientData.birth_weight);
    facts.birth_length = extractPediatricValue(patientData.birth_length);
    facts.weight_percentile = extractPediatricValue(patientData.weight_percentile);
    facts.height_percentile = extractPediatricValue(patientData.height_percentile);
    facts.head_circumference_percentile = extractPediatricValue(patientData.head_circumference_percentile);
    facts.bmi_percentile = extractPediatricValue(patientData.bmi_percentile);

    // Pediatric text fields
    const pediatricTextFields = [
        'pku_result', 'thyroid_screening', 'developmental_milestones',
        'feeding_method', 'vaccination_status', 'special_instructions'
    ];

    pediatricTextFields.forEach(field => {
        if (patientData[field]) {
            facts[field] = patientData[field];
        }
    });

    // ✅ COMPLETE: EXTRACT VITALS
    const extractVitalValue = (source, key) => {
        if (!source) return null;

        const keyVariations = [
            key,
            key.toLowerCase(),
            key.replace(/_/g, ' '),
            key.replace(/ /g, '_'),
            `vital_${key}`,
            `${key}_vital`
        ];

        for (const variation of keyVariations) {
            if (source[variation] !== undefined && source[variation] !== null && source[variation] !== '') {
                if (variation.includes('blood_pressure') || variation.includes('bp')) {
                    return source[variation]; // BP is a string
                }
                const value = parseFloat(source[variation]);
                if (!isNaN(value)) return value;
                return source[variation];
            }
        }

        return null;
    };

    // All vitals from your form
    const allVitals = [
        'weight', 'height', 'length', 'head_circumference', 'blood_pressure',
        'heart_rate', 'temperature', 'respiratory_rate', 'oxygen_saturation'
    ];

    // Check vitals object
    if (patientData.vitals && typeof patientData.vitals === 'object') {
        allVitals.forEach(vital => {
            const value = extractVitalValue(patientData.vitals, vital);
            if (value !== null) {
                facts.vitals[vital] = value;
                facts[vital] = value; // Set direct property
            }
        });
    }

    // Check patientData directly for vitals
    allVitals.forEach(vital => {
        if ((facts[vital] === 0 || facts[vital] === '' || facts[vital] === null) && vital !== 'blood_pressure') {
            const value = extractVitalValue(patientData, vital);
            if (value !== null) {
                facts.vitals[vital] = value;
                facts[vital] = value;
            }
        } else if (vital === 'blood_pressure' && !facts.blood_pressure) {
            const value = extractVitalValue(patientData, vital);
            if (value !== null) {
                facts.vitals[vital] = value;
                facts[vital] = value;
            }
        }
    });

    // Parse Blood Pressure (e.g. "120/80")
    if (facts.blood_pressure && typeof facts.blood_pressure === 'string' && facts.blood_pressure.includes('/')) {
        const [sys, dia] = facts.blood_pressure.split('/').map(v => parseFloat(v));
        if (!isNaN(sys)) {
            facts.systolic_bp = sys;
            facts.vitals.systolic_bp = sys;
        }
        if (!isNaN(dia)) {
            facts.diastolic_bp = dia;
            facts.vitals.diastolic_bp = dia;
        }
    }

    // ✅ FIXED: CALCULATE BMI
    const weightToUse = facts.weight || facts.vitals.weight || 0;
    const heightToUse = facts.height || facts.vitals.height || 0;

    if (weightToUse > 0 && heightToUse > 0) {
        facts.bmi = weightToUse / Math.pow(heightToUse / 100, 2);
        facts.labs.bmi = facts.bmi;
    }

    // ✅ FIXED: CALCULATE eGFR (if we have creatinine, age, and gender)
    if (facts.creatinine > 0 && facts.age > 0 && facts.gender) {
        let k = facts.gender === 'female' ? 0.7 : 0.9;
        let a = facts.gender === 'female' ? -0.329 : -0.411;

        let egfr = 141 * Math.pow(Math.min(facts.creatinine / k, 1), a) *
            Math.pow(Math.max(facts.creatinine / k, 1), -1.209) *
            Math.pow(0.993, facts.age);

        if (facts.gender === 'female') {
            egfr = egfr * 1.018;
        }

        facts.egfr = Math.round(egfr * 10) / 10;
        facts.labs.egfr = facts.egfr;
    }

    // ✅ ADDITIONAL CALCULATIONS
    // Calculate BUN/Creatinine ratio
    if (facts.bun > 0 && facts.creatinine > 0) {
        facts.bun_creatinine_ratio = facts.bun / facts.creatinine;
        facts.labs.bun_creatinine_ratio = facts.bun_creatinine_ratio;
    }

    // Calculate Anion Gap
    if (facts.sodium > 0 && facts.chloride > 0 && facts.bicarbonate > 0) {
        facts.anion_gap = facts.sodium - (facts.chloride + facts.bicarbonate);
        facts.labs.anion_gap = facts.anion_gap;
    }

    // Calculate Direct/Indirect bilirubin ratio
    if (facts.bilirubin_direct > 0 && facts.bilirubin_indirect > 0) {
        facts.bilirubin_ratio = facts.bilirubin_direct / facts.bilirubin_indirect;
        facts.labs.bilirubin_ratio = facts.bilirubin_ratio;
    }

    // Calculate AST/ALT ratio and ULN multipliers
    if (facts.ast > 0 || facts.alt > 0) {
        const ULN = 40; // Standard Upper Limit of Normal

        if (facts.ast > 0 && facts.alt > 0) {
            facts.ast_alt_ratio = facts.ast / facts.alt;
            facts.labs.ast_alt_ratio = facts.ast_alt_ratio;
        }

        if (facts.alt > 0) {
            facts.alt_x_uln = facts.alt / ULN;
            facts.labs.alt_x_uln = facts.alt_x_uln;
        }

        if (facts.ast > 0) {
            facts.ast_x_uln = facts.ast / ULN;
            facts.labs.ast_x_uln = facts.ast_x_uln;
        }
    }

    // Calculate Cholesterol ratios
    if (facts.total_cholesterol > 0 && facts.hdl_cholesterol > 0) {
        facts.total_hdl_ratio = facts.total_cholesterol / facts.hdl_cholesterol;
        facts.labs.total_hdl_ratio = facts.total_hdl_ratio;
    }

    if (facts.ldl_cholesterol > 0 && facts.hdl_cholesterol > 0) {
        facts.ldl_hdl_ratio = facts.ldl_cholesterol / facts.hdl_cholesterol;
        facts.labs.ldl_hdl_ratio = facts.ldl_hdl_ratio;
    }

    // ✅ Facts generation complete

    return facts;
};

// ✅ formatAlertMessage function
export const formatAlertMessage = (template, facts) => {
    if (!template || typeof template !== 'string') return template || '';
    if (!facts) return template;

    let result = template;

    const placeholders = template.match(/\{\{([^}]+)\}\}/g) || [];

    placeholders.forEach(placeholder => {
        const fieldMatch = placeholder.match(/\{\{([^}]+)\}\}/);
        if (!fieldMatch) return;

        const fieldPath = fieldMatch[1].trim();
        let value = undefined;

        // Direct access
        if (facts[fieldPath] !== undefined) {
            value = facts[fieldPath];
        }
        // Nested access
        else if (fieldPath.includes('.')) {
            const parts = fieldPath.split('.');
            let current = facts;
            let found = true;

            for (const part of parts) {
                if (current && typeof current === 'object' && current[part] !== undefined) {
                    current = current[part];
                } else {
                    found = false;
                    break;
                }
            }

            if (found) {
                value = current;
            }
        }
        // Labs access
        else if (facts.labs && facts.labs[fieldPath] !== undefined) {
            value = facts.labs[fieldPath];
        }
        // Vitals access
        else if (facts.vitals && facts.vitals[fieldPath] !== undefined) {
            value = facts.vitals[fieldPath];
        }

        // Format value
        if (value !== undefined) {
            if (typeof value === 'number') {
                // Format based on the type of value
                if (fieldPath.includes('creatinine') ||
                    fieldPath.includes('potassium') ||
                    fieldPath.includes('sodium') ||
                    fieldPath.includes('calcium') ||
                    fieldPath.includes('magnesium') ||
                    fieldPath.includes('phosphate') ||
                    fieldPath.includes('inr') ||
                    fieldPath.includes('hba1c') ||
                    fieldPath.includes('uric_acid') ||
                    fieldPath.includes('urea')) {
                    value = value.toFixed(1);
                } else if (fieldPath.includes('egfr') ||
                    fieldPath.includes('age') ||
                    fieldPath.includes('bmi') ||
                    fieldPath.includes('pregnancy_weeks') ||
                    fieldPath.includes('age_in_days') ||
                    fieldPath.includes('age_days') ||
                    fieldPath.includes('weight') ||
                    fieldPath.includes('height') ||
                    fieldPath.includes('platelet_count') ||
                    fieldPath.includes('wbc_count') ||
                    fieldPath.includes('rbc_count')) {
                    value = Math.round(value);
                } else if (fieldPath.includes('temperature') ||
                    fieldPath.includes('heart_rate') ||
                    fieldPath.includes('respiratory_rate') ||
                    fieldPath.includes('oxygen_saturation')) {
                    value = value.toFixed(0);
                } else {
                    value = value.toFixed(1);
                }
            } else if (typeof value === 'boolean') {
                value = value ? 'Yes' : 'No';
            }

            result = result.replace(placeholder, value.toString());
        } else {
            result = result.replace(placeholder, 'N/A');
        }
    });

    return result;
};

// ✅ evaluateSingleCondition function
const evaluateSingleCondition = (condition, facts, debug = false) => {
    const { fact, operator, value } = condition;

    if (debug) {
        console.log(`  Evaluating: ${fact} ${operator} "${value}"`);
    }

    let patientValue = undefined;

    // Handle dot notation
    if (fact.includes('.')) {
        const parts = fact.split('.');
        let current = facts;

        for (const part of parts) {
            if (current && typeof current === 'object') {
                const partLower = part.toLowerCase();
                // Try direct match
                if (current[part] !== undefined) {
                    current = current[part];
                }
                // Try lowercase match
                else if (current[partLower] !== undefined) {
                    current = current[partLower];
                }
                // Try variation match (snake_case vs normal)
                else {
                    const variations = [
                        partLower.replace(/_/g, ' '),
                        partLower.replace(/ /g, '_'),
                        partLower.replace(/_/g, '')
                    ];
                    let found = false;
                    for (const v of variations) {
                        if (current[v] !== undefined) {
                            current = current[v];
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        patientValue = undefined;
                        break;
                    }
                }
            } else {
                patientValue = undefined;
                break;
            }
        }

        if (current !== facts) {
            patientValue = current;
        }
    } else {
        patientValue = facts[fact];
    }

    // Special handling for common values
    if (patientValue === undefined) {
        const factLower = fact.toLowerCase();

        // Check age-related facts
        if (factLower.includes('age') || factLower.includes('pediatric') ||
            factLower.includes('neonate') || factLower.includes('infant') ||
            factLower.includes('child') || factLower.includes('adolescent')) {

            // Map fact names to our flag names
            const factMapping = {
                'age_in_days': facts.age_in_days,
                'age_days': facts.age_in_days,
                'is_pediatric': facts.is_pediatric,
                'is_neonate': facts.is_neonate,
                'is_infant': facts.is_infant,
                'is_child': facts.is_child,
                'is_adolescent': facts.is_adolescent,
                'is_age_under_28_days': facts.is_age_under_28_days,
                'is_age_under_1_year': facts.is_age_under_1_year,
                'patient_type': facts.patient_type,
                'is_newborn': facts.is_newborn,
                'is_baby': facts.is_baby,
                'is_teenager': facts.is_teenager
            };

            patientValue = factMapping[fact] !== undefined ? factMapping[fact] : factMapping[factLower];
        }

        // Check labs
        if (patientValue === undefined && facts.labs) {
            // Try direct, then lowercase
            patientValue = facts.labs[fact] !== undefined ? facts.labs[fact] : facts.labs[factLower];

            // If still not found, try common variations (spaces instead of underscores, etc.)
            if (patientValue === undefined) {
                const variations = [
                    factLower.replace(/_/g, ' '),
                    factLower.replace(/ /g, '_'),
                    factLower.replace(/_/g, '')
                ];
                for (const v of variations) {
                    if (facts.labs[v] !== undefined) {
                        patientValue = facts.labs[v];
                        break;
                    }
                }
            }
        }

        // Check vitals
        if (patientValue === undefined && facts.vitals && facts.vitals[fact]) {
            patientValue = facts.vitals[fact];
        }

        // Check direct properties
        if (patientValue === undefined && facts[factLower] !== undefined) {
            patientValue = facts[factLower];
        }
    }

    if (debug) {
        console.log(`    🔍 Condition Check: "${fact}" ${operator} "${value}"`);
        console.log(`    📊 Patient Value:`, patientValue, `(Type: ${typeof patientValue})`);
    }

    // Handle undefined/null
    if (patientValue === undefined || patientValue === null) {
        if (debug) console.log(`    ❌ Value is undefined/null`);
        if (operator === 'exists') return false;
        if (operator === 'not_exists') return true;
        return false;
    }

    // Handle array contains
    if (operator === 'contains') {
        const searchValue = value.toString().toLowerCase().trim();

        if (Array.isArray(patientValue)) {
            return patientValue.some(item => {
                const itemStr = String(item).toLowerCase().trim();
                return itemStr.includes(searchValue) || itemStr === searchValue;
            });
        }

        return String(patientValue).toLowerCase().includes(searchValue);
    }

    if (operator === 'not_contains') {
        const searchValue = value.toString().toLowerCase().trim();

        if (Array.isArray(patientValue)) {
            return !patientValue.some(item =>
                String(item).toLowerCase().includes(searchValue)
            );
        }

        return !String(patientValue).toLowerCase().includes(searchValue);
    }

    // Handle exists/not_exists
    if (operator === 'exists') {
        return patientValue !== undefined && patientValue !== null && patientValue !== '';
    }

    if (operator === 'not_exists') {
        return patientValue === undefined || patientValue === null || patientValue === '';
    }

    // Handle boolean values
    if (typeof patientValue === 'boolean' && typeof value === 'boolean') {
        switch (operator) {
            case '===':
            case '==':
            case 'equals':
                return patientValue === value;
            case '!==':
            case '!=':
            case 'not_equals':
                return patientValue !== value;
            default:
                return false;
        }
    }

    // Handle string boolean values
    if ((typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) ||
        (typeof patientValue === 'string' && (patientValue.toLowerCase() === 'true' || patientValue.toLowerCase() === 'false'))) {

        const patientBool = String(patientValue).toLowerCase() === 'true';
        const valueBool = String(value).toLowerCase() === 'true';

        switch (operator) {
            case '===':
            case '==':
            case 'equals':
                return patientBool === valueBool;
            case '!==':
            case '!=':
            case 'not_equals':
                return patientBool !== valueBool;
            default:
                break;
        }
    }

    // Handle numeric comparisons
    const numPatientValue = parseFloat(patientValue);
    const numValue = parseFloat(value);

    if (isNaN(numPatientValue) || isNaN(numValue)) {
        // String comparison
        const strPatientValue = String(patientValue).toLowerCase().trim();
        const strValue = String(value).toLowerCase().trim();

        switch (operator) {
            case '===':
            case '==':
            case 'equals':
                return strPatientValue === strValue;
            case '!==':
            case '!=':
            case 'not_equals':
                return strPatientValue !== strValue;
            case 'starts_with':
                return strPatientValue.startsWith(strValue);
            case 'ends_with':
                return strPatientValue.endsWith(strValue);
            default:
                return false;
        }
    }

    // Numeric operators
    switch (operator) {
        case '>': return numPatientValue > numValue;
        case '>=': return numPatientValue >= numValue;
        case '<': return numPatientValue < numValue;
        case '<=': return numPatientValue <= numValue;
        case '==':
        case 'equals':
            return Math.abs(numPatientValue - numValue) < 0.01;
        case '!=':
        case 'not_equals':
            return Math.abs(numPatientValue - numValue) >= 0.01;
        case 'between':
            if (Array.isArray(value) && value.length === 2) {
                const min = parseFloat(value[0]);
                const max = parseFloat(value[1]);
                return numPatientValue >= min && numPatientValue <= max;
            }
            return false;
        default:
            return false;
    }
};

// ✅ debugRuleEvaluation function
export const debugRuleEvaluation = (rule, facts) => {
    console.log('\n🔍 DEBUG RULE EVALUATION:');
    console.log('Rule Name:', rule.rule_name);
    console.log('Rule Type:', rule.rule_type || 'Clinical');

    let condition;
    try {
        condition = typeof rule.rule_condition === 'string'
            ? JSON.parse(rule.rule_condition)
            : rule.rule_condition;
    } catch (e) {
        console.error('❌ Error parsing condition:', e);
        return false;
    }

    if (!condition) {
        console.error('❌ No condition found');
        return false;
    }

    // Handle different condition structures
    if (condition.all) {
        console.log('Condition type: ALL (all must be true)');
        const allResults = condition.all.map((cond, index) => {
            // Check if this condition is a nested "any" or "all"
            if (cond.any) {
                console.log(`  [${index + 1}] Nested ANY condition:`);
                const anyResults = cond.any.map((nestedCond, nestedIndex) => {
                    const result = evaluateSingleCondition(nestedCond, facts, true);
                    console.log(`    [${index + 1}.${nestedIndex + 1}] ${nestedCond.fact} ${nestedCond.operator} ${nestedCond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
                    return result;
                });
                const anyResult = anyResults.some(r => r === true);
                console.log(`  [${index + 1}] Nested ANY result: ${anyResult ? '✅ PASS' : '❌ FAIL'}`);
                return anyResult;
            } else if (cond.all) {
                console.log(`  [${index + 1}] Nested ALL condition:`);
                const nestedAllResults = cond.all.map((nestedCond, nestedIndex) => {
                    const result = evaluateSingleCondition(nestedCond, facts, true);
                    console.log(`    [${index + 1}.${nestedIndex + 1}] ${nestedCond.fact} ${nestedCond.operator} ${nestedCond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
                    return result;
                });
                const allResult = nestedAllResults.every(r => r === true);
                console.log(`  [${index + 1}] Nested ALL result: ${allResult ? '✅ PASS' : '❌ FAIL'}`);
                return allResult;
            } else {
                // Single condition
                const result = evaluateSingleCondition(cond, facts, true);
                console.log(`  [${index + 1}] ${cond.fact} ${cond.operator} ${cond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
                return result;
            }
        });

        const finalResult = allResults.every(r => r === true);
        console.log(`\nALL condition final: ${finalResult ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
        return finalResult;
    }

    if (condition.any) {
        console.log('Condition type: ANY (any can be true)');
        const anyResults = condition.any.map((cond, index) => {
            // Check if this condition is a nested "any" or "all"
            if (cond.any) {
                console.log(`  [${index + 1}] Nested ANY condition:`);
                const nestedAnyResults = cond.any.map((nestedCond, nestedIndex) => {
                    const result = evaluateSingleCondition(nestedCond, facts, true);
                    console.log(`    [${index + 1}.${nestedIndex + 1}] ${nestedCond.fact} ${nestedCond.operator} ${nestedCond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
                    return result;
                });
                const anyResult = nestedAnyResults.some(r => r === true);
                console.log(`  [${index + 1}] Nested ANY result: ${anyResult ? '✅ PASS' : '❌ FAIL'}`);
                return anyResult;
            } else if (cond.all) {
                console.log(`  [${index + 1}] Nested ALL condition:`);
                const nestedAllResults = cond.all.map((nestedCond, nestedIndex) => {
                    const result = evaluateSingleCondition(nestedCond, facts, true);
                    console.log(`    [${index + 1}.${nestedIndex + 1}] ${nestedCond.fact} ${nestedCond.operator} ${nestedCond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
                    return result;
                });
                const allResult = nestedAllResults.every(r => r === true);
                console.log(`  [${index + 1}] Nested ALL result: ${allResult ? '✅ PASS' : '❌ FAIL'}`);
                return allResult;
            } else {
                // Single condition
                const result = evaluateSingleCondition(cond, facts, true);
                console.log(`  [${index + 1}] ${cond.fact} ${cond.operator} ${cond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
                return result;
            }
        });

        const finalResult = anyResults.some(r => r === true);
        console.log(`\nANY condition final: ${finalResult ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
        return finalResult;
    }

    // Single condition
    console.log('Condition type: SINGLE');
    const result = evaluateSingleCondition(condition, facts, true);
    console.log(`Single condition final: ${result ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
    return result;
};

// ✅ getMatchedMedications - finds which medications from a rule condition matched
const getMatchedMedications = (condition, facts) => {
    const matched = [];
    if (!condition || !facts) return matched;

    const checkConditions = (conditions) => {
        if (!Array.isArray(conditions)) return;
        conditions.forEach(cond => {
            // If this is a nested any/all, recurse into it
            if (cond.any) {
                checkConditions(cond.any);
            } else if (cond.all) {
                checkConditions(cond.all);
            } else if (cond.fact === 'medications' && cond.operator === 'contains' && cond.value) {
                const searchValue = cond.value.toString().toLowerCase().trim();
                const patientMeds = facts.medications || [];
                if (Array.isArray(patientMeds)) {
                    const found = patientMeds.some(med => {
                        const medStr = String(med).toLowerCase().trim();
                        return medStr.includes(searchValue) || medStr === searchValue;
                    });
                    if (found) {
                        // Capitalize first letter for display
                        const displayName = cond.value.charAt(0).toUpperCase() + cond.value.slice(1);
                        if (!matched.includes(displayName)) {
                            matched.push(displayName);
                        }
                    }
                }
            }
        });
    };

    let parsedCondition = condition;
    if (typeof condition === 'string') {
        try { parsedCondition = JSON.parse(condition); } catch (e) { return matched; }
    }

    if (parsedCondition.all) checkConditions(parsedCondition.all);
    if (parsedCondition.any) checkConditions(parsedCondition.any);

    return matched;
};

// ✅ getInteractionPairs - extracts specific drug pairs from rule conditions (handles nested ANY/ALL)
const getInteractionPairs = (condition, facts, rule) => {
    const pairs = [];
    if (!facts) return pairs;

    // Only process for interaction/incompatibility rules
    const ruleType = rule?.rule_type || '';
    if (ruleType !== 'drug_interaction' && ruleType !== 'incompatibility') {
        return pairs;
    }

    // Helper to check if a value matches any patient medication
    const findMatchingMedication = (searchValue) => {
        if (!searchValue) return null;
        const searchVal = searchValue.toString().toLowerCase().trim();
        const patientMeds = facts.medication_names || [];
        for (const med of patientMeds) {
            const medStr = String(med).toLowerCase().trim();
            if (medStr.includes(searchVal) || medStr === searchVal) {
                return med.charAt(0).toUpperCase() + med.slice(1);
            }
        }
        return null;
    };

    // Extract pairs from rule_action (if defined there)
    const extractPairsFromAction = () => {
        if (!rule) return [];
        
        let action = {};
        if (typeof rule.rule_action === 'string') {
            try {
                action = JSON.parse(rule.rule_action);
            } catch (e) {
                return [];
            }
        } else {
            action = rule.rule_action || {};
        }
        
        const foundPairs = [];
        
        // Check for drug_pairs array
        if (action.drug_pairs && Array.isArray(action.drug_pairs) && action.drug_pairs.length > 0) {
            action.drug_pairs.forEach(pair => {
                if (pair.drug_a && pair.drug_b) {
                    const drugA = findMatchingMedication(pair.drug_a);
                    const drugB = findMatchingMedication(pair.drug_b);
                    if (drugA && drugB) {
                        foundPairs.push({ drugA, drugB });
                    }
                }
            });
            return foundPairs;
        }
        
        // Check for single pair
        if (action.drug_a && action.drug_b) {
            const drugA = findMatchingMedication(action.drug_a);
            const drugB = findMatchingMedication(action.drug_b);
            if (drugA && drugB) {
                foundPairs.push({ drugA, drugB });
            }
            return foundPairs;
        }
        
        // Check for incompatibility_pairs
        if (action.incompatibility_pairs && Array.isArray(action.incompatibility_pairs)) {
            action.incompatibility_pairs.forEach(pair => {
                if (pair.drug_a && pair.drug_b) {
                    const drugA = findMatchingMedication(pair.drug_a);
                    const drugB = findMatchingMedication(pair.drug_b);
                    if (drugA && drugB) {
                        foundPairs.push({ drugA, drugB });
                    }
                }
            });
            return foundPairs;
        }
        
        return foundPairs;
    };

    // ✅ Extract pairs from the condition structure (handles nested ANY/ALL)
    const extractPairsFromCondition = () => {
        if (!condition) return [];
        const foundPairs = [];
        
        // Parse condition if it's a string
        let parsedCondition = condition;
        if (typeof condition === 'string') {
            try { parsedCondition = JSON.parse(condition); } catch (e) { return foundPairs; }
        }

        // Recursively find all medication pairs in the condition
        const findPairsInConditions = (conds) => {
            if (!conds) return;
            
            // Handle array of conditions
            if (Array.isArray(conds)) {
                // Check if this is an 'all' block with exactly 2 medication conditions
                const medicationConditions = conds.filter(c => 
                    c.fact === 'medications' && c.operator === 'contains' && c.value
                );
                
                // If we found exactly 2 medication conditions in this block, they form a pair
                if (medicationConditions.length === 2) {
                    const drugA = findMatchingMedication(medicationConditions[0].value);
                    const drugB = findMatchingMedication(medicationConditions[1].value);
                    if (drugA && drugB) {
                        // Check if this pair already exists
                        const exists = foundPairs.some(p => 
                            (p.drugA === drugA && p.drugB === drugB) ||
                            (p.drugA === drugB && p.drugB === drugA)
                        );
                        if (!exists) {
                            foundPairs.push({ drugA, drugB });
                        }
                    }
                }
                
                // Recursively process nested conditions
                conds.forEach(c => {
                    if (c.any) findPairsInConditions(c.any);
                    if (c.all) findPairsInConditions(c.all);
                });
            } 
            // Handle object with 'any' or 'all' properties
            else if (typeof conds === 'object') {
                if (conds.any) findPairsInConditions(conds.any);
                if (conds.all) findPairsInConditions(conds.all);
            }
        };

        // Start traversing from the root
        findPairsInConditions(parsedCondition);
        
        return foundPairs;
    };

    // First try to get pairs from the action
    const actionPairs = extractPairsFromAction();
    if (actionPairs.length > 0) {
        console.log(`✅ Found ${actionPairs.length} pairs in action`);
        return actionPairs;
    }

    // Then try to extract pairs from the condition
    const conditionPairs = extractPairsFromCondition();
    if (conditionPairs.length > 0) {
        console.log(`✅ Found ${conditionPairs.length} pairs in condition`);
        return conditionPairs;
    }

    // Fallback: If we have matched medications but no specific pairs
    const matchedMeds = facts.matched_medications || [];
    if (matchedMeds.length === 2) {
        pairs.push({ 
            drugA: matchedMeds[0], 
            drugB: matchedMeds[1] 
        });
    } else if (matchedMeds.length > 2) {
        const uniqueMeds = [...new Set(matchedMeds)];
        for (let i = 0; i < uniqueMeds.length; i++) {
            for (let j = i + 1; j < uniqueMeds.length; j++) {
                const exists = pairs.some(p => 
                    (p.drugA === uniqueMeds[i] && p.drugB === uniqueMeds[j]) ||
                    (p.drugA === uniqueMeds[j] && p.drugB === uniqueMeds[i])
                );
                if (!exists) {
                    pairs.push({ drugA: uniqueMeds[i], drugB: uniqueMeds[j] });
                }
            }
        }
    }

    return pairs;
};

// ✅ evaluateRule function - returns { triggered, matchedMedications, interactionPairs }
export const evaluateRule = (rule, facts, returnDetails = false) => {
    try {
        if (!rule || !facts) {
            console.error('❌ Missing rule or facts');
            return returnDetails ? { triggered: false, matchedMedications: [], interactionPairs: [] } : false;
        }

        console.log(`\n🎯 Evaluating rule: "${rule.rule_name}"`);

        // ✅ Check if rule applies to this patient type
        if (rule.applies_to && Array.isArray(rule.applies_to) && rule.applies_to.length > 0) {
            const appliesTo = rule.applies_to;
            const patientType = facts.patient_type;

            let isApplicable = false;

            // Check for direct match or general categories
            if (appliesTo.includes('all_patients')) isApplicable = true;
            else if (appliesTo.includes(patientType)) isApplicable = true;
            else if (facts.is_pediatric && appliesTo.includes('pediatric')) isApplicable = true;
            else if (facts.is_adult && appliesTo.includes('adult')) isApplicable = true;
            else if (facts.is_geriatric && appliesTo.includes('geriatric')) isApplicable = true;
            else if (facts.is_pregnant && appliesTo.includes('pregnancy')) isApplicable = true;

            if (!isApplicable) {
                console.log(`⏭️ Rule "${rule.rule_name}" does not apply to ${patientType} patients. Skipping.`);
                return returnDetails ? { triggered: false, matchedMedications: [], interactionPairs: [] } : false;
            }
        }

        const result = debugRuleEvaluation(rule, facts);

        if (result) {
            console.log(`🚨 ALERT: Rule "${rule.rule_name}" TRIGGERED!`);
        }

        if (returnDetails) {
            const matchedMeds = result ? getMatchedMedications(rule.rule_condition, facts) : [];
            
            // ✅ Get interaction pairs for drug_interaction and incompatibility rules
            let interactionPairs = [];
            if (result && (rule.rule_type === 'drug_interaction' || rule.rule_type === 'incompatibility')) {
                interactionPairs = getInteractionPairs(rule.rule_condition, facts, rule);
                console.log(`💊 Interaction pairs found:`, interactionPairs);
            }
            
            if (matchedMeds.length > 0) {
                console.log(`💊 Matched medications: ${matchedMeds.join(', ')}`);
            }
            
            return { 
                triggered: result, 
                matchedMedications: matchedMeds,
                interactionPairs: interactionPairs
            };
        }

        return result;

    } catch (error) {
        console.error('❌ Error evaluating rule:', error);
        return returnDetails ? { triggered: false, matchedMedications: [], interactionPairs: [] } : false;
    }
};

// ✅ Helper function to get all available fact names
export const getAllAvailableFactNames = (facts) => {
    if (!facts) return [];

    const allKeys = new Set();

    // Get all direct properties
    Object.keys(facts).forEach(key => {
        if (key !== 'labs' && key !== 'vitals' && key !== 'medications') {
            allKeys.add(key);
        }
    });

    // Get labs properties
    if (facts.labs) {
        Object.keys(facts.labs).forEach(key => {
            allKeys.add(`labs.${key}`);
            allKeys.add(key);
        });
    }

    // Get vitals properties
    if (facts.vitals) {
        Object.keys(facts.vitals).forEach(key => {
            allKeys.add(`vitals.${key}`);
            allKeys.add(key);
        });
    }

    // Get medication arrays
    if (facts.medication_names && facts.medication_names.length > 0) {
        allKeys.add('medication_names');
        allKeys.add('medications');
        allKeys.add('medication_count');

        // Add specific medication data fields
        if (facts.medication_data) {
            Object.keys(facts.medication_data).forEach(medKey => {
                allKeys.add(`medication_data.${medKey}.dose`);
                allKeys.add(`medication_data.${medKey}.frequency`);
                allKeys.add(`medication_data.${medKey}.roa`);
                allKeys.add(`medication_data.${medKey}.days_since_start`);
            });
        }
    }

    // Get allergies
    if (facts.allergies && facts.allergies.length > 0) {
        allKeys.add('allergies');
        allKeys.add('allergy_count');
    }

    return Array.from(allKeys).sort();
};

// ✅ Helper function to check specific lab values
export const checkSpecificLabValues = (facts, labNames) => {
    const results = {};

    labNames.forEach(lab => {
        const value = facts.labs ? facts.labs[lab] : facts[lab];
        results[lab] = {
            value: value,
            exists: value !== undefined && value !== null && value !== '',
            in_labs: facts.labs ? facts.labs[lab] !== undefined : false,
            direct: facts[lab] !== undefined
        };
    });

    return results;
};

// ✅ runClinicalDecisionSupport function - Fetches rules and runs them
export const runClinicalDecisionSupport = async (facts) => {
    try {
        console.log('🚀 Running Clinical Decision Support...');

        const response = await api.get('/clinical-rules');
        if (!response.success) {
            console.warn('⚠️ Could not fetch clinical rules');
            return [];
        }

        const rules = response.rules || [];
        const results = [];

        for (const rule of rules) {
            const evalResult = evaluateRule(rule, facts, true);
            if (evalResult.triggered) {
                const action = typeof rule.rule_action === 'string' ? JSON.parse(rule.rule_action) : (rule.rule_action || {});

                let professional_message = formatAlertMessage(action.message_professional || action.message || rule.rule_name, facts);
                let client_message = formatAlertMessage(action.message_client || action.message || rule.rule_name, facts);
                let recommendation = formatAlertMessage(action.recommendation_professional || action.recommendation || rule.rule_description, facts);
                let client_recommendation = formatAlertMessage(action.recommendation_client || action.recommendation || rule.rule_description, facts);

                // Append matched medication names to message if available
                if (evalResult.matchedMedications.length > 0) {
                    const tag = ` [Triggered by: ${evalResult.matchedMedications.join(', ')}]`;
                    professional_message += tag;
                    client_message += tag;
                }

                results.push({
                    message: professional_message, // Default
                    professional_message,
                    client_message,
                    recommendation,
                    client_recommendation,
                    severity: action.severity || rule.severity || 'moderate',
                    matchedMedications: evalResult.matchedMedications,
                    interactionPairs: evalResult.interactionPairs || []
                });
            }
        }

        return results;
    } catch (error) {
        console.error('❌ Error in runClinicalDecisionSupport:', error);
        return [];
    }
};

export default {
    mapPatientToFacts,
    debugRuleEvaluation,
    evaluateRule,
    formatAlertMessage,
    getAllAvailableFactNames,
    checkSpecificLabValues,
    runClinicalDecisionSupport
};
