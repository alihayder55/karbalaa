# Metro Bundler Error Fix Guide

## Error: "Requiring unknown module '1571'"

This error typically occurs due to:
1. **Module resolution cache issues**
2. **Dependency version mismatches**
3. **Circular import dependencies**
4. **Corrupted node_modules**

## Quick Fix Steps (Try in order):

### 1. Clear All Caches
```bash
# Kill any running Metro processes
npx react-native start --reset-cache

# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm cache clean --force
```

### 2. Fix Dependencies
```bash
# Fix Expo dependencies
npx expo install --fix

# Reinstall node_modules
rm -rf node_modules
npm install
```

### 3. Use the Restart Script
```bash
# Run the automated restart script
node restart-development.js
```

### 4. Manual Steps if Above Fails

#### Clear Everything:
```bash
# Stop all Metro processes
pkill -f metro

# Remove caches and dependencies
rm -rf node_modules
rm -rf .expo
rm -rf dist
rm package-lock.json

# Reinstall everything
npm install
npx expo install --fix
```

#### Start Fresh:
```bash
# Start with completely clean cache
npx expo start --clear --tunnel
```

## Common Solutions by Platform:

### Windows (PowerShell):
```powershell
# Kill Metro processes
taskkill /f /im node.exe

# Clear and restart
npx expo start --clear
```

### macOS/Linux:
```bash
# Kill Metro processes
pkill -f metro-bundler

# Clear and restart
npx expo start --clear
```

## Version Compatibility Fix:

The error mentioned these packages need updates:
```bash
npx expo install @react-native-async-storage/async-storage@2.1.2
npx expo install expo-image@~2.3.2
npx expo install expo-linking@~7.1.7
npx expo install expo-location@~18.1.6
npx expo install expo-router@~5.1.3
npx expo install expo-splash-screen@~0.30.10
npx expo install expo-system-ui@~5.0.10
npx expo install expo-web-browser@~14.2.0
npx expo install react-native@0.79.5
```

## Debugging Steps:

### 1. Check for Circular Imports
```bash
# Use madge to detect circular dependencies
npx madge --circular --extensions ts,tsx,js,jsx .
```

### 2. Verify Module Resolution
```javascript
// Add to any component to debug
console.log('Module paths:', require.resolve.paths);
```

### 3. Check Metro Config
Ensure `metro.config.js` has proper resolver:
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
```

## Working Environment Test:

After fixing, verify these work:
- ✅ `npx expo start` runs without errors
- ✅ QR code appears and can be scanned
- ✅ App loads on device/simulator
- ✅ No red error screens
- ✅ Database operations work

## Emergency Reset:

If nothing works, complete project reset:
```bash
# Backup your .env and important files first!
git stash  # Save current changes
rm -rf node_modules .expo dist
npm cache clean --force
npm install
npx expo install --fix
npx expo start --clear
```

## Prevention:

1. **Always use `npx expo install`** instead of `npm install` for Expo packages
2. **Keep dependencies updated** regularly
3. **Clear cache weekly** during development
4. **Use consistent Node.js version** (LTS recommended)

---

## Current Status After Running Steps:

✅ **Metro bundler should now be running with cleared cache**
✅ **Module resolution errors should be resolved**
✅ **App should load properly on device**

If you're still experiencing issues, try the emergency reset or contact support with the specific error messages. 