const fs = require('fs');
const RuleEngineContent = fs.readFileSync('./src/components/CDSS/RuleEngine.jsx', 'utf8');

const getMatchedMedicationsStr = RuleEngineContent.match(/const getMatchedMedications = \(condition, facts\) => \{[\s\S]*?return uniqueFormattedCombinations;\n\};/)[0];
const evaluateSingleConditionStr = RuleEngineContent.match(/const evaluateSingleCondition = \(condition, facts, debug = false\) => \{[\s\S]*?\n\};/)[0];

const script = `
${evaluateSingleConditionStr}
${getMatchedMedicationsStr}

const facts = {
    medications: ['valsartan', 'furosemide', 'spironolactone', 'ibuprofen']
};

const condition = ${JSON.stringify({
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
})};

console.log("Combinations:", getMatchedMedications(condition, facts));
`;

fs.writeFileSync('./test_rule_engine.cjs', script);
