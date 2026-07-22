// Metro config for the monorepo: watch the workspace root so `@riposte/core`
// (TypeScript source) resolves, and look in both the app and root node_modules.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  // Several Expo runtime packages (expo-modules-core, expo-asset,
  // expo-file-system, expo-keep-awake) are imported by other Expo packages
  // but don't hoist to the top level: expo-modules-core's *optional* peer on
  // react-native-worklets caps at 0.10.x while the app uses 0.11.1 (required
  // by react-native-reanimated 4), so npm tucks them under expo/node_modules
  // instead. Point Metro at that nested folder so those siblings resolve.
  path.resolve(projectRoot, 'node_modules/expo/node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Leave hierarchical lookup ON (Metro's default) so a package's own nested
// node_modules still resolve — e.g. moti bundles framer-motion under
// moti/node_modules. Disabling it (as some Expo monorepo templates do)
// assumes everything hoists cleanly, which this dependency tree doesn't.

module.exports = config;
