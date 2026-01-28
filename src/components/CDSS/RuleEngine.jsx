// src/components/CDSS/RuleEngine.js - COMPLETE VERSION WITH ALL INPUTS
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
        ageInDays = parseInt(patientData.age_in_days);
        console.log(`✅ Using direct age_in_days from patient: ${ageInDays}`);
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
        patient_code: patientData.patient_code || '',

        // ===== PREGNANCY INFORMATION =====
        pregnancy: pregnancy,
        is_pregnant: pregnancy,
        pregnancy_weeks: pregnancyWeeks,
        pregnancy_trimester: pregnancyTrimester,
        edd: patientData.edd || '',
        pregnancy_notes: patientData.pregnancy_notes || '',

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

    // ✅ FIXED: AGE CATEGORY DETERMINATION
    if (ageInDays > 0) {
        console.log(`📊 Determining age categories for ${ageInDays} days old patient`);

        // Set precise age flags
        facts.is_age_under_28_days = ageInDays <= 28;
        facts.is_age_under_1_year = ageInDays <= 365;
        facts.is_age_1_to_12_years = ageInDays > 365 && ageInDays <= (12 * 365);
        facts.is_age_13_to_18_years = ageInDays > (12 * 365) && ageInDays <= (18 * 365);
        facts.is_age_over_18 = ageInDays > (18 * 365);
        facts.is_age_over_65 = age > 65;

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
        } else if (age > 65) {
            facts.patient_type = 'geriatric';
            facts.is_geriatric = true;
            facts.is_adult = true;
            console.log('👴 Patient classified as: GERIATRIC');
        } else {
            facts.patient_type = 'adult';
            facts.is_adult = true;
            console.log('👨 Patient classified as: ADULT');
        }
    } else if (age > 0) {
        // Fallback using age in years
        facts.is_age_over_65 = age > 65;

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
        } else if (age > 65) {
            facts.patient_type = 'geriatric';
            facts.is_geriatric = true;
            facts.is_adult = true;
        } else {
            facts.patient_type = 'adult';
            facts.is_adult = true;
        }
    }

    // ✅ FIXED: EXTRACT MEDICATIONS
    if (Array.isArray(medicationHistory)) {
        medicationHistory.forEach(med => {
            if (med && typeof med === 'object') {
                if (med.drug_name) {
                    const drugName = med.drug_name.toLowerCase();
                    facts.medication_names.push(drugName);
                    facts.medications.push(drugName);

                    if (med.generic_name) {
                        const genericName = med.generic_name.toLowerCase();
                        facts.medications.push(genericName);
                    }

                    if (med.brand_name) {
                        const brandName = med.brand_name.toLowerCase();
                        facts.medications.push(brandName);
                    }
                }

                if (med.drug_class) {
                    const drugClass = med.drug_class.toLowerCase();
                    facts.medication_classes.push(drugClass);
                    facts.medications.push(drugClass);
                }
            }
        });

        facts.medications = [...new Set(facts.medications)];
        facts.medication_names = [...new Set(facts.medication_names)];
        facts.medication_classes = [...new Set(facts.medication_classes)];
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

    // Check patientData.labs first and extract ALL keys (supporting dynamic labs)
    if (patientData.labs && typeof patientData.labs === 'object') {
        const sourceLabs = patientData.labs.labs || patientData.labs;
        Object.keys(sourceLabs).forEach(lab => {
            const value = extractLabValue(patientData.labs, lab);
            if (value !== null && value !== '') {
                // Determine if value is numeric or string
                const numVal = parseFloat(value);
                const normalizedLab = lab.toLowerCase().trim();
                const factValue = !isNaN(numVal) ? numVal : value;

                facts.labs[normalizedLab] = factValue;
                console.log(`🧪 Lab Fact Created: facts.labs["${normalizedLab}"] =`, factValue);

                // Also store with underscores for consistency in rules
                const snakeCaseLab = normalizedLab.replace(/ /g, '_');
                if (snakeCaseLab !== normalizedLab) {
                    facts.labs[snakeCaseLab] = factValue;
                    console.log(`🧪 Lab Fact Created: facts.labs["${snakeCaseLab}"] =`, factValue);
                }

                // Also set as top-level fact if not conflicting
                if (facts[normalizedLab] === undefined) {
                    facts[normalizedLab] = factValue;
                }
                if (facts[snakeCaseLab] === undefined) {
                    facts[snakeCaseLab] = factValue;
                }
            }
        });
    }

    // Also check patientData directly for labs
    allLabs.forEach(lab => {
        if (facts[lab] === 0 || facts[lab] === '' || facts[lab] === null) {
            const value = extractLabValue(patientData, lab);
            if (value !== null) {
                facts.labs[lab] = value;
                facts[lab] = value;
            }
        }
    });

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

    // Calculate AST/ALT ratio
    if (facts.ast > 0 && facts.alt > 0) {
        facts.ast_alt_ratio = facts.ast / facts.alt;
        facts.labs.ast_alt_ratio = facts.ast_alt_ratio;
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

    // ✅ COMPREHENSIVE DEBUG OUTPUT
    console.log('\n✅ COMPLETE FACTS GENERATED:');
    console.log('DEMOGRAPHICS:', {
        patient_code: facts.patient_code,
        name: facts.full_name,
        age: facts.age,
        age_in_days: facts.age_in_days,
        gender: facts.gender,
        patient_type: facts.patient_type,
        is_pediatric: facts.is_pediatric,
        pregnancy: facts.pregnancy,
        pregnancy_weeks: facts.pregnancy_weeks
    });

    console.log('VITALS:', {
        blood_pressure: facts.blood_pressure,
        heart_rate: facts.heart_rate,
        temperature: facts.temperature,
        weight: facts.weight,
        height: facts.height,
        bmi: facts.bmi,
        oxygen_saturation: facts.oxygen_saturation
    });

    console.log('KEY LAB VALUES - RENAL:', {
        creatinine: facts.creatinine,
        urea: facts.urea,
        bun: facts.bun,
        egfr: facts.egfr,
        uric_acid: facts.uric_acid
    });

    console.log('KEY LAB VALUES - ELECTROLYTES:', {
        sodium: facts.sodium,
        potassium: facts.potassium,
        chloride: facts.chloride,
        bicarbonate: facts.bicarbonate,
        calcium: facts.calcium,
        magnesium: facts.magnesium,
        phosphate: facts.phosphate
    });

    console.log('KEY LAB VALUES - LIVER:', {
        alt: facts.alt,
        ast: facts.ast,
        alp: facts.alp,
        ggt: facts.ggt,
        bilirubin_total: facts.bilirubin_total,
        albumin: facts.albumin,
        total_protein: facts.total_protein
    });

    console.log('KEY LAB VALUES - DIABETES & LIPID:', {
        hba1c: facts.hba1c,
        fasting_glucose: facts.fasting_glucose,
        total_cholesterol: facts.total_cholesterol,
        triglycerides: facts.triglycerides,
        ldl_cholesterol: facts.ldl_cholesterol,
        hdl_cholesterol: facts.hdl_cholesterol
    });

    console.log('KEY LAB VALUES - CARDIAC & INFLAMMATORY:', {
        troponin: facts.troponin,
        inr: facts.inr,
        crp: facts.crp,
        esr: facts.esr
    });

    console.log('KEY LAB VALUES - THYROID & CBC:', {
        tsh: facts.tsh,
        hemoglobin: facts.hemoglobin,
        platelet_count: facts.platelet_count,
        wbc_count: facts.wbc_count
    });

    console.log('PEDIATRIC INFO:', {
        birth_weight: facts.birth_weight,
        birth_length: facts.birth_length,
        feeding_method: facts.feeding_method,
        vaccination_status: facts.vaccination_status,
        weight_percentile: facts.weight_percentile,
        height_percentile: facts.height_percentile
    });

    console.log('MEDICATIONS:', {
        count: facts.medication_count,
        names: facts.medication_names.slice(0, 5)
    });

    console.log('ALLERGIES:', facts.allergies);
    console.log('DIAGNOSIS:', facts.diagnosis);

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
            const result = evaluateSingleCondition(cond, facts, true);
            console.log(`  [${index + 1}] ${cond.fact} ${cond.operator} ${cond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
            return result;
        });

        const finalResult = allResults.every(r => r === true);
        console.log(`\nALL condition final: ${finalResult ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
        return finalResult;
    }

    if (condition.any) {
        console.log('Condition type: ANY (any can be true)');
        const anyResults = condition.any.map((cond, index) => {
            const result = evaluateSingleCondition(cond, facts, true);
            console.log(`  [${index + 1}] ${cond.fact} ${cond.operator} ${cond.value} => ${result ? '✅ PASS' : '❌ FAIL'}`);
            return result;
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

// ✅ evaluateRule function
export const evaluateRule = (rule, facts) => {
    try {
        if (!rule || !facts) {
            console.error('❌ Missing rule or facts');
            return false;
        }

        console.log(`\n🎯 Evaluating rule: "${rule.rule_name}"`);

        const result = debugRuleEvaluation(rule, facts);

        if (result) {
            console.log(`🚨 ALERT: Rule "${rule.rule_name}" TRIGGERED!`);
        }

        return result;

    } catch (error) {
        console.error('❌ Error evaluating rule:', error);
        return false;
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
            if (evaluateRule(rule, facts)) {
                results.push({
                    message: formatAlertMessage(rule.rule_action?.message || rule.rule_name, facts),
                    recommendation: formatAlertMessage(rule.rule_action?.recommendation || rule.rule_description, facts),
                    severity: rule.rule_action?.severity || rule.severity || 'moderate'
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