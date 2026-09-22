
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
                return itemStr.includes(searchValue) || searchValue.includes(itemStr);
            });
        }

        return String(patientValue).toLowerCase().includes(searchValue) || searchValue.includes(String(patientValue).toLowerCase());
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
const evaluateMedicationGroup = (medConditions, facts) => {
    if (!facts || !facts.medication_data) return [];
    
    const matchedMeds = [];
    Object.values(facts.medication_data).forEach(med => {
        const isMatch = medConditions.every(cond => {
            const field = cond.fact.substring(4); // remove 'med.'
            const tempFacts = { ...med, [field]: med[field] }; // Pass the property directly
            return evaluateSingleCondition({...cond, fact: field}, tempFacts, false);
        });
        if (isMatch && med.drug_name) {
            matchedMeds.push(med.drug_name);
        }
    });
    
    return matchedMeds;
};
const getMatchedMedications = (condition, facts) => {
    let parsedCondition = condition;
    if (typeof condition === 'string') {
        try { parsedCondition = JSON.parse(condition); } catch (e) { return []; }
    }

    // Recursively evaluate condition and return matched patient medications
    const evaluate = (cond) => {
        if (!cond) return null;

        if (cond.all) {
            const medConditions = cond.all.filter(c => c.fact && String(c.fact).startsWith('med.'));
            const otherConditions = cond.all.filter(c => !(c.fact && String(c.fact).startsWith('med.')));
            
            let allMatchSets = [ [] ];

            if (medConditions.length > 0) {
                const matchedMeds = evaluateMedicationGroup(medConditions, facts);
                if (matchedMeds.length === 0) return null; // Fails the 'all' block
                
                const childRes = matchedMeds.map(m => [m]);
                let newMatchSets = [];
                for (let existingSet of allMatchSets) {
                    for (let childSet of childRes) {
                        let combined = [...existingSet];
                        for (let item of childSet) {
                            if (!combined.includes(item)) combined.push(item);
                        }
                        newMatchSets.push(combined);
                    }
                }
                allMatchSets = newMatchSets;
            }

            for (let c of otherConditions) {
                let childRes = evaluate(c);
                if (!childRes) return null; // If any fails, the 'all' block fails
                
                let newMatchSets = [];
                for (let existingSet of allMatchSets) {
                    for (let childSet of childRes) {
                        let combined = [...existingSet];
                        for (let item of childSet) {
                            if (!combined.includes(item)) {
                                combined.push(item);
                            }
                        }
                        newMatchSets.push(combined);
                    }
                }
                allMatchSets = newMatchSets;
            }
            return allMatchSets.length > 0 ? allMatchSets : null;
        }

        if (cond.any) {
            let anyMatchSets = [];
            let anyTrue = false;
            for (let c of cond.any) {
                let childRes = evaluate(c);
                if (childRes) {
                    anyTrue = true;
                    anyMatchSets.push(...childRes); // Keep all branches that were true
                }
            }
            return anyTrue ? anyMatchSets : null;
        }

        if (cond.fact === 'medications' && cond.operator === 'contains' && cond.value) {
            const searchValue = String(cond.value).toLowerCase().trim();
            if (!searchValue) return null; // Avoid empty string matching everything
            const matches = [];

            // Prefer using medication_data to get the actual drug name even if matched by class
            if (facts.medication_data && Object.keys(facts.medication_data).length > 0) {
                Object.values(facts.medication_data).forEach(med => {
                    const drugName = String(med.drug_name || '').toLowerCase().trim();
                    const drugClass = String(med.drug_class || '').toLowerCase().trim();
                    
                    const nameMatches = drugName && (drugName.includes(searchValue) || searchValue.includes(drugName));
                    const classMatches = drugClass && (drugClass.includes(searchValue) || searchValue.includes(drugClass));
                    
                    if (nameMatches || classMatches) {
                        if (med.drug_name) matches.push(med.drug_name);
                    }
                });
            } else if (Array.isArray(facts.medications)) {
                // Fallback
                facts.medications.forEach(med => {
                    const medStr = String(med).toLowerCase().trim();
                    if (medStr && (medStr.includes(searchValue) || searchValue.includes(medStr))) {
                        matches.push(medStr);
                    }
                });
            }

            if (matches.length > 0) {
                const uniqueMatches = [...new Set(matches)];
                return uniqueMatches.map(m => [m]); // Return each match as a single-item combination
            }
            return null;
        }

        // For non-medication facts (age, labs, etc.), just return empty array if true, or null if false
        const isTrue = evaluateSingleCondition(cond, facts, false);
        return isTrue ? [ [] ] : null;
    };

    const result = evaluate(parsedCondition);
    if (!result) return [];

    // Format (capitalize) and deduplicate the extracted patient medication combinations
    const uniqueFormattedCombinations = [];
    const seenCombos = new Set();
    
    result.forEach(combination => {
        const formattedCombo = combination.map(med => {
            return String(med).charAt(0).toUpperCase() + String(med).slice(1).toLowerCase();
        }).sort(); // Sort to ensure uniqueness ignores order
        
        const comboKey = formattedCombo.join('|');
        if (!seenCombos.has(comboKey)) {
            seenCombos.add(comboKey);
            uniqueFormattedCombinations.push(formattedCombo);
        }
    });

    return uniqueFormattedCombinations;
};

const facts = {
    medication_data: {
        'valsartan': { drug_name: 'valsartan' },
        'furosemide': { drug_name: 'furosemide' },
        'spironolactone': { drug_name: 'spironolactone' },
        'ibuprofen': { drug_name: 'ibuprofen' }
    }
};

const rule = {
  "all": [
    {
      "any": [
        { "fact": "medications", "value": "valsartan", "operator": "contains" }
      ]
    },
    {
      "any": [
        { "fact": "medications", "value": "furosemide", "operator": "contains" },
        { "fact": "medications", "value": "spironolactone", "operator": "contains" }
      ]
    },
    {
      "any": [
        { "fact": "medications", "value": "ibuprofen", "operator": "contains" }
      ]
    }
  ]
};

console.log(JSON.stringify(getMatchedMedications(rule, facts), null, 2));
