import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

type PixelNavbarProps = {
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const NAV_ITEMS = [
  { key: 'crew', icon: 'account-group-outline' },
  { key: 'skull', icon: 'skull-outline' },
  { key: 'battle', icon: 'sword-cross' },
  { key: 'menu', icon: 'menu' },
] as const;

export function PixelNavbar({ selectedIndex, onSelect }: PixelNavbarProps) {
  const handleSelect = (index: number) => {
    void Haptics.selectionAsync().catch(() => {});
    onSelect(index);
  };

  const navItems = NAV_ITEMS.map((item, index) => {
    const selected = selectedIndex === index;
    const showDivider = index !== NAV_ITEMS.length - 1;

    return (
      <View key={item.key} style={styles.segmentWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Game nav ${item.key}`}
          onPress={() => handleSelect(index)}
          style={styles.navItem}
          android_ripple={null}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={26}
            color={selected ? '#84ff4d' : '#2f7d3d'}
            style={[styles.iconBase, selected ? styles.iconSelected : styles.iconUnselected]}
          />
        </Pressable>

        {showDivider ? <View style={styles.segmentDivider} /> : null}
      </View>
    );
  });

  return (
    <View style={styles.pillShell}>
      <BlurView
        tint="dark"
        intensity={Platform.OS === 'ios' ? 62 : 90}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={styles.blurShell}
      >
        <View style={styles.blurOverlay} />
        <View style={styles.pillInner}>{navItems}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  pillShell: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 28,
  },
  blurShell: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 28,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 26, 12, 0.12)',
  },
  pillInner: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(82, 176, 101, 0.38)',
    borderRadius: 28,
    backgroundColor: 'rgba(1, 14, 7, 0.08)',
  },
  segmentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  navItem: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(3, 20, 9, 0.08)',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#173f23',
    shadowOpacity: 0.32,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  segmentDivider: {
    width: 1,
    marginVertical: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(39, 130, 58, 0.55)',
  },
  iconBase: {
    textShadowOffset: { width: 0, height: 0 },
  },
  iconSelected: {
    textShadowColor: 'rgba(132, 255, 77, 0.5)',
    textShadowRadius: 7,
  },
  iconUnselected: {
    textShadowColor: 'rgba(47, 125, 61, 0.25)',
    textShadowRadius: 2,
  },
});
