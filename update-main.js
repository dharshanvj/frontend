import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetMainJsx = path.resolve(__dirname, '../../dsa project/frontend/src/main.jsx');
let content = fs.readFileSync(targetMainJsx, 'utf8');

if (!content.includes('serviceWorker')) {
    content += `\n// Register service worker for PWA support\nif ('serviceWorker' in navigator) {\n  window.addEventListener('load', () => {\n    navigator.serviceWorker.register('/sw.js')\n      .then(reg => console.log('SW Registered!', reg))\n      .catch(err => console.log('SW Reg failed:', err));\n  });\n}\n`;
    fs.writeFileSync(targetMainJsx, content);
    console.log('Appended service worker registration to main.jsx');
} else {
    console.log('Service worker already registered in main.jsx');
}
