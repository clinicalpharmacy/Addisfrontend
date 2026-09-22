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
    medication_data: {
        'fake_id': { drug_name: 'Valsartan + furosemide + spironolactone + ibuprofen' }
    },
    medications: ['Valsartan + furosemide + spironolactone + ibuprofen']
};

const rule = {
  "all": [
    { "any": [ { "fact": "medications", "value": "valsartan", "operator": "contains" } ] },
    { "any": [ { "fact": "medications", "value": "furosemide", "operator": "contains" }, { "fact": "medications", "value": "spironolactone", "operator": "contains" } ] },
    { "any": [ { "fact": "medications", "value": "ibuprofen", "operator": "contains" } ] }
  ]
};

console.log(JSON.stringify(getMatchedMedications(rule, facts), null, 2));
`;

fs.writeFileSync('./test_triple_whammy_3.cjs', script);
