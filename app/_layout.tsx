import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, View } from 'react-native';

// Silence the harmless `onAnimatedValueUpdate with no listeners registered` warning
// emitted by react-native-screens during native-stack transitions (e.g. entering /game).
const IGNORED_WARNING_PATTERNS = [/Sending `onAnimatedValueUpdate` with no listeners registered/];

LogBox.ignoreLogs(IGNORED_WARNING_PATTERNS);

const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const firstArg = args[0];
  if (typeof firstArg === 'string' && IGNORED_WARNING_PATTERNS.some((pattern) => pattern.test(firstArg))) {
    return;
  }
  originalConsoleWarn(...args);
};

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
      <StatusBar style="light" backgroundColor="#000000" />
    </View>
  );
}
