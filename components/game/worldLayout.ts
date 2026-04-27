import { OBJECT_SPRITES } from './gameAssets';

export type Point = {
  x: number;
  y: number;
};

export type CollisionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorldObject = {
  id: number;
  source: number;
  x: number;
  y: number;
  width: number;
  height: number;
  collisionRect: CollisionRect;
};

const ANCHOR_COLUMNS = 14;
const ANCHOR_ROWS = 12;
const TOTAL_OBJECTS = ANCHOR_COLUMNS * ANCHOR_ROWS;

const ROW_X_OFFSET = [0.0, 0.018, -0.016, 0.014, -0.008] as const;
const COLUMN_Y_OFFSET = [-0.012, 0.0, 0.01] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function intersects(a: CollisionRect, b: CollisionRect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function createAnchors() {
  return Array.from({ length: TOTAL_OBJECTS }, (_, index) => {
    const row = Math.floor(index / ANCHOR_COLUMNS);
    const col = index % ANCHOR_COLUMNS;

    const baseX = (col + 0.52) / ANCHOR_COLUMNS;
    const baseY = (row + 0.56) / ANCHOR_ROWS;

    const xWobble = ROW_X_OFFSET[row % ROW_X_OFFSET.length] + (col % 2 === 0 ? 0.008 : -0.01);
    const yWobble = COLUMN_Y_OFFSET[col % COLUMN_Y_OFFSET.length];

    return {
      x: clamp(baseX + xWobble, 0.06, 0.94),
      y: clamp(baseY + yWobble, 0.08, 0.94),
    };
  });
}

const FIXED_OBJECT_ANCHORS = createAnchors();

export function createWorldObjects(mapWidth: number, mapHeight: number, baseObjectHeight: number): WorldObject[] {
  const renderScale = baseObjectHeight / 100;

  const items = Array.from({ length: TOTAL_OBJECTS }, (_, index) => {
    const sprite = OBJECT_SPRITES[index % OBJECT_SPRITES.length];
    const anchor = FIXED_OBJECT_ANCHORS[index];

    const height = sprite.height * renderScale;
    const width = sprite.width * renderScale;

    const rawX = anchor.x * mapWidth - width / 2;
    const rawY = anchor.y * mapHeight - height * 0.82;

    const x = clamp(rawX, 0, mapWidth - width);
    const y = clamp(rawY, 0, mapHeight - height);

    const collisionWidth = width * 0.84;
    const collisionHeight = height * 0.46;

    const collisionRect: CollisionRect = {
      x: x + (width - collisionWidth) / 2,
      y: y + height - collisionHeight,
      width: collisionWidth,
      height: collisionHeight,
    };

    return {
      id: index,
      source: sprite.source,
      x,
      y,
      width,
      height,
      collisionRect,
    };
  });

  return items.sort((a, b) => a.y + a.height - (b.y + b.height));
}

export function getPlayerCollisionRect(position: Point, playerSize: number): CollisionRect {
  const width = playerSize * 0.48;
  const height = playerSize * 0.3;
  return {
    x: position.x + (playerSize - width) / 2,
    y: position.y + playerSize - height,
    width,
    height,
  };
}

export function canPlacePlayer(
  position: Point,
  playerSize: number,
  mapWidth: number,
  mapHeight: number,
  objects: WorldObject[]
) {
  if (position.x < 0 || position.y < 0 || position.x + playerSize > mapWidth || position.y + playerSize > mapHeight) {
    return false;
  }

  const playerRect = getPlayerCollisionRect(position, playerSize);
  return !objects.some((objectItem) => intersects(playerRect, objectItem.collisionRect));
}

export function getRandomSpawn(
  mapWidth: number,
  mapHeight: number,
  playerSize: number,
  objects: WorldObject[]
): Point {
  const safeMargin = playerSize * 1.15;

  for (let i = 0; i < 240; i += 1) {
    const candidate: Point = {
      x: safeMargin + Math.random() * (mapWidth - safeMargin * 2 - playerSize),
      y: safeMargin + Math.random() * (mapHeight - safeMargin * 2 - playerSize),
    };

    if (canPlacePlayer(candidate, playerSize, mapWidth, mapHeight, objects)) {
      return candidate;
    }
  }

  return {
    x: mapWidth / 2 - playerSize / 2,
    y: mapHeight / 2 - playerSize / 2,
  };
}
