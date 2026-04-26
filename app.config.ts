import { ConfigContext, ExpoConfig } from 'expo/config';
import packageJson from './package.json';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Battl',
  slug: 'battl',
  scheme: 'battl',
  owner: 'antmind',
  version: packageJson.version,
  description: 'Battl is created by Antmind Ventures Private Limited.',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#F9F5F0',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'ai.antmind.battl',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F9F5F0',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'ai.antmind.battl',
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },
  extra: {
    router: {},
    creator: 'Antmind Ventures Private Limited',
  },
});