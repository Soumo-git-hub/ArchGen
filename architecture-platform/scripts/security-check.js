#!/usr/bin/env node

/**
 * Environment Security Check
 * Validates that environment variables are properly configured
 * and no secrets are committed to the codebase.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = ['API_KEY'];
const SECURITY_PATTERNS = [
  /AIzaSy[A-Za-z0-9_-]+/g, // Google API keys
  /sk-[A-Za-z0-9]+/g,       // OpenAI API keys
  /xoxb-[A-Za-z0-9-]+/g,    // Slack bot tokens
];

function checkEnvironmentFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Missing .env file! Copy .env.example to .env and configure your API keys.');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = [];

  for (const varName of REQUIRED_VARS) {
    const varPattern = new RegExp(`${varName}=(.+)`);
    const match = envContent.match(varPattern);
    
    if (!match || !match[1] || match[1].trim() === '' || match[1].startsWith('your_')) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error(`❌ Missing or unconfigured environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  console.log('✅ Environment configuration looks good!');
  return true;
}

function checkCodebaseForSecrets() {
  const filesToCheck = [
    '../app/api/generate-architecture/route.ts',
    '../app/api/parse-requirements/route.ts',
  ];

  let foundSecrets = false;

  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of SECURITY_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          console.error(`❌ Found potential hardcoded secrets in ${file}:`);
          matches.forEach(match => console.error(`   ${match.substring(0, 10)}...`));
          foundSecrets = true;
        }
      }
    }
  }

  if (!foundSecrets) {
    console.log('✅ No hardcoded secrets found in codebase!');
  }

  return !foundSecrets;
}

function main() {
  console.log('🔐 ArchGen Security Check');
  console.log('========================');
  
  const envCheck = checkEnvironmentFile();
  const secretsCheck = checkCodebaseForSecrets();
  
  if (envCheck && secretsCheck) {
    console.log('\n🎉 All security checks passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Security issues found. Please fix them before proceeding.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvironmentFile, checkCodebaseForSecrets };