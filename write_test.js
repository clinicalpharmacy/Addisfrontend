const fs = require('fs');
const RuleEngineContent = fs.readFileSync('./src/components/CDSS/RuleEngine.jsx', 'utf8');

// Extremely hacky way to extract the functions for testing
const getMatchedMedicationsStr = RuleEngineContent.match(/const getMatchedMedications = \(condition, facts\) => \{[\s\S]*?return uniqueFormattedCombinations;\n\};/)[0];
const evaluateSingleConditionStr = RuleEngineContent.match(/const evaluateSingleCondition = \(condition, facts, debug = false\) => \{[\s\S]*?\n\};/)[0];

const script = `
${evaluateSingleConditionStr}
${getMatchedMedicationsStr}

const facts = {
    medications: ['valsartan', 'furosemide', 'spironolactone', 'ibuprofen'],
    medication_names: ['valsartan', 'furosemide', 'spironolactone', 'ibuprofen']
};

const condition = {
    "all": [
        { "fact": "medications", "operator": "contains", "value": "valsartan" },
        {
            "any": [
                { "fact": "medications", "operator": "contains", "value": "furosemide" },
                { "fact": "medications", "operator": "contains", "value": "spironolactone" }
            ]
        },
        { "fact": "medications", "operator": "contains", "value": "ibuprofen" }
    ]
};

console.log("Output:", getMatchedMedications(condition, facts));
`;

fs.writeFileSync('./test_rule_engine.js', script);
