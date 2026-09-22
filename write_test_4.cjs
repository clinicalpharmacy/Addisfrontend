const fs = require('fs');

const RuleEngineContent = fs.readFileSync('./src/components/CDSS/RuleEngine.jsx', 'utf8');
const evaluateSingleConditionMatch = RuleEngineContent.match(/const evaluateSingleCondition = \(condition, facts, debug = false\) => \{[\s\S]*?\n\};/);
const evaluateMedicationGroupMatch = RuleEngineContent.match(/const evaluateMedicationGroup = \(medConditions, facts\) => \{[\s\S]*?\n\};/);
const evaluateMatch = RuleEngineContent.match(/export const evaluate = \(ruleJson, facts, debug = false\) => \{[\s\S]*?return \{ matched: false \};\n\};/);
const safeJsonParseMatch = RuleEngineContent.match(/const safeJsonParse = \(str, defaultValue = \{\}\) => \{[\s\S]*?\n\};/);
const getMatchedMedicationsMatch = RuleEngineContent.match(/const getMatchedMedications = \(condition, facts\) => \{[\s\S]*?return allMatchSets\.length > 0 \? allMatchSets : null;\n        \}\n\n        if \(cond\.any\) \{[\s\S]*?\n\};/);

if (!evaluateMatch) {
    console.error("evaluate function not found!");
    process.exit(1);
}

const script = `
${safeJsonParseMatch[0]}
${evaluateSingleConditionMatch[0]}
${evaluateMedicationGroupMatch[0]}
${getMatchedMedicationsMatch[0]}
${evaluateMatch[0]}

const facts = {
    medication_data: {
        'methotrexate': {
            drug_name: 'methotrexate',
            frequency: 'Once daily'
        }
    }
};

const ruleJson = {
  "all": [
    { "fact": "med.drug_name", "value": "methotrexate", "operator": "contains" },
    { "fact": "med.frequency", "value": "daily", "operator": "contains" }
  ]
};

console.log("Result:", evaluate(ruleJson, facts));
`;

fs.writeFileSync('./test_rule_engine_4.cjs', script);
