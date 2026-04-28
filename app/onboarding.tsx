import { Jersey10_400Regular, useFonts } from '@expo-google-fonts/jersey-10';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CharacterId } from '../components/game/gameAssets';
import { onboardingStyles as styles } from '../styles/onboarding.styles';
import { getOnboardingProfile, saveOnboardingProfile } from '../utils/onboardingStorage';

const MAX_USERNAME_LENGTH = 12;

const CHARACTER_PREVIEWS: Record<CharacterId, number> = {
  1: require('../assets/game/characters/1-bottom-idle.webp'),
  2: require('../assets/game/characters/2-bottom-idle.webp'),
  3: require('../assets/game/characters/3-bottom-idle.webp'),
  4: require('../assets/game/characters/4-bottom-idle.webp'),
};

const CHARACTER_IDS: CharacterId[] = [1, 2, 3, 4];

type Tier = {
  name: string;
  range: string;
  title: string;
  description: string;
  perks: string[];
  pillColor: string;
  tagColor: string;
};

const PLAYER_TIERS: Tier[] = [
  {
    name: 'Ghost',
    range: '0 - 4 min',
    title: 'Just entered',
    description: 'Grayscale 1-bit avatar. Can move and read global chat.',
    perks: ['Map access'],
    pillColor: '#1a2f4f',
    tagColor: '#1a2f4f',
  },
  {
    name: 'Static',
    range: '5 - 14 min',
    title: 'First signal',
    description: 'Blue tint on avatar. Unlocks global chat + basic emotes. Can add socials to profile.',
    perks: ['Chat', 'Socials'],
    pillColor: '#224f89',
    tagColor: '#224f89',
  },
  {
    name: 'Flicker',
    range: '15 - 29 min',
    title: 'Holding on',
    description: 'Brighter blue. Unlocks tapping users to see username, level, and battery %.',
    perks: ['Tap profiles'],
    pillColor: '#297cb6',
    tagColor: '#297cb6',
  },
  {
    name: 'Signal',
    range: '30 - 59 min',
    title: "You're real",
    description: "Green aura. Other users' socials become visible when tapped.",
    perks: ['View socials'],
    pillColor: '#1f805d',
    tagColor: '#1f805d',
  },
  {
    name: 'Drain',
    range: '60 - 179 min',
    title: 'Deep in the grid',
    description: 'Amber-brown. Avatar gets animated shimmer. Unlocks Drain Zone entry.',
    perks: ['Drain Zones', 'Shimmer'],
    pillColor: '#8b4d1f',
    tagColor: '#8b4d1f',
  },
  {
    name: 'Phantom',
    range: '180 - 359 min',
    title: 'Known in the low',
    description: 'Deep red. Animated avatar aura. Unlocks private whispers (DM) to other users.',
    perks: ['Whispers', 'Aura'],
    pillColor: '#7f1f38',
    tagColor: '#7f1f38',
  },
  {
    name: 'Legend',
    range: '360 - 719 min',
    title: 'The ones who stayed',
    description: 'Electric violet. Name highlighted on leaderboard. Can broadcast one message per session.',
    perks: ['Broadcast', 'Gold name'],
    pillColor: '#4642b8',
    tagColor: '#4642b8',
  },
  {
    name: 'Immortal',
    range: '720+ min',
    title: 'Eternal low',
    description: 'Black aura, neon pink edge. Custom title badge. Name remains on the all-time board forever.',
    perks: ['Custom title', 'Permanent fame'],
    pillColor: '#1a1a1a',
    tagColor: '#3f2b50',
  },
];

const STEP_TITLES = ['Your Name', 'Pick Character', 'How Battl Works'] as const;

function splitGraphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), (segment) => segment.segment);
  }

  return Array.from(value);
}

function trimToGraphemeLimit(value: string, maxLength: number): string {
  const graphemes = splitGraphemes(value);
  if (graphemes.length <= maxLength) {
    return value;
  }

  return graphemes.slice(0, maxLength).join('');
}

