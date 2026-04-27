import { Pressable, StyleSheet, View } from 'react-native';

import type { Direction } from './gameAssets';

type MovementPadProps = {
  onDirectionPressIn: (direction: Direction) => void;
  onDirectionPressOut: () => void;
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

function PixelArrow({ direction, pressed }: { direction: Direction; pressed: boolean }) {
  const rotation = direction === 'top' ? '0deg' : direction === 'right' ? '90deg' : direction === 'bottom' ? '180deg' : '-90deg';

  const baseColor = pressed ? '#94FF9B' : '#59F56D';
  const bgColor = pressed ? '#0A2810' : '#030E07';

  return (
    <View style={[{ transform: [{ rotate: rotation }] }, styles.arrowContainer]}>
      {/* Sliced triangle */}
      <View style={[styles.arrowTriangle, { borderBottomColor: baseColor }]} />
      {/* Slices to create the layered chevrons */}
      <View style={[styles.arrowSlice, { top: 9, backgroundColor: bgColor }]} />
      <View style={[styles.arrowSlice, { top: 15, backgroundColor: bgColor }]} />
    </View>
  );
}

export function MovementPad({ onDirectionPressIn, onDirectionPressOut }: MovementPadProps) {
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

        {/* Texture detail: scanlines */}
        <View pointerEvents="none" style={styles.scanlineOne} />
        <View pointerEvents="none" style={styles.scanlineTwo} />
        <View pointerEvents="none" style={styles.scanlineThree} />

        {/* Center Deadzone Circle with symbol */}
        <View pointerEvents="none" style={styles.centerDeadZone}>
          <View style={styles.centerDot} />
        </View>

        {/* Interactive Buttons */}
        {DIRECTION_BUTTONS.map((button) => (
          <Pressable
            key={button.direction}
            accessibilityRole="button"
            accessibilityLabel={button.label}
            onPressIn={() => onDirectionPressIn(button.direction)}
            onPressOut={onDirectionPressOut}
            onTouchEnd={onDirectionPressOut}
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
  scanlineOne: {
    position: 'absolute',
    left: 12, right: 12, top: 40, height: 1,
    backgroundColor: 'rgba(118, 255, 128, 0.08)',
  },
  scanlineTwo: {
    position: 'absolute',
    left: 12, right: 12, top: 80, height: 1,
    backgroundColor: 'rgba(118, 255, 128, 0.1)',
  },
  scanlineThree: {
    position: 'absolute',
    left: 12, right: 12, top: 120, height: 1,
    backgroundColor: 'rgba(118, 255, 128, 0.08)',
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
  arrowContainer: {
    width: 28, height: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowTriangle: {
    width: 0, height: 0,
    borderLeftWidth: 14, borderRightWidth: 14,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  arrowSlice: {
    position: 'absolute',
    left: 0, right: 0,
    height: 2,
  },
});
