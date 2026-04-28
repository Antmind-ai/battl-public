import * as Battery from 'expo-battery';
import Constants from 'expo-constants';

const DEFAULT_MINIMUM_QUALIFIED_BATTERY_PERCENTAGE = 75;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parsePercentage(rawValue: unknown) {
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return clamp(Math.round(rawValue), 0, 100);
  }

  if (typeof rawValue === 'string') {
    const parsedValue = Number.parseInt(rawValue, 10);

    if (Number.isFinite(parsedValue)) {
      return clamp(parsedValue, 0, 100);
    }
  }

  return DEFAULT_MINIMUM_QUALIFIED_BATTERY_PERCENTAGE;
}

export const MINIMUM_QUALIFIED_BATTERY_PERCENTAGE = parsePercentage(
  Constants.expoConfig?.extra?.minimumQualifiedBatteryPercentage
);

const MINIMUM_QUALIFIED_BATTERY_FRACTION = MINIMUM_QUALIFIED_BATTERY_PERCENTAGE / 100;

export function isDeviceCharging(batteryState: Battery.BatteryState | null | undefined) {
  return batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL;
}

export function isPlayerQualifiedByBattery(
  batteryLevel: number,
  batteryState: Battery.BatteryState | null | undefined
) {
  if (!Number.isFinite(batteryLevel) || batteryLevel < 0) {
    return false;
  }

  const normalizedLevel = clamp(batteryLevel, 0, 1);
  return normalizedLevel < MINIMUM_QUALIFIED_BATTERY_FRACTION && !isDeviceCharging(batteryState);
}
