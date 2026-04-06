const fs = require('fs');
const path = require('path');

const srcPath = 'c:\\Users\\wondewossenb\\Addisfrontend-1\\src';

function walk(dir) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walk(dirPath);
        } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
            let content = fs.readFileSync(dirPath, 'utf8');
            if (content.includes('FaShieldAlt')) {
                console.log(`📝 Processing: ${dirPath}`);
                let newContent = content.replace(/FaShieldAlt/g, 'FaShield');
                fs.writeFileSync(dirPath, newContent, 'utf8');
            }
        }
    });
};

console.log('🚀 Starting Global Icon Migration (Absolute Path)...');
walk(srcPath);
console.log('✅ Migration Complete!');
