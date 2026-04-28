import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Direction } from './gameAssets';

type MovementPadProps = {
  onDirectionPressIn: (direction: Direction) => void;
  onDirectionPressOut: () => void;
  onCenterPress: () => void;
};

type DirectionButton = {
  direction: Direction;
  label: string;
};

const DIRECTION_BUTTONS: DirectionButton[] = [
  { direction: 'top', label: 'Move up' },
  { direction: 'left', label: 'Move left' },
  { direction: 'right', label: 'Move right' },
  { direction: 'bottom', label: 'Move down' },
];

const ARROW_ICON = require('../../assets/game/icons/arrow.webp');

function PixelArrow({ direction, pressed }: { direction: Direction; pressed: boolean }) {
  const rotation = direction === 'right' ? '0deg' : direction === 'bottom' ? '90deg' : direction === 'left' ? '180deg' : '-90deg';

  return (
    <Image
      source={ARROW_ICON}
      contentFit="contain"
      style={[
        styles.arrowImage,
        { transform: [{ rotate: rotation }] },
        pressed ? styles.arrowImagePressed : null,
      ]}
    />
  );
}

export function MovementPad({ onDirectionPressIn, onDirectionPressOut, onCenterPress }: MovementPadProps) {
  return (
    <View style={styles.padFrame}>
      {/* Background blurs tailored nicely to the core shapes - mimicking a glass cutout */}
      <View style={[styles.blurBaseVertical, { backdropFilter: 'blur(12px)' as any }]} />
      <View style={[styles.blurBaseHorizontal, { backdropFilter: 'blur(12px)' as any }]} />
      
      <View style={styles.padBase}>
        {/* Core Base to plug the gaps */}
        <View style={styles.armCenter} />
        
        {/* Outer 4 Arms */}
        <View style={[styles.armBase, styles.armTop]} />
        <View style={[styles.armBase, styles.armBottom]} />
        <View style={[styles.armBase, styles.armLeft]} />
        <View style={[styles.armBase, styles.armRight]} />

        {/* 4 Inner Corner pixels to complete the boundary line */}
        <View style={[styles.innerCorner, { left: 52, top: 52 }]} />
        <View style={[styles.innerCorner, { left: 106, top: 52 }]} />
        <View style={[styles.innerCorner, { left: 52, top: 106 }]} />
        <View style={[styles.innerCorner, { left: 106, top: 106 }]} />

        {/* Center Deadzone Circle with symbol */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset view"
          onPress={onCenterPress}
          style={({ pressed }) => [styles.centerDeadZone, pressed ? styles.centerDeadZonePressed : null]}
        >
          <View style={styles.centerDot} />
        </Pressable>

        {/* Interactive Buttons */}
        {DIRECTION_BUTTONS.map((button) => (
          <Pressable
            key={button.direction}
            accessibilityRole="button"
            accessibilityLabel={button.label}
            onPressIn={() => onDirectionPressIn(button.direction)}
            onPressOut={onDirectionPressOut}
            style={({ pressed }) => [
              styles.pressableArea,
              button.direction === 'top' && { top: 2, left: 54, width: 52, height: 50, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
              button.direction === 'bottom' && { bottom: 2, left: 54, width: 52, height: 50, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
              button.direction === 'left' && { left: 2, top: 54, width: 50, height: 52, borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
              button.direction === 'right' && { right: 2, top: 54, width: 50, height: 52, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
              pressed ? styles.pressableAreaActive : null,
            ]}
          >
            {({ pressed }) => <PixelArrow direction={button.direction} pressed={pressed} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const ARM_W = 56;
const ARM_L = 52;
const TOTAL_SIZE = 160;

const styles = StyleSheet.create({
  padFrame: {
    width: TOTAL_SIZE,
    height: TOTAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padBase: {
    width: TOTAL_SIZE,
    height: TOTAL_SIZE,
    position: 'relative',
  },
  blurBaseVertical: {
    position: 'absolute',
    left: ARM_L, top: 0,
    width: ARM_W, height: TOTAL_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
  },
  blurBaseHorizontal: {
    position: 'absolute',
    left: 0, top: ARM_L,
    width: TOTAL_SIZE, height: ARM_W,
    borderRadius: 4,
    overflow: 'hidden',
  },
  armCenter: {
    position: 'absolute',
    left: ARM_L,
    top: ARM_L,
    width: ARM_W,
    height: ARM_W,
    backgroundColor: 'rgba(3, 14, 7, 0.65)',
  },
  armBase: {
    position: 'absolute',
    backgroundColor: 'rgba(3, 14, 7, 0.65)',
    borderColor: '#59F56D',
  },
  armTop: {
    left: ARM_L,
    top: 0,
    width: ARM_W,
    height: ARM_L,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  armBottom: {
    left: ARM_L,
    bottom: 0,
    width: ARM_W,
    height: ARM_L,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  armLeft: {
    left: 0,
    top: ARM_L,
    width: ARM_L,
    height: ARM_W,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  armRight: {
    right: 0,
    top: ARM_L,
    width: ARM_L,
    height: ARM_W,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  innerCorner: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#59F56D',
  },
  centerDeadZone: {
    position: 'absolute',
    left: 62, top: 62, width: 36, height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(86, 255, 118, 0.35)',
    backgroundColor: 'rgba(1, 10, 5, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerDeadZonePressed: {
    backgroundColor: 'rgba(6, 20, 10, 0.96)',
  },
  centerDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(73, 255, 105, 0.3)',
  },
  pressableArea: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  pressableAreaActive: {
    backgroundColor: 'rgba(10, 40, 16, 0.8)',
  },
  arrowImage: {
    width: 28,
    height: 22,
    opacity: 0.92,
  },
  arrowImagePressed: {
    opacity: 1,
  },
});
