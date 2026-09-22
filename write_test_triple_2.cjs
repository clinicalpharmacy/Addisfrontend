const fs = require('fs');

const RuleEngineContent = fs.readFileSync('./src/components/CDSS/RuleEngine.jsx', 'utf8');

const getMatchedMedicationsMatch = RuleEngineContent.match(/const getMatchedMedications = \(condition, facts\) => \{[\s\S]*?\n\};/);
const evaluateSingleConditionMatch = RuleEngineContent.match(/const evaluateSingleCondition = \(condition, facts, debug = false\) => \{[\s\S]*?\n\};/);
const evaluateMedicationGroupMatch = RuleEngineContent.match(/const evaluateMedicationGroup = \(medConditions, facts\) => \{[\s\S]*?\n\};/);

if (!getMatchedMedicationsMatch) {
    console.log("Could not extract getMatchedMedications");
    process.exit(1);
}

const script = `
${evaluateSingleConditionMatch[0]}
${evaluateMedicationGroupMatch[0]}
${getMatchedMedicationsMatch[0]}

const facts = {
    medications: ['valsartan', 'furosemide', 'spironolactone', 'ibuprofen']
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

console.log("With facts.medications only:");
console.log(JSON.stringify(getMatchedMedications(rule, facts), null, 2));

const facts2 = {
    medication_data: {
        'valsartan': { drug_name: 'valsartan' },
        'furosemide': { drug_name: 'furosemide' },
        'spironolactone': { drug_name: 'spironolactone' },
        'ibuprofen': { drug_name: 'ibuprofen' }
    }
};

console.log("With facts.medication_data:");
console.log(JSON.stringify(getMatchedMedications(rule, facts2), null, 2));
`;

fs.writeFileSync('./test_triple_whammy_2.cjs', script);
