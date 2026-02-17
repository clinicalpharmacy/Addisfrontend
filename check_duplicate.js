const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'PatientDetails.jsx');

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let importCount = 0;
    let usageCount = 0;
    let flaskCount = 0;

    lines.forEach((line, index) => {
        // Check for FaStethoscope in import statements
        if (line.includes('FaStethoscope') && (line.trim().startsWith('import') || isInsideImportBlock(lines, index))) {
            console.log(`Found FaStethoscope in import at line ${index + 1}: ${line.trim()}`);
            importCount++;
        }

        // Check usage (rough check)
        if (line.includes('<FaStethoscope') || line.includes('FaStethoscope ')) {
            // identifying usage
            // console.log(`Found usage at line ${index + 1}: ${line.trim()}`);
            usageCount++;
        }

        if (line.includes('FaFlask')) {
            flaskCount++;
            console.log(`Found FaFlask at line ${index + 1}: ${line.trim()}`);
        }
    });

    console.log(`Total FaStethoscope imports: ${importCount}`);
    console.log(`Total FaFlask occurrences: ${flaskCount}`);

} catch (err) {
    console.error('Error reading file:', err);
}

function isInsideImportBlock(lines, currentIndex) {
    // Simple heuristic: look backwards for 'import {' and ensure no '}' before it
    // This is not perfect but good enough for typical code
    let i = currentIndex - 1;
    while (i >= 0) {
        if (lines[i].includes('} from')) return false; // End of previous block
        if (lines[i].includes('import {')) return true; // Start of current block
        if (lines[i].includes('import')) return false; // Other import
        i--;
    }
    return false;
}
