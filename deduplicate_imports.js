import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'src');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

console.log('Starting Import De-duplication...');

walk(SRC_DIR, (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Find all import blocks from react-icons/fa
        // and remove duplicates inside them
        const importRegex = /import\s*\{([\s\S]*?)\}\s*from\s*['"]react-icons\/fa['"]/g;
        
        content = content.replace(importRegex, (match, p1) => {
            let icons = p1.split(/,\s*/).map(i => i.trim()).filter(i => i);
            let uniqueIcons = [...new Set(icons)];
            return `import { ${uniqueIcons.join(', ')} } from 'react-icons/fa'`;
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Cleaned: ${path.relative(SRC_DIR, filePath)}`);
        }
    }
});

console.log('De-duplication Complete!');
