const fs = require('fs');

const RuleEngineContent = fs.readFileSync('./src/components/CDSS/RuleEngine.jsx', 'utf8');

const evaluateSingleConditionMatch = RuleEngineContent.match(/const evaluateSingleCondition = \(condition, facts, debug = false\) => \{[\s\S]*?\n\};/);
const evaluateMedicationGroupMatch = RuleEngineContent.match(/const evaluateMedicationGroup = \(medConditions, facts\) => \{[\s\S]*?\n\};/);

if (!evaluateSingleConditionMatch || !evaluateMedicationGroupMatch) {
    console.error("Could not find functions in RuleEngine.jsx");
    process.exit(1);
}

const evaluateSingleConditionStr = evaluateSingleConditionMatch[0];
const evaluateMedicationGroupStr = evaluateMedicationGroupMatch[0];

const script = `
${evaluateSingleConditionStr}
${evaluateMedicationGroupStr}

const facts = {
    medication_data: {
        'methotrexate': {
            drug_name: 'methotrexate',
            frequency: 'Once daily'
        }
    }
};

const condition = {
  "all": [
    { "fact": "med.drug_name", "value": "methotrexate", "operator": "contains" },
    { "fact": "med.frequency", "value": "daily", "operator": "contains" }
  ]
};

const medConditions = condition.all;
console.log("medConditions:", medConditions);
console.log("Result:", evaluateMedicationGroup(medConditions, facts));
`;

fs.writeFileSync('./test_rule_engine_3.cjs', script);
