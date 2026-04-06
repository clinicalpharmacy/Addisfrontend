import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, 'src');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

console.log('🚀 Starting Global Icon Migration (FaShieldAlt -> FaShield)...');

walk(srcPath, (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('FaShieldAlt')) {
            console.log(`📝 Processing: ${path.relative(srcPath, filePath)}`);
            let newContent = content.replace(/FaShieldAlt/g, 'FaShield');
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});

console.log('✅ Migration Complete!');
