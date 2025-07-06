#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Get WebSocket server URL from environment or command line
const websocketServerUrl = process.argv[2] || process.env.WEBSOCKET_SERVER_URL;

if (!websocketServerUrl) {
    console.error('Usage: node build-static.js [websocket-server-url]');
    console.error('   or: Set WEBSOCKET_SERVER_URL in .env file');
    console.error('');
    console.error('Example: node build-static.js https://my-websocket-server.com');
    console.error('   or: WEBSOCKET_SERVER_URL=https://my-websocket-server.com in .env');
    process.exit(1);
}

console.log(`Building static version with WebSocket server: ${websocketServerUrl}`);

// Create dist directory
const distDir = path.join(__dirname, 'dist-static');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy public directory to dist
const publicDir = path.join(__dirname, 'public');
const copyRecursive = (src, dest) => {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        files.forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

copyRecursive(publicDir, distDir);

// Update index.html with WebSocket server URL
const indexPath = path.join(distDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Add meta tag for WebSocket server URL
indexContent = indexContent.replace(
    '<!-- <meta name="websocket-server-url" content="https://your-websocket-server.com"> -->',
    `<meta name="websocket-server-url" content="${websocketServerUrl}">`
);

// Also add Socket.IO client from CDN since we won't have the server serving it
indexContent = indexContent.replace(
    '<script src="/socket.io/socket.io.js"></script>',
    '<script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>'
);

fs.writeFileSync(indexPath, indexContent);

// Create a config.js file as an alternative configuration method
const configContent = `// WebSocket server configuration
window.WEBSOCKET_SERVER_URL = '${websocketServerUrl}';
console.log('WebSocket server configured via config.js:', window.WEBSOCKET_SERVER_URL);
`;

fs.writeFileSync(path.join(distDir, 'config.js'), configContent);

// Update index.html to include config.js
indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(
    '<script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>',
    `<script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
    <script src="/config.js"></script>`
);
fs.writeFileSync(indexPath, indexContent);

console.log(`✅ Static build complete!`);
console.log(`📁 Files generated in: ${distDir}`);
console.log(`🌐 WebSocket server URL: ${websocketServerUrl}`);
console.log('');
console.log('To serve the static files:');
console.log(`   cd ${path.relative(process.cwd(), distDir)}`);
console.log('   python -m http.server 8080');
console.log('   # or use any static file server');
console.log('');
console.log('The frontend will connect to:', websocketServerUrl);