export default function OnboardingScreen() {
  const [fontsLoaded] = useFonts({
    Jersey10_400Regular,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrateExistingOnboarding = async () => {
      const storedProfile = await getOnboardingProfile();

      if (!mounted || !storedProfile?.hasCompletedOnboarding) {
        return;
      }

      router.replace('/game');
    };

    void hydrateExistingOnboarding();

    return () => {
      mounted = false;
    };
  }, []);

  const usernameLength = useMemo(() => splitGraphemes(username).length, [username]);
  const isUsernameValid = username.trim().length > 0 && usernameLength <= MAX_USERNAME_LENGTH;
  const canProceed =
    (stepIndex === 0 && isUsernameValid) ||
    (stepIndex === 1 && selectedCharacterId !== null) ||
    (stepIndex === 2 && !isSaving);

  const stepProgress = `${stepIndex + 1} / 3`;
  const progressPercent = `${((stepIndex + 1) / STEP_TITLES.length) * 100}%` as `${number}%`;

  const triggerTapHaptic = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleUsernameChange = (nextValue: string) => {
    setUsername(trimToGraphemeLimit(nextValue, MAX_USERNAME_LENGTH));
  };

  const handleBack = () => {
    triggerTapHaptic();
    Keyboard.dismiss();

    if (stepIndex === 0) {
      router.back();
      return;
    }

    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleContinue = async () => {
    Keyboard.dismiss();

    if (!canProceed) {
      return;
    }

    triggerTapHaptic();

    if (stepIndex < STEP_TITLES.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }

    if (!selectedCharacterId) {
      return;
    }

    setIsSaving(true);

    try {
      await saveOnboardingProfile({
        username,
        characterId: selectedCharacterId,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/game');
    } catch {
      setIsSaving(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <View style={styles.header}>
          <View style={styles.stepMetaRow}>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.stepMetaText}>
              {stepProgress}
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: progressPercent }]} />
          </View>
        </View>

        <View style={styles.stepShell}>
          <Animated.View
            key={`step-${stepIndex}`}
            entering={SlideInRight.duration(260)}
            exiting={SlideOutLeft.duration(200)}
            style={{ flex: 1 }}
          >
            {stepIndex === 0 ? (
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.sectionLabel}>
                  STEP 1
                </Text>
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.promptText}>
                  Pick your username
                </Text>
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.helperText}>
                  Max 12 characters. Emojis and symbols are welcome.
                </Text>

                <View style={styles.inputWrap}>
                  <TextInput
                    value={username}
                    onChangeText={handleUsernameChange}
                    placeholder="Type your battl name"
                    placeholderTextColor="#698391"
                    style={styles.usernameInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                    maxLength={80}
                    returnKeyType="done"
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1}
                  />
                </View>

                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.characterCounter}>
                  {usernameLength}/{MAX_USERNAME_LENGTH}
                </Text>
              </View>
            ) : null}

            {stepIndex === 1 ? (
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.sectionLabel}>
                  STEP 2
                </Text>
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.promptText}>
                  Choose your character
                </Text>
                <Text
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1}
                  style={[styles.helperText, styles.characterHelperText]}
                >
                  Pick one avatar. You can swap it later from profile settings.
                </Text>

                <View style={styles.characterGrid}>
                  {CHARACTER_IDS.map((characterId) => {
                    const selected = selectedCharacterId === characterId;

                    return (
                      <Pressable
                        key={`char-${characterId}`}
                        style={[styles.characterCard, selected && styles.characterCardActive]}
                        accessibilityRole="button"
                        accessibilityLabel={`Choose character ${characterId}`}
                        onPress={() => {
                          triggerTapHaptic();
                          setSelectedCharacterId(characterId);
                        }}
                      >
                        <Image
                          source={CHARACTER_PREVIEWS[characterId]}
                          contentFit="contain"
                          style={styles.characterImage}
                          transition={80}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {stepIndex === 2 ? (
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.sectionLabel}>
                  STEP 3
                </Text>
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.promptText}>
                  Level up to unlock
                </Text>

                <ScrollView style={styles.levelList} showsVerticalScrollIndicator={false}>
                  {PLAYER_TIERS.map((tier) => (
                    <View key={tier.name} style={styles.tierCard}>
                      <View style={styles.tierTopRow}>
                        <View style={[styles.tierPill, { backgroundColor: tier.pillColor }]}>
                          <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.tierPillLabel}>
                            {tier.name}
                          </Text>
                        </View>
                        <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.tierRange}>
                          {tier.range}
                        </Text>
                      </View>

                      <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.tierTitle}>
                        {tier.title}
                      </Text>
                      <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.tierDescription}>
                        {tier.description}
                      </Text>

                      <View style={styles.tagRow}>
                        {tier.perks.map((perk) => (
                          <View key={`${tier.name}-${perk}`} style={[styles.tagChip, { backgroundColor: tier.tagColor }]}>
                            <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.tagLabel}>
                              {perk}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={stepIndex === 2 ? 'Complete onboarding' : 'Continue onboarding'}
            onPress={() => {
              void handleContinue();
            }}
            disabled={!canProceed || isSaving}
            style={[styles.primaryButton, (!canProceed || isSaving) && styles.primaryButtonDisabled]}
          >
            <Text
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
              style={[styles.primaryButtonText, (!canProceed || isSaving) && styles.primaryButtonTextDisabled]}
            >
              {stepIndex === 2 ? (isSaving ? 'Saving...' : 'Finish') : 'Continue'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={[styles.secondaryButton, isSaving && styles.secondaryButtonHidden]}
            disabled={isSaving}
          >
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} style={styles.secondaryButtonText}>
              {stepIndex === 0 ? 'Back' : 'Previous'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
