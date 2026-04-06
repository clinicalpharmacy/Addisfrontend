const fs = require('fs');
const path = require('path');

const srcPath = 'c:\\Users\\wondewossenb\\Addisfrontend-1\\src';
console.log('🔍 Path exists?', fs.existsSync(srcPath));

function walkSync(dir) {
    try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                walkSync(filePath);
            } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('FaShieldAlt')) {
                    console.log('🔄 Replacing in:', filePath);
                    const newContent = content.replace(/FaShieldAlt/g, 'FaShield');
                    fs.writeFileSync(filePath, newContent, 'utf8');
                }
            }
        });
    } catch (e) {
        console.error('❌ Error walking directory:', e);
    }
}

console.log('🚀 Final Icon Migration (Sync)...');
walkSync(srcPath);
console.log('✅ Final Migration Complete!');
process.exit(0);
