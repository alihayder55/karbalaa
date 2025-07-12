#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restarting Walcard Development Environment...\n');

const commands = [
  'npx expo install --fix',
  'npm install',
  'npx expo start --clear'
];

async function runCommands() {
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`\n📝 Step ${i + 1}/${commands.length}: ${command}`);
    
    try {
      if (i === commands.length - 1) {
        console.log('🚀 Starting Expo development server...');
        console.log('This will open the development server. Use your Expo Go app to scan the QR code.\n');
      }
      
      execSync(command, { 
        stdio: 'inherit', 
        cwd: process.cwd() 
      });
      
      if (i === commands.length - 1) {
        break; // Don't wait for expo start to finish
      }
      
    } catch (error) {
      console.error(`❌ Error running command: ${command}`);
      console.error(error.message);
      
      if (i < commands.length - 1) {
        console.log('⚠️ Continuing with next step...\n');
      }
    }
  }
}

// Check if we're in the correct directory
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this script from the walcard directory.');
  process.exit(1);
}

runCommands().catch(console.error); 