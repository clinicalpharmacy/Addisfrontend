const fs = require('fs');
const RuleEngineContent = fs.readFileSync('./src/components/CDSS/RuleEngine.jsx', 'utf8');

const getMatchedMedicationsStr = RuleEngineContent.match(/const getMatchedMedications = \(condition, facts\) => \{[\s\S]*?return allMatchSets\.length > 0 \? allMatchSets : null;\n        \}\n\n        if \(cond\.any\) \{[\s\S]*?\n\};/)[0];
const evaluateSingleConditionStr = RuleEngineContent.match(/const evaluateSingleCondition = \(condition, facts, debug = false\) => \{[\s\S]*?\n\};/)[0];
const evaluateMedicationGroupStr = RuleEngineContent.match(/const evaluateMedicationGroup = \(medConditions, facts\) => \{[\s\S]*?\n\};/)[0];

const script = `
${evaluateSingleConditionStr}
${evaluateMedicationGroupStr}

// Mock getMatchedMedications to just test evaluateMedicationGroup
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

const medConditions = condition.all.filter(c => c.fact && String(c.fact).startsWith('med.'));
console.log("medConditions:", medConditions);
console.log("Result:", evaluateMedicationGroup(medConditions, facts));
`;

fs.writeFileSync('./test_rule_engine_2.cjs', script);
