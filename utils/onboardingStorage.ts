import * as SecureStore from 'expo-secure-store';

import type { CharacterId } from '../components/game/gameAssets';

const ONBOARDING_STORAGE_KEY = '@battl/onboarding-v1';

type RawOnboardingProfile = {
  username?: unknown;
  characterId?: unknown;
  hasCompletedOnboarding?: unknown;
  completedAt?: unknown;
};

export type OnboardingProfile = {
  username: string;
  characterId: CharacterId;
  hasCompletedOnboarding: true;
  completedAt: string;
};

function isCharacterId(value: unknown): value is CharacterId {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isOnboardingProfile(value: unknown): value is OnboardingProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const rawValue = value as RawOnboardingProfile;

  return (
    typeof rawValue.username === 'string' &&
    rawValue.username.trim().length > 0 &&
    isCharacterId(rawValue.characterId) &&
    rawValue.hasCompletedOnboarding === true &&
    typeof rawValue.completedAt === 'string'
  );
}

export async function getOnboardingProfile(): Promise<OnboardingProfile | null> {
  try {
    const storedValue = await SecureStore.getItemAsync(ONBOARDING_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!isOnboardingProfile(parsedValue)) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

export async function saveOnboardingProfile(input: {
  username: string;
  characterId: CharacterId;
}): Promise<OnboardingProfile> {
  const nextProfile: OnboardingProfile = {
    username: input.username.trim(),
    characterId: input.characterId,
    hasCompletedOnboarding: true,
    completedAt: new Date().toISOString(),
  };

  await SecureStore.setItemAsync(ONBOARDING_STORAGE_KEY, JSON.stringify(nextProfile));

  return nextProfile;
}

export async function clearOnboardingProfile(): Promise<void> {
  await SecureStore.deleteItemAsync(ONBOARDING_STORAGE_KEY);
}
