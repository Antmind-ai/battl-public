import { Jersey10_400Regular, useFonts } from '@expo-google-fonts/jersey-10';
import { Image } from 'expo-image';
import { BlurTargetView } from 'expo-blur';
import * as Battery from 'expo-battery';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import {
  BackHandler,
  PanResponder,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CHARACTER_SPRITES, getRandomCharacterId, type CharacterId, type Direction } from '../components/game/gameAssets';
import { MovementPad } from '../components/game/MovementPad';
import { PixelNavbar } from '../components/game/PixelNavbar';
import { canPlacePlayer, createWorldObjects, getRandomSpawn, type Point } from '../components/game/worldLayout';
import { styles as gameStyles } from '../styles/gameStyles';
import { isPlayerQualifiedByBattery } from '../utils/batteryQualification';
import { getOnboardingProfile } from '../utils/onboardingStorage';

const styles = gameStyles as Record<string, object>;

const MAP_TILE_COLUMNS = 4;
const MAP_TILE_ROWS = 4;
const MIN_MAP_SCALE = 0.65;
const MAX_MAP_SCALE = 1.35;
const MOVEMENT_SPEED_PX_PER_SEC = 300;
const MAX_MOVEMENT_STEP_PX = 8;
const WALK_FRAME_DURATION_MS = 115;
const BATTERY_POLL_INTERVAL_MS = 1500;

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

function getPinchDistance(touches: readonly { pageX: number; pageY: number }[]) {
  const [touchA, touchB] = touches;
  const deltaX = touchA.pageX - touchB.pageX;
  const deltaY = touchA.pageY - touchB.pageY;
  return Math.hypot(deltaX, deltaY);
}

