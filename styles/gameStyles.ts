import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#010906',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#010906',
  },
  stage: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#010906',
    overflow: 'hidden',
  },
  stageBlurTarget: {
    flex: 1,
  },
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 30, 12, 0.2)',
  },
  ambientVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  dragSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFrame: {
    position: 'absolute',
    overflow: 'hidden',
  },
  mapTile: {
    position: 'absolute',
    opacity: 0.96,
  },
  worldObject: {
    position: 'absolute',
  },
  playerWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  playerShadow: {
    position: 'absolute',
    bottom: 1,
    borderRadius: 100,
    backgroundColor: 'rgba(1, 8, 3, 0.56)',
  },
  playerSprite: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  hudChip: {
    position: 'absolute',
    left: 12,
    top: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(114, 223, 110, 0.42)',
    backgroundColor: 'rgba(4, 22, 9, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 8,
  },
  hudText: {
    color: '#8CFF78',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  controlsDock: {
    position: 'absolute',
    left: 14,
    zIndex: 9,
  },
  bottomDock: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 6,
  },
});
