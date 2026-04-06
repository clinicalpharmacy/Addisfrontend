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

console.log('Starting Ultimate Icon Recovery...');

walk(SRC_DIR, (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Replace both FaShieldAlt and FaShield with FaUserShield
        // We use regex to ensure we don't partial match
        content = content.replace(/FaShieldAlt/g, 'FaUserShield');
        content = content.replace(/FaShield(?![a-zA-Z])/g, 'FaUserShield');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed: ${path.relative(SRC_DIR, filePath)}`);
        }
    }
});

console.log('Icon Recovery Complete! All FaShield/FaShieldAlt references are now FaUserShield.');
