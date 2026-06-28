const { execSync } = require('child_process');
const http = require('http');

const BACKEND_URL = 'http://localhost:3001/api/openapi.json';

http.get(BACKEND_URL, (res) => {
  if (res.statusCode === 200) {
    console.log('[predev] Backend reachable, generating client…');
    execSync('npx @hey-api/openapi-ts', { stdio: 'inherit' });
  } else {
    console.warn(`[predev] Backend returned status ${res.statusCode}, skipping codegen`);
  }
}).on('error', () => {
  console.warn('[predev] Backend not reachable (is the dev server running?), skipping codegen');
});
