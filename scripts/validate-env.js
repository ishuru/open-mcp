#!/usr/bin/env node

const requiredVars = ['GOOGLE_GENERATIVE_AI_API_KEY'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach(v => console.error(`  - ${v}`));
  console.error('\nPlease set these secrets in your Codespace configuration.');
  console.error('For GitHub Codespaces, go to: Settings > Secrets and variables > Codespaces');
  process.exit(1);
}

console.log('Environment validated successfully');
