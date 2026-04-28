import { Jersey10_400Regular, useFonts } from '@expo-google-fonts/jersey-10';
import * as Battery from 'expo-battery';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BUTTON_SHADOW_OFFSET, styles as screenStyles } from '../styles/index.styles';
import {
  isPlayerQualifiedByBattery,
  MINIMUM_QUALIFIED_BATTERY_PERCENTAGE,
} from '../utils/batteryQualification';
import { getOnboardingProfile } from '../utils/onboardingStorage';

const styles = screenStyles as Record<string, object>;

const SCANLINE_STEP = 2;
const BATTERY_GRID_VERTICAL = 10;
const BATTERY_GRID_HORIZONTAL = 4;
const BATTERY_POLL_INTERVAL_MS = 1500;
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(0.0419);
  const [batteryState, setBatteryState] = useState(Battery.BatteryState.UNKNOWN);
  const { height: windowHeight } = useWindowDimensions();
  const actionPressed = useSharedValue(0);
  const howToPressed = useSharedValue(0);

  useEffect(() => {
    let mounted = true;

    const hydrateOnboarding = async () => {
      const storedProfile = await getOnboardingProfile();

      if (!mounted) {
        return;
      }

      setHasCompletedOnboarding(Boolean(storedProfile?.hasCompletedOnboarding));
    };

    void hydrateOnboarding();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateBattery = async () => {
      try {
        const [level, nextState] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
        ]);

        if (!mounted) {
          return;
        }

        setBatteryState(nextState);

        if (Number.isFinite(level) && level >= 0) {
          setBatteryLevel(clamp(level, 0, 1));
        }
      } catch {
        // Keep fallback values if battery APIs are temporarily unavailable.
      }
    };

    hydrateBattery();

    const pollBatteryLevel = async () => {
      try {
        const [level, nextState] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
        ]);

        if (!mounted) {
          return;
        }

        setBatteryState(nextState);

        if (Number.isFinite(level) && level >= 0) {
          setBatteryLevel(clamp(level, 0, 1));
        }
      } catch {
        // Keep current battery UI values if polling is temporarily unavailable.
      }
    };

    const batteryPollInterval = setInterval(() => {
      void pollBatteryLevel();
    }, BATTERY_POLL_INTERVAL_MS);

    const levelSubscription = Battery.addBatteryLevelListener(({ batteryLevel: level }) => {
      if (Number.isFinite(level) && level >= 0) {
        setBatteryLevel(clamp(level, 0, 1));
      }
    });

    const stateSubscription = Battery.addBatteryStateListener(({ batteryState: nextState }) => {
      setBatteryState(nextState);
    });

    return () => {
      mounted = false;
      clearInterval(batteryPollInterval);
      levelSubscription.remove();
      stateSubscription.remove();
    };
  }, []);

  const safeLevel = useMemo(() => clamp(batteryLevel, 0, 1), [batteryLevel]);
  const isQualified = useMemo(
    () => isPlayerQualifiedByBattery(safeLevel, batteryState),
    [batteryState, safeLevel]
  );
  const batteryFill = Math.max(safeLevel, 0.018);
  const scanlineCount = useMemo(() => Math.ceil(windowHeight / SCANLINE_STEP) + 2, [windowHeight]);
  const accessPercent = `${(safeLevel * 100).toFixed(2)}%`;
  const qualifiedText = isQualified ? 'YOU QUALIFIED!' : 'NOT QUALIFIED';
  const accessTitle = isQualified ? 'ACCESS GRANTED' : 'ACCESS DENIED';
  const accessMessage = isQualified
    ? `BATTERY BELOW ${MINIMUM_QUALIFIED_BATTERY_PERCENTAGE}%\nUNPLUGGED TO SURVIVE.`
    : `BATTERY MUST STAY BELOW ${MINIMUM_QUALIFIED_BATTERY_PERCENTAGE}%\nAND NOT CHARGING.`;
  const actionButtonLabel = hasCompletedOnboarding ? '> ENTER GAME <' : '> ENTER GAME <';
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
    if (!isQualified) {
      return;
    }

    triggerImpact(Haptics.ImpactFeedbackStyle.Heavy);
    actionPressed.value = withSpring(1, BUTTON_SPRING);
  };

  const handleButtonPressOut = () => {
    if (!isQualified) {
      return;
    }

    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    actionPressed.value = withSpring(0, BUTTON_SPRING);
  };

  const handleButtonPress = () => {
    if (!isQualified) {
      return;
    }

    const routePlayer = async () => {
      const storedProfile = await getOnboardingProfile();

      if (storedProfile?.hasCompletedOnboarding) {
        setHasCompletedOnboarding(true);
        router.replace('/game');
        return;
      }

      setHasCompletedOnboarding(false);
      router.push('/onboarding');
    };

    void routePlayer();
  };

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

        <View style={styles.centerCluster}>
          <View style={styles.batteryPanel}>
            <View style={styles.qualifiedPill}>
              <View style={[styles.qualifiedEar, styles.qualifiedEarLeft]} />
              <View style={[styles.qualifiedEar, styles.qualifiedEarRight]} />
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} numberOfLines={1} style={styles.qualifiedText}>
                {qualifiedText}
              </Text>
            </View>

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
              <Text
                allowFontScaling={false}
                maxFontSizeMultiplier={1}
                numberOfLines={1}
                style={[styles.accessPanelTitle, !isQualified && styles.accessPanelTitleDenied]}
              >
                {accessTitle}
              </Text>
              <View style={styles.accessPanelDivider} />
              <Text
                allowFontScaling={false}
                maxFontSizeMultiplier={1}
                style={[styles.accessPanelText, !isQualified && styles.accessPanelTextDenied]}
              >
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
        </View>

        <View style={styles.bottomButtonsDock}>
          <View style={styles.actionButtonWrapper}>
            <Animated.View
              style={[
                styles.actionButtonShadow,
                actionShadowStyle,
                !isQualified && styles.actionButtonShadowDisabled,
              ]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enter Game"
              accessibilityState={{ disabled: !isQualified }}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              onPress={handleButtonPress}
              disabled={!isQualified}
              style={[styles.actionButtonPressable, !isQualified && styles.actionButtonPressableDisabled]}
              android_ripple={null}
            >
              <Animated.View
                style={[
                  styles.actionButtonFace,
                  actionFaceStyle,
                  !isQualified && styles.actionButtonFaceDisabled,
                ]}
              >
                <Text
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1}
                  numberOfLines={1}
                  style={[styles.actionButtonText, !isQualified && styles.actionButtonTextDisabled]}
                >
                  {actionButtonLabel}
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
                  numberOfLines={1}
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