export default function GameScreen() {
  const [fontsLoaded] = useFonts({
    Jersey10_400Regular,
  });

  const [characterId, setCharacterId] = useState<CharacterId>(() => getRandomCharacterId());
  const [selectedTab, setSelectedTab] = useState(0);
  const [mapScale, setMapScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('bottom');
  const [playerFrame, setPlayerFrame] = useState<'idle' | 'walk'>('idle');
  const [playerPosition, setPlayerPosition] = useState<Point | null>(null);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [surfaceSize, setSurfaceSize] = useState({ width, height });
  const [batteryLevel, setBatteryLevel] = useState(0.0419);
  const [batteryState, setBatteryState] = useState(Battery.BatteryState.UNKNOWN);

  const panOffset = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const movementRafRef = useRef<number | null>(null);
  const walkFrameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeDirectionRef = useRef<Direction | null>(null);
  const lastMovementFrameMsRef = useRef<number | null>(null);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const pinchStartPanRef = useRef({ x: 0, y: 0 });
  const pinchStartMapOffsetRef = useRef({ left: 0, top: 0 });
  const mapScaleRef = useRef(1);
  const isPinchingRef = useRef(false);
  const playerPositionRef = useRef<Point | null>(null);
  const blurTargetRef = useRef<View | null>(null);
  const hasForcedExitRef = useRef(false);

  const viewportWidth = surfaceSize.width || width;
  const viewportHeight = surfaceSize.height || height;

  const tileWidth = useMemo(() => Math.max(viewportWidth * 1.05, 520), [viewportWidth]);
  const tileHeight = useMemo(() => tileWidth * 2.08, [tileWidth]);

  const renderTileWidth = useMemo(() => tileWidth * mapScale, [tileWidth, mapScale]);
  const renderTileHeight = useMemo(() => tileHeight * mapScale, [tileHeight, mapScale]);

  const mapWidth = useMemo(() => tileWidth * MAP_TILE_COLUMNS, [tileWidth]);
  const mapHeight = useMemo(() => tileHeight * MAP_TILE_ROWS, [tileHeight]);

  const renderMapWidth = useMemo(() => mapWidth * mapScale, [mapWidth, mapScale]);
  const renderMapHeight = useMemo(() => mapHeight * mapScale, [mapHeight, mapScale]);

  const mapLeft = useMemo(() => (viewportWidth - renderMapWidth) / 2, [viewportWidth, renderMapWidth]);
  const mapTop = useMemo(() => (viewportHeight - renderMapHeight) / 2, [viewportHeight, renderMapHeight]);

  const playerSize = useMemo(() => clamp(Math.round(viewportWidth * 0.14), 52, 74), [viewportWidth]);
  const baseObjectHeight = useMemo(() => Math.round(playerSize * 1.18), [playerSize]);

  const worldObjects = useMemo(() => createWorldObjects(mapWidth, mapHeight, baseObjectHeight), [mapWidth, mapHeight, baseObjectHeight]);

  const bounds = useMemo(
    () => ({
      minX: viewportWidth - renderMapWidth - mapLeft,
      maxX: -mapLeft,
      minY: viewportHeight - renderMapHeight - mapTop,
      maxY: -mapTop,
    }),
    [mapLeft, mapTop, renderMapHeight, renderMapWidth, viewportHeight, viewportWidth]
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
  const isQualified = useMemo(
    () => isPlayerQualifiedByBattery(batteryLevel, batteryState),
    [batteryLevel, batteryState]
  );

  useEffect(() => {
    let mounted = true;

    const hydrateCharacter = async () => {
      const storedProfile = await getOnboardingProfile();

      if (!mounted || !storedProfile?.characterId) {
        return;
      }

      setCharacterId(storedProfile.characterId);
    };

    void hydrateCharacter();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSurfaceLayout = useCallback((event: LayoutChangeEvent) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    if (nextWidth > 0 && nextHeight > 0) {
      setSurfaceSize({ width: nextWidth, height: nextHeight });
    }
  }, []);

  const centerMapOnPlayer = useCallback(
    (position: Point) => {
      const targetX = viewportWidth / 2 - mapLeft - (position.x + playerSize / 2) * mapScaleRef.current;
      const targetY = viewportHeight / 2 - mapTop - (position.y + playerSize / 2) * mapScaleRef.current;

      const clampedX = clamp(targetX, bounds.minX, bounds.maxX);
      const clampedY = clamp(targetY, bounds.minY, bounds.maxY);

      panOffset.current = { x: clampedX, y: clampedY };
      setPanPosition(panOffset.current);
    },
    [bounds.maxX, bounds.maxY, bounds.minX, bounds.minY, mapLeft, mapTop, playerSize, viewportHeight, viewportWidth]
  );

  const startWalkLoop = useCallback(() => {
    if (walkFrameIntervalRef.current) {
      return;
    }

    setPlayerFrame('walk');

    walkFrameIntervalRef.current = setInterval(() => {
      setPlayerFrame((currentFrame) => (currentFrame === 'walk' ? 'idle' : 'walk'));
    }, WALK_FRAME_DURATION_MS);
  }, []);

  const stopWalkLoop = useCallback(() => {
    if (walkFrameIntervalRef.current) {
      clearInterval(walkFrameIntervalRef.current);
      walkFrameIntervalRef.current = null;
    }

    setPlayerFrame('idle');
  }, []);

  const movePlayerByDistance = useCallback(
    (direction: Direction, distancePx: number) => {
      const currentPosition = playerPositionRef.current;
      if (!currentPosition || distancePx <= 0) {
        return false;
      }

      let remainingDistance = distancePx;
      let nextPosition = currentPosition;
      let didMove = false;

      while (remainingDistance > 0) {
        const step = Math.min(remainingDistance, MAX_MOVEMENT_STEP_PX);
        const delta = getDirectionDelta(direction, step);
        const candidate: Point = {
          x: clamp(nextPosition.x + delta.x, 0, mapWidth - playerSize),
          y: clamp(nextPosition.y + delta.y, 0, mapHeight - playerSize),
        };

        if (candidate.x === nextPosition.x && candidate.y === nextPosition.y) {
          break;
        }

        if (!canPlacePlayer(candidate, playerSize, mapWidth, mapHeight, worldObjects)) {
          break;
        }

        nextPosition = candidate;
        remainingDistance -= step;
        didMove = true;
      }

      if (!didMove) {
        return false;
      }

      playerPositionRef.current = nextPosition;
      setPlayerPosition(nextPosition);
      centerMapOnPlayer(nextPosition);
      return true;
    },
    [centerMapOnPlayer, mapHeight, mapWidth, playerSize, worldObjects]
  );

  const runMovementFrame = useCallback(
    (timestampMs: number) => {
      const direction = activeDirectionRef.current;
      if (!direction) {
        movementRafRef.current = null;
        lastMovementFrameMsRef.current = null;
        return;
      }

      const lastFrameMs = lastMovementFrameMsRef.current ?? timestampMs;
      const elapsedMs = Math.min(timestampMs - lastFrameMs, 32);
      lastMovementFrameMsRef.current = timestampMs;

      const distancePx = (MOVEMENT_SPEED_PX_PER_SEC * elapsedMs) / 1000;
      const moved = movePlayerByDistance(direction, distancePx);

      if (moved) {
        startWalkLoop();
      } else {
        stopWalkLoop();
      }

      movementRafRef.current = requestAnimationFrame(runMovementFrame);
    },
    [movePlayerByDistance, startWalkLoop, stopWalkLoop]
  );

  const stopDirectionalMove = useCallback(() => {
    activeDirectionRef.current = null;
    lastMovementFrameMsRef.current = null;

    if (movementRafRef.current !== null) {
      cancelAnimationFrame(movementRafRef.current);
      movementRafRef.current = null;
    }

    stopWalkLoop();
  }, [stopWalkLoop]);

  const startDirectionalMove = useCallback(
    (direction: Direction) => {
      activeDirectionRef.current = direction;
      setPlayerDirection(direction);

      // Apply a tiny immediate step so controls feel responsive before the next animation frame.
      const movedOnPress = movePlayerByDistance(direction, MOVEMENT_SPEED_PX_PER_SEC / 60);
      if (movedOnPress) {
        startWalkLoop();
      }

      if (movementRafRef.current === null) {
        lastMovementFrameMsRef.current = null;
        movementRafRef.current = requestAnimationFrame(runMovementFrame);
      }
    },
    [movePlayerByDistance, runMovementFrame, startWalkLoop]
  );

  const resetViewToPlayer = useCallback(() => {
    stopDirectionalMove();
    setMapScale(1);

    const currentPosition = playerPositionRef.current;
    if (!currentPosition) {
      return;
    }

    centerMapOnPlayer(currentPosition);
  }, [centerMapOnPlayer, stopDirectionalMove]);

  usePreventRemove(isQualified, () => {});

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
    mapScaleRef.current = mapScale;
  }, [mapScale]);

  useEffect(() => {
    return () => {
      if (movementRafRef.current !== null) {
        cancelAnimationFrame(movementRafRef.current);
      }

      if (walkFrameIntervalRef.current) {
        clearInterval(walkFrameIntervalRef.current);
      }
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
        // Keep current eligibility state when battery APIs are temporarily unavailable.
      }
    };

    hydrateBattery();

    const pollBattery = async () => {
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
        // Keep current eligibility state when polling fails temporarily.
      }
    };

    const batteryPollInterval = setInterval(() => {
      void pollBattery();
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

  useEffect(() => {
    if (isQualified || hasForcedExitRef.current) {
      return;
    }

    hasForcedExitRef.current = true;
    stopDirectionalMove();
    router.replace('/');
  }, [isQualified, stopDirectionalMove]);

  useEffect(() => {
    const clampedX = clamp(panOffset.current.x, bounds.minX, bounds.maxX);
    const clampedY = clamp(panOffset.current.y, bounds.minY, bounds.maxY);
    panOffset.current = { x: clampedX, y: clampedY };
    setPanPosition(panOffset.current);
  }, [bounds]);

  useEffect(() => {
    const currentPosition = playerPositionRef.current;

    if (!currentPosition) {
      const spawnPoint = getRandomSpawn(mapWidth, mapHeight, playerSize, worldObjects);
      playerPositionRef.current = spawnPoint;
      setPlayerPosition(spawnPoint);
      centerMapOnPlayer(spawnPoint);
      return;
    }

    const clampedPosition: Point = {
      x: clamp(currentPosition.x, 0, mapWidth - playerSize),
      y: clamp(currentPosition.y, 0, mapHeight - playerSize),
    };

    playerPositionRef.current = clampedPosition;
    setPlayerPosition(clampedPosition);
    centerMapOnPlayer(clampedPosition);
  }, [centerMapOnPlayer, mapHeight, mapWidth, playerSize, worldObjects]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (_, gesture) => gesture.numberActiveTouches === 2,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.numberActiveTouches === 2 || (gesture.numberActiveTouches === 1 && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4),
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderTerminationRequest: () => true,
        onShouldBlockNativeResponder: () => false,
        onPanResponderGrant: (event) => {
          stopDirectionalMove();

          const touches = event.nativeEvent.touches;
          if (touches.length === 2) {
            isPinchingRef.current = true;
            pinchStartDistanceRef.current = getPinchDistance(touches);
            pinchStartScaleRef.current = mapScaleRef.current;
            pinchStartPanRef.current = panOffset.current;
            pinchStartMapOffsetRef.current = { left: mapLeft, top: mapTop };
            return;
          }

          isPinchingRef.current = false;
          dragStart.current = panOffset.current;
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;

          if (touches.length === 2) {
            const distance = getPinchDistance(touches);
            if (pinchStartDistanceRef.current <= 0) {
              pinchStartDistanceRef.current = distance;
              pinchStartScaleRef.current = mapScaleRef.current;
              pinchStartPanRef.current = panOffset.current;
              pinchStartMapOffsetRef.current = { left: mapLeft, top: mapTop };
            }

            isPinchingRef.current = true;
            const nextScale = clamp((distance / pinchStartDistanceRef.current) * pinchStartScaleRef.current, MIN_MAP_SCALE, MAX_MAP_SCALE);

            const startScale = pinchStartScaleRef.current;
            const startPan = pinchStartPanRef.current;
            const startLeft = pinchStartMapOffsetRef.current.left;
            const startTop = pinchStartMapOffsetRef.current.top;

            const pinchCenterX = (touches[0].pageX + touches[1].pageX) / 2;
            const pinchCenterY = (touches[0].pageY + touches[1].pageY) / 2;
            const worldX = (pinchCenterX - startLeft - startPan.x) / startScale;
            const worldY = (pinchCenterY - startTop - startPan.y) / startScale;

            const nextRenderWidth = mapWidth * nextScale;
            const nextRenderHeight = mapHeight * nextScale;
            const nextLeft = (viewportWidth - nextRenderWidth) / 2;
            const nextTop = (viewportHeight - nextRenderHeight) / 2;
            const nextBounds = {
              minX: viewportWidth - nextRenderWidth - nextLeft,
              maxX: -nextLeft,
              minY: viewportHeight - nextRenderHeight - nextTop,
              maxY: -nextTop,
            };

            const nextPan = {
              x: clamp(pinchCenterX - nextLeft - worldX * nextScale, nextBounds.minX, nextBounds.maxX),
              y: clamp(pinchCenterY - nextTop - worldY * nextScale, nextBounds.minY, nextBounds.maxY),
            };

            setMapScale(nextScale);
            panOffset.current = nextPan;
            setPanPosition(nextPan);
            return;
          }

          if (gesture.numberActiveTouches !== 1) {
            return;
          }

          const nextX = clamp(dragStart.current.x + gesture.dx, bounds.minX, bounds.maxX);
          const nextY = clamp(dragStart.current.y + gesture.dy, bounds.minY, bounds.maxY);

          panOffset.current = { x: nextX, y: nextY };
          setPanPosition(panOffset.current);
        },
        onPanResponderRelease: (_, gesture) => {
          if (!isPinchingRef.current) {
            panOffset.current = {
              x: clamp(dragStart.current.x + gesture.dx, bounds.minX, bounds.maxX),
              y: clamp(dragStart.current.y + gesture.dy, bounds.minY, bounds.maxY),
            };
            setPanPosition(panOffset.current);
          }

          isPinchingRef.current = false;
          pinchStartDistanceRef.current = 0;
        },
        onPanResponderTerminate: (_, gesture) => {
          if (!isPinchingRef.current) {
            panOffset.current = {
              x: clamp(dragStart.current.x + gesture.dx, bounds.minX, bounds.maxX),
              y: clamp(dragStart.current.y + gesture.dy, bounds.minY, bounds.maxY),
            };
            setPanPosition(panOffset.current);
          }

          isPinchingRef.current = false;
          pinchStartDistanceRef.current = 0;
        },
      }),
    [bounds, mapHeight, mapLeft, mapTop, mapWidth, stopDirectionalMove, viewportHeight, viewportWidth]
  );

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <View style={styles.stage}>
        <BlurTargetView ref={blurTargetRef} style={styles.stageBlurTarget}>
          <View pointerEvents="none" style={styles.ambientGlow} />

          <View style={styles.dragSurface} onLayout={handleSurfaceLayout} {...panResponder.panHandlers}>
            <View
              style={[
                styles.mapFrame,
                {
                  width: renderMapWidth,
                  height: renderMapHeight,
                  left: mapLeft,
                  top: mapTop,
                  transform: [{ translateX: panPosition.x }, { translateY: panPosition.y }],
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
                        left: col * renderTileWidth,
                        top: row * renderTileHeight,
                        width: renderTileWidth,
                        height: renderTileHeight,
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
                      left: objectItem.x * mapScale,
                      top: objectItem.y * mapScale,
                      width: objectItem.width * mapScale,
                      height: objectItem.height * mapScale,
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
                      left: playerPosition.x * mapScale,
                      top: playerPosition.y * mapScale,
                      width: playerSize * mapScale,
                      height: playerSize * mapScale,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.playerShadow,
                      {
                        width: playerSize * 0.5 * mapScale,
                        height: playerSize * 0.17 * mapScale,
                      },
                    ]}
                  />
                  <Image
                    source={activePlayerSprite}
                    style={[
                      styles.playerSprite,
                      {
                        width: playerSize * mapScale,
                        height: playerSize * mapScale,
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
                      left: objectItem.x * mapScale,
                      top: objectItem.y * mapScale,
                      width: objectItem.width * mapScale,
                      height: objectItem.height * mapScale,
                    },
                  ]}
                  contentFit="contain"
                />
              ))}
            </View>
          </View>

          <View style={styles.ambientVignette} pointerEvents="none" />
        </BlurTargetView>

        <View style={[styles.controlsDock, { bottom: 96 + insets.bottom }]}>
          <MovementPad
            onDirectionPressIn={startDirectionalMove}
            onDirectionPressOut={stopDirectionalMove}
            onCenterPress={resetViewToPlayer}
          />
        </View>

        <View style={[styles.bottomDock, { bottom: 12 + insets.bottom }]}>
          <PixelNavbar selectedIndex={selectedTab} onSelect={setSelectedTab} blurTarget={blurTargetRef} />
        </View>
      </View>
    </SafeAreaView>
  );
}
