import { Jersey10_400Regular, useFonts } from '@expo-google-fonts/jersey-10';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import {
  Animated,
  BackHandler,
  PanResponder,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHARACTER_SPRITES, getRandomCharacterId, type Direction } from '../components/game/gameAssets';
import { MovementPad } from '../components/game/MovementPad';
import { PixelNavbar } from '../components/game/PixelNavbar';
import { canPlacePlayer, createWorldObjects, getRandomSpawn, type Point } from '../components/game/worldLayout';
import { styles as gameStyles } from '../styles/gameStyles';

const styles = gameStyles as Record<string, object>;

const MAP_TILE_COLUMNS = 4;
const MAP_TILE_ROWS = 4;
const HOLD_MOVE_INTERVAL_MS = 145;
const WALK_FRAME_DURATION_MS = 115;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDirectionDelta(direction: Direction, step: number): Point {
  switch (direction) {
    case 'top':
      return { x: 0, y: -step };
    case 'bottom':
      return { x: 0, y: step };
    case 'left':
      return { x: -step, y: 0 };
    case 'right':
      return { x: step, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export default function GameScreen() {
  const [fontsLoaded] = useFonts({
    Jersey10_400Regular,
  });

  const [characterId] = useState(() => getRandomCharacterId());
  const [selectedTab, setSelectedTab] = useState(0);
  const [playerDirection, setPlayerDirection] = useState<Direction>('bottom');
  const [playerFrame, setPlayerFrame] = useState<'idle' | 'walk'>('idle');
  const [playerPosition, setPlayerPosition] = useState<Point | null>(null);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [surfaceSize, setSurfaceSize] = useState({ width, height });

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panOffset = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkFrameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerPositionRef = useRef<Point | null>(null);

  const viewportWidth = surfaceSize.width || width;
  const viewportHeight = surfaceSize.height || height;

  const tileWidth = useMemo(() => Math.max(viewportWidth * 1.05, 520), [viewportWidth]);
  const tileHeight = useMemo(() => tileWidth * 2.08, [tileWidth]);

  const mapWidth = useMemo(() => tileWidth * MAP_TILE_COLUMNS, [tileWidth]);
  const mapHeight = useMemo(() => tileHeight * MAP_TILE_ROWS, [tileHeight]);

  const mapLeft = useMemo(() => (viewportWidth - mapWidth) / 2, [viewportWidth, mapWidth]);
  const mapTop = useMemo(() => (viewportHeight - mapHeight) / 2, [viewportHeight, mapHeight]);

  const playerSize = useMemo(() => clamp(Math.round(viewportWidth * 0.14), 52, 74), [viewportWidth]);
  const movementStep = useMemo(() => Math.max(14, Math.round(playerSize * 0.42)), [playerSize]);
  const baseObjectHeight = useMemo(() => Math.round(playerSize * 1.18), [playerSize]);

  const worldObjects = useMemo(() => createWorldObjects(mapWidth, mapHeight, baseObjectHeight), [mapWidth, mapHeight, baseObjectHeight]);

  const bounds = useMemo(
    () => ({
      minX: viewportWidth - mapWidth - mapLeft,
      maxX: -mapLeft,
      minY: viewportHeight - mapHeight - mapTop,
      maxY: -mapTop,
    }),
    [mapHeight, mapLeft, mapTop, mapWidth, viewportHeight, viewportWidth]
  );

  const [objectsBehindPlayer, objectsInFrontOfPlayer] = useMemo(() => {
    if (!playerPosition) {
      return [worldObjects, []] as const;
    }

    const playerFeet = playerPosition.y + playerSize;
    const behind = worldObjects.filter((objectItem) => objectItem.y + objectItem.height <= playerFeet);
    const inFront = worldObjects.filter((objectItem) => objectItem.y + objectItem.height > playerFeet);

    return [behind, inFront] as const;
  }, [playerPosition, playerSize, worldObjects]);

  const activePlayerSprite = CHARACTER_SPRITES[characterId][playerDirection][playerFrame];

  const handleSurfaceLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    if (nextWidth > 0 && nextHeight > 0) {
      setSurfaceSize({ width: nextWidth, height: nextHeight });
    }
  }, []);

  const centerMapOnPlayer = useCallback(
    (position: Point, animated: boolean) => {
      const targetX = viewportWidth / 2 - mapLeft - (position.x + playerSize / 2);
      const targetY = viewportHeight / 2 - mapTop - (position.y + playerSize / 2);

      const clampedX = clamp(targetX, bounds.minX, bounds.maxX);
      const clampedY = clamp(targetY, bounds.minY, bounds.maxY);

      panOffset.current = { x: clampedX, y: clampedY };

      if (animated) {
        Animated.spring(pan, {
          toValue: panOffset.current,
          bounciness: 0,
          speed: 18,
          useNativeDriver: false,
        }).start();
        return;
      }

      pan.setValue(panOffset.current);
    },
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, mapLeft, mapTop, pan, playerSize, viewportHeight, viewportWidth]
  );

  const stopDirectionalMove = useCallback(() => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }

    setPlayerFrame('idle');
  }, []);

  const triggerWalkFrame = useCallback(() => {
    setPlayerFrame('walk');

    if (walkFrameTimeoutRef.current) {
      clearTimeout(walkFrameTimeoutRef.current);
      walkFrameTimeoutRef.current = null;
    }

    walkFrameTimeoutRef.current = setTimeout(() => {
      setPlayerFrame('idle');
    }, WALK_FRAME_DURATION_MS);
  }, []);

  const movePlayerStep = useCallback(
    (direction: Direction) => {
      setPlayerDirection(direction);

      const currentPosition = playerPositionRef.current;
      if (!currentPosition) {
        return;
      }

      const delta = getDirectionDelta(direction, movementStep);
      const nextPosition: Point = {
        x: clamp(currentPosition.x + delta.x, 0, mapWidth - playerSize),
        y: clamp(currentPosition.y + delta.y, 0, mapHeight - playerSize),
      };

      if (!canPlacePlayer(nextPosition, playerSize, mapWidth, mapHeight, worldObjects)) {
        setPlayerFrame('idle');
        return;
      }

      playerPositionRef.current = nextPosition;
      setPlayerPosition(nextPosition);
      triggerWalkFrame();
      centerMapOnPlayer(nextPosition, true);
    },
    [centerMapOnPlayer, mapHeight, mapWidth, movementStep, playerSize, triggerWalkFrame, worldObjects]
  );

  const startDirectionalMove = useCallback(
    (direction: Direction) => {
      stopDirectionalMove();
      movePlayerStep(direction);

      moveIntervalRef.current = setInterval(() => {
        movePlayerStep(direction);
      }, HOLD_MOVE_INTERVAL_MS);
    },
    [movePlayerStep, stopDirectionalMove]
  );

  usePreventRemove(true, () => {});

  useFocusEffect(
    useCallback(() => {
      const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => backSubscription.remove();
    }, [])
  );

  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }

      if (walkFrameTimeoutRef.current) {
        clearTimeout(walkFrameTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const clampedX = clamp(panOffset.current.x, bounds.minX, bounds.maxX);
    const clampedY = clamp(panOffset.current.y, bounds.minY, bounds.maxY);
    panOffset.current = { x: clampedX, y: clampedY };
    pan.setValue(panOffset.current);
  }, [bounds, pan]);

  useEffect(() => {
    const currentPosition = playerPositionRef.current;

    if (!currentPosition) {
      const spawnPoint = getRandomSpawn(mapWidth, mapHeight, playerSize, worldObjects);
      playerPositionRef.current = spawnPoint;
      setPlayerPosition(spawnPoint);
      centerMapOnPlayer(spawnPoint, false);
      return;
    }

    const clampedPosition: Point = {
      x: clamp(currentPosition.x, 0, mapWidth - playerSize),
      y: clamp(currentPosition.y, 0, mapHeight - playerSize),
    };

    playerPositionRef.current = clampedPosition;
    setPlayerPosition(clampedPosition);
    centerMapOnPlayer(clampedPosition, false);
  }, [centerMapOnPlayer, mapHeight, mapWidth, playerSize, worldObjects]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (_, gesture) => gesture.numberActiveTouches === 1,
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.numberActiveTouches === 1 && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          stopDirectionalMove();
          dragStart.current = panOffset.current;
        },
        onPanResponderMove: (_, gesture) => {
          if (gesture.numberActiveTouches !== 1) {
            return;
          }

          const nextX = clamp(dragStart.current.x + gesture.dx, bounds.minX, bounds.maxX);
          const nextY = clamp(dragStart.current.y + gesture.dy, bounds.minY, bounds.maxY);

          pan.setValue({
            x: nextX,
            y: nextY,
          });
        },
        onPanResponderRelease: (_, gesture) => {
          panOffset.current = {
            x: clamp(dragStart.current.x + gesture.dx, bounds.minX, bounds.maxX),
            y: clamp(dragStart.current.y + gesture.dy, bounds.minY, bounds.maxY),
          };
          pan.setValue(panOffset.current);
        },
        onPanResponderTerminate: (_, gesture) => {
          panOffset.current = {
            x: clamp(dragStart.current.x + gesture.dx, bounds.minX, bounds.maxX),
            y: clamp(dragStart.current.y + gesture.dy, bounds.minY, bounds.maxY),
          };
          pan.setValue(panOffset.current);
        },
      }),
    [bounds, pan, stopDirectionalMove]
  );

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <View style={styles.stage}>
        <View pointerEvents="none" style={styles.ambientGlow} />

        <View style={styles.dragSurface} onLayout={handleSurfaceLayout} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.mapFrame,
              {
                width: mapWidth,
                height: mapHeight,
                left: mapLeft,
                top: mapTop,
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
              },
            ]}
          >

            {Array.from({ length: MAP_TILE_ROWS }).map((_, row) =>
              Array.from({ length: MAP_TILE_COLUMNS }).map((__, col) => (
                <Image
                  key={`tile-${row}-${col}`}
                  source={require('../assets/game/map/img.webp')}
                  style={[
                    styles.mapTile,
                    {
                      left: col * tileWidth,
                      top: row * tileHeight,
                      width: tileWidth,
                      height: tileHeight,
                    },
                  ]}
                  contentFit="cover"
                />
              ))
            )}

            {objectsBehindPlayer.map((objectItem) => (
              <Image
                key={`object-back-${objectItem.id}`}
                source={objectItem.source}
                style={[
                  styles.worldObject,
                  {
                    left: objectItem.x,
                    top: objectItem.y,
                    width: objectItem.width,
                    height: objectItem.height,
                  },
                ]}
                contentFit="contain"
              />
            ))}

            {playerPosition ? (
              <View
                style={[
                  styles.playerWrap,
                  {
                    left: playerPosition.x,
                    top: playerPosition.y,
                    width: playerSize,
                    height: playerSize,
                  },
                ]}
              >
                <View
                  style={[
                    styles.playerShadow,
                    {
                      width: playerSize * 0.5,
                      height: playerSize * 0.17,
                    },
                  ]}
                />
                <Image
                  source={activePlayerSprite}
                  style={[
                    styles.playerSprite,
                    {
                      width: playerSize,
                      height: playerSize,
                    },
                  ]}
                  contentFit="contain"
                />
              </View>
            ) : null}

            {objectsInFrontOfPlayer.map((objectItem) => (
              <Image
                key={`object-front-${objectItem.id}`}
                source={objectItem.source}
                style={[
                  styles.worldObject,
                  {
                    left: objectItem.x,
                    top: objectItem.y,
                    width: objectItem.width,
                    height: objectItem.height,
                  },
                ]}
                contentFit="contain"
              />
            ))}
          </Animated.View>
        </View>

        <View style={styles.ambientVignette} pointerEvents="none" />

        {playerPosition ? (
          <View style={styles.hudChip}>
            <Text style={[styles.hudText, { fontFamily: 'Jersey10_400Regular' }]}>
              CHR-{characterId} X:{Math.round(playerPosition.x)} Y:{Math.round(playerPosition.y)}
            </Text>
          </View>
        ) : null}

        <View style={[styles.controlsDock, { bottom: 96 + insets.bottom }]}>
          <MovementPad onDirectionPressIn={startDirectionalMove} onDirectionPressOut={stopDirectionalMove} />
        </View>

        <View style={[styles.bottomDock, { bottom: 12 + insets.bottom }]}>
          <PixelNavbar selectedIndex={selectedTab} onSelect={setSelectedTab} />
        </View>
      </View>
    </SafeAreaView>
  );
}
