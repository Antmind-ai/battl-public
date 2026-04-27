import { Jersey10_400Regular, useFonts } from '@expo-google-fonts/jersey-10';
import * as Battery from 'expo-battery';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SCANLINE_COUNT = 240;
const SCANLINE_STEP = 3;
const BATTERY_GRID_VERTICAL = 14;
const BATTERY_GRID_HORIZONTAL = 5;
const BUTTON_SHADOW_OFFSET = 5;
const BUTTON_SPRING = { damping: 14, stiffness: 280, mass: 0.6 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function triggerImpact(style: Haptics.ImpactFeedbackStyle) {
  void Haptics.impactAsync(style).catch(() => {});
}

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    Jersey10_400Regular,
  });
  const [batteryLevel, setBatteryLevel] = useState(0.0419);
  const [batteryState, setBatteryState] = useState(Battery.BatteryState.UNKNOWN);
  const actionPressed = useSharedValue(0);

  useEffect(() => {
    let mounted = true;

    const hydrateBattery = async () => {
      try {
        const [level, state] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
        ]);

        if (!mounted) {
          return;
        }

        if (Number.isFinite(level) && level >= 0) {
          setBatteryLevel(clamp(level, 0, 1));
        }

        setBatteryState(state);
      } catch {
        // Keep fallback values if battery APIs are temporarily unavailable.
      }
    };

    hydrateBattery();

    const levelSubscription = Battery.addBatteryLevelListener(({ batteryLevel: level }) => {
      if (Number.isFinite(level) && level >= 0) {
        setBatteryLevel(clamp(level, 0, 1));
      }
    });

    const stateSubscription = Battery.addBatteryStateListener(({ batteryState: state }) => {
      setBatteryState(state);
    });

    return () => {
      mounted = false;
      levelSubscription.remove();
      stateSubscription.remove();
    };
  }, []);

  const safeLevel = useMemo(() => clamp(batteryLevel, 0, 1), [batteryLevel]);
  const isCharging = batteryState === Battery.BatteryState.CHARGING;
  const batteryFill = Math.max(safeLevel, 0.018);
  const accessPercent = `${(safeLevel * 100).toFixed(2)}%`;
  const actionFaceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: actionPressed.value * BUTTON_SHADOW_OFFSET },
      { translateY: actionPressed.value * BUTTON_SHADOW_OFFSET },
    ],
  }));

  const actionShadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - actionPressed.value * 0.85,
    transform: [
      { scaleX: 1 - actionPressed.value * 0.04 },
      { scaleY: 1 - actionPressed.value * 0.1 },
    ],
  }));

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  const batteryStatusText = isCharging
    ? 'charging now - stay online'
    : safeLevel <= 0.08
      ? 'battery critical - welcome'
      : 'power stable - stand by';

  const handleButtonPressIn = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Heavy);
    actionPressed.value = withSpring(1, BUTTON_SPRING);
  };

  const handleButtonPressOut = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    actionPressed.value = withSpring(0, BUTTON_SPRING);
  };

  const handleButtonPress = () => {};

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.mainColumn}>
        <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.topLabel}>
          you qualified
        </Text>

        <View style={styles.batteryWrap}>
          <View style={styles.batteryBody}>
            {Array.from({ length: BATTERY_GRID_VERTICAL }).map((_, index) => (
              <View
                key={`vb-${index}`}
                style={[
                  styles.batteryVerticalLine,
                  { left: `${((index + 1) / (BATTERY_GRID_VERTICAL + 1)) * 100}%` },
                ]}
              />
            ))}
            {Array.from({ length: BATTERY_GRID_HORIZONTAL }).map((_, index) => (
              <View
                key={`hb-${index}`}
                style={[
                  styles.batteryHorizontalLine,
                  { top: `${((index + 1) / (BATTERY_GRID_HORIZONTAL + 1)) * 100}%` },
                ]}
              />
            ))}

            <View style={[styles.batteryFill, { width: `${batteryFill * 100}%` }]} />
          </View>
          <View style={styles.batteryTip}>
            <View style={styles.batteryTipLine} />
            <View style={styles.batteryTipLine} />
            <View style={styles.batteryTipLine} />
          </View>
        </View>

        <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.accessGranted}>
          ACCESS GRANTED:
        </Text>
        <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.percentText}>
          {accessPercent}
        </Text>
        <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.statusText}>
          {batteryStatusText}
        </Text>

        <View style={styles.actionButtonWrapper}>
          <Animated.View style={[styles.actionButtonShadow, actionShadowStyle]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enter Game"
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            onPress={handleButtonPress}
            style={styles.actionButtonPressable}
            android_ripple={null}
          >
            <Animated.View style={[styles.actionButtonFace, actionFaceStyle]}>
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.actionButtonText}>
                ENTER GAME
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <View pointerEvents="none" style={styles.scanlineOverlay}>
        {Array.from({ length: SCANLINE_COUNT }).map((_, index) => (
          <View
            key={`scan-${index}`}
            style={[
              styles.scanline,
              {
                top: index * SCANLINE_STEP,
                opacity: index % 2 === 0 ? 0.28 : 0.12,
              },
            ]}
          />
        ))}
      </View>

      <View pointerEvents="none" style={styles.phosphorTint} />

      <View pointerEvents="none" style={styles.vignette} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030604',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#030604',
  },
  mainColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
    gap: 14,
  },
  topLabel: {
    fontFamily: 'Jersey10_400Regular',
    color: '#12de55',
    fontSize: 28,
    letterSpacing: 0.8,
    marginBottom: 22,
    textShadowColor: 'rgba(18, 222, 85, 0.32)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  batteryWrap: {
    width: '92%',
    maxWidth: 320,
    height: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  batteryBody: {
    flex: 1,
    height: '100%',
    borderColor: '#f4f4f4',
    borderWidth: 6,
    backgroundColor: '#050505',
    position: 'relative',
    overflow: 'hidden',
  },
  batteryTip: {
    width: 16,
    height: 52,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderColor: '#f4f4f4',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#0c0c0c',
  },
  batteryTipLine: {
    width: '64%',
    height: 2,
    backgroundColor: '#bbbbbb',
  },
  batteryVerticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  batteryHorizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  batteryFill: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    left: 12,
    backgroundColor: '#ff2b32',
  },
  accessGranted: {
    fontFamily: 'Jersey10_400Regular',
    color: '#12de55',
    fontSize: 30,
    letterSpacing: 0.6,
    marginTop: 12,
    textShadowColor: 'rgba(18, 222, 85, 0.24)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  percentText: {
    fontFamily: 'Jersey10_400Regular',
    color: '#22ff51',
    fontSize: 84,
    letterSpacing: 1.8,
    marginTop: 4,
    textShadowColor: 'rgba(34, 255, 81, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statusText: {
    fontFamily: 'Jersey10_400Regular',
    color: '#12de55',
    fontSize: 22,
    marginTop: -2,
    textAlign: 'center',
    textShadowColor: 'rgba(18, 222, 85, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  actionButtonWrapper: {
    width: '96%',
    maxWidth: 360,
    marginTop: 24,
    paddingRight: BUTTON_SHADOW_OFFSET,
    paddingBottom: BUTTON_SHADOW_OFFSET,
  },
  actionButtonShadow: {
    position: 'absolute',
    top: BUTTON_SHADOW_OFFSET,
    left: BUTTON_SHADOW_OFFSET,
    right: 0,
    bottom: 0,
    backgroundColor: '#7e6138',
    borderRadius: 20,
  },
  actionButtonPressable: {
    width: '100%',
  },
  actionButtonFace: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#a9834c',
    borderRadius: 20,
    backgroundColor: '#e6dcc2',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: 'Jersey10_400Regular',
    color: '#5d4120',
    fontSize: 24,
    lineHeight: 22,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#000000',
  },
  phosphorTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 18, 11, 0.08)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
});
