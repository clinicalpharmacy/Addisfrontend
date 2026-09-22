const fs = require('fs');
const RuleEngineContent = fs.readFileSync('./src/components/CDSS/RuleEngine.jsx', 'utf8');

// We need getMatchedMedications and its dependencies
const getMatchedMedicationsMatch = RuleEngineContent.match(/const getMatchedMedications = \(condition, facts\) => \{[\s\S]*?\n\};/);
const evaluateSingleConditionMatch = RuleEngineContent.match(/const evaluateSingleCondition = \(condition, facts, debug = false\) => \{[\s\S]*?\n\};/);
const evaluateMedicationGroupMatch = RuleEngineContent.match(/const evaluateMedicationGroup = \(medConditions, facts\) => \{[\s\S]*?\n\};/);

const script = `
${evaluateSingleConditionMatch[0]}
${evaluateMedicationGroupMatch[0]}
${getMatchedMedicationsMatch[0]}

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
`;
fs.writeFileSync('./test_triple_whammy.cjs', script);
