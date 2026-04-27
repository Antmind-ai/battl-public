import { Jersey10_400Regular, useFonts } from '@expo-google-fonts/jersey-10';
import * as Battery from 'expo-battery';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BUTTON_SHADOW_OFFSET, styles as screenStyles } from '../styles/index.styles';

const styles = screenStyles as Record<string, object>;

const SCANLINE_STEP = 2;
const BATTERY_GRID_VERTICAL = 10;
const BATTERY_GRID_HORIZONTAL = 4;
const BUTTON_SPRING = { damping: 14, stiffness: 280, mass: 0.6 };
const QUALIFIED_ICON = ['01110', '12021', '12221', '01110', '01010'];

const QUALIFIED_ICON_PALETTE: Record<string, string> = {
  '0': 'transparent',
  '1': '#7dff3a',
  '2': '#051006',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function triggerImpact(style: Haptics.ImpactFeedbackStyle) {
  void Haptics.impactAsync(style).catch(() => {});
}

function PixelArt({
  map,
  palette,
  pixelSize,
}: {
  map: string[];
  palette: Record<string, string>;
  pixelSize: number;
}) {
  return (
    <View>
      {map.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.pixelRow}>
          {row.split('').map((cell, colIndex) => (
            <View
              key={`cell-${rowIndex}-${colIndex}`}
              style={[
                styles.pixelCell,
                {
                  width: pixelSize,
                  height: pixelSize,
                  backgroundColor: palette[cell] ?? 'transparent',
                },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    Jersey10_400Regular,
  });
  const [batteryLevel, setBatteryLevel] = useState(0.0419);
  const [batteryState, setBatteryState] = useState(Battery.BatteryState.UNKNOWN);
  const { height: windowHeight } = useWindowDimensions();
  const actionPressed = useSharedValue(0);
  const howToPressed = useSharedValue(0);

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
  const batteryFill = Math.max(safeLevel, 0.018);
  const scanlineCount = useMemo(() => Math.ceil(windowHeight / SCANLINE_STEP) + 2, [windowHeight]);
  const accessPercent = `${(safeLevel * 100).toFixed(2)}%`;
  const qualifiedText = 'YOU QUALIFIED!';
  const accessMessage = 'ONLY THE LOWEST SURVIVE.';
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

  const howToFaceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: howToPressed.value * BUTTON_SHADOW_OFFSET },
      { translateY: howToPressed.value * BUTTON_SHADOW_OFFSET },
    ],
  }));

  const howToShadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - howToPressed.value * 0.85,
    transform: [
      { scaleX: 1 - howToPressed.value * 0.04 },
      { scaleY: 1 - howToPressed.value * 0.1 },
    ],
  }));

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  const handleButtonPressIn = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Heavy);
    actionPressed.value = withSpring(1, BUTTON_SPRING);
  };

  const handleButtonPressOut = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    actionPressed.value = withSpring(0, BUTTON_SPRING);
  };

  const handleButtonPress = () => {};

  const handleHowToPressIn = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Heavy);
    howToPressed.value = withSpring(1, BUTTON_SPRING);
  };

  const handleHowToPressOut = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    howToPressed.value = withSpring(0, BUTTON_SPRING);
  };

  const handleHowToPress = () => {};

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.mainColumn}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/logo.webp')}
            style={styles.logoImage}
            contentFit="contain"
            transition={120}
          />
        </View>

        <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.topTagline}>
          LOW POWER. HIGHER STAKES.
        </Text>

        <View style={styles.qualifiedPill}>
          <View style={[styles.qualifiedEar, styles.qualifiedEarLeft]} />
          <View style={[styles.qualifiedEar, styles.qualifiedEarRight]} />
          <View style={styles.qualifiedIconWrap}>
            <PixelArt map={QUALIFIED_ICON} palette={QUALIFIED_ICON_PALETTE} pixelSize={4} />
          </View>
          <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.qualifiedText}>
            {qualifiedText}
          </Text>
        </View>

        <View style={styles.batteryPanel}>
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

          <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.percentText}>
            {accessPercent}
          </Text>
          <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.powerRemainingText}>
            POWER REMAINING
          </Text>
        </View>

        <View style={styles.accessPanel}>
          <View style={styles.accessCopy}>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.accessPanelTitle}>
              ACCESS GRANTED
            </Text>
            <View style={styles.accessPanelDivider} />
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.accessPanelText}>
              {accessMessage}
            </Text>
          </View>

          <View style={styles.operatorSpriteWrap}>
            <Image
              source={require('../assets/splash-character.webp')}
              style={styles.operatorImage}
              contentFit="contain"
              transition={0}
            />
          </View>
        </View>

        <View style={styles.bottomButtonsDock}>
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
                  {'> ENTER GAME <'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>

          <View style={[styles.actionButtonWrapper, styles.howToButtonWrapper]}>
            <Animated.View style={[styles.actionButtonShadow, styles.howToButtonShadow, howToShadowStyle]} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="How to play"
              onPressIn={handleHowToPressIn}
              onPressOut={handleHowToPressOut}
              onPress={handleHowToPress}
              style={styles.actionButtonPressable}
              android_ripple={null}
            >
              <Animated.View style={[styles.actionButtonFace, styles.howToButtonFace, howToFaceStyle]}>
                <Text
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1}
                  style={[styles.actionButtonText, styles.howToButtonText]}
                >
                  HOW TO PLAY
                </Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </View>

      <View pointerEvents="none" style={styles.scanlineOverlay}>
        {Array.from({ length: scanlineCount }).map((_, index) => (
          <View
            key={`scan-${index}`}
            style={[
              styles.scanline,
              {
                top: index * SCANLINE_STEP,
                opacity: index % 2 === 0 ? 0.22 : 0.08,
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
