const fs = require('fs');
const path = require('path');

// Hardcode path for simplicity or use process.cwd()
const filePath = path.join(process.cwd(), 'src', 'pages', 'PatientDetails.jsx');

console.log("Checking duplicates in: " + filePath);

try {
    if (!fs.existsSync(filePath)) {
        console.error("File does not exist!");
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let importCount = 0;
    let usageCount = 0;
    let flaskCount = 0;

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Check for FaStethoscope in import statements
        if (line.includes('FaStethoscope')) {
            // Check if it's likely an import (either starts with import or is inside a block)
            if (trimmed.startsWith('import') || isInsideImportBlock(lines, index)) {
                console.log(`Found FaStethoscope in import at line ${index + 1}: ${trimmed}`);
                importCount++;
            } else {
                // likely usage
                // console.log(`Found usage at line ${index + 1}: ${trimmed}`);
            }
        }

        if (line.includes('FaFlask')) {
            flaskCount++;
            console.log(`Found FaFlask at line ${index + 1}: ${trimmed}`);
        }
    });

    console.log(`Total FaStethoscope imports: ${importCount}`);
    console.log(`Total FaFlask occurrences: ${flaskCount}`);

} catch (err) {
    console.error('Error reading file:', err);
}

function isInsideImportBlock(lines, currentIndex) {
    let i = currentIndex - 1;
    while (i >= 0) {
        const l = lines[i];
        if (l.includes('} from')) return false;
        if (l.includes('import {') || l.trim().startsWith('import {')) return true;
        if (l.trim().startsWith('import ') && !l.includes('{')) return false;
        i--;
    }
    return false;
}
