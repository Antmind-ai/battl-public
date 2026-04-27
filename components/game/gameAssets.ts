export type Direction = 'top' | 'bottom' | 'left' | 'right';
export type CharacterFrame = 'idle' | 'walk';
export type CharacterId = 1 | 2 | 3 | 4;

export type CharacterSpriteSheet = Record<Direction, Record<CharacterFrame, number>>;

export type ObjectSprite = {
  id: number;
  width: number;
  height: number;
  source: number;
};

export const CHARACTER_SPRITES: Record<CharacterId, CharacterSpriteSheet> = {
  1: {
    top: {
      idle: require('../../assets/game/characters/1-top-idle.webp'),
      walk: require('../../assets/game/characters/1-top-walk.webp'),
    },
    bottom: {
      idle: require('../../assets/game/characters/1-bottom-idle.webp'),
      walk: require('../../assets/game/characters/1-bottom-walk.webp'),
    },
    left: {
      idle: require('../../assets/game/characters/1-left-idle.webp'),
      walk: require('../../assets/game/characters/1-left-walk.webp'),
    },
    right: {
      idle: require('../../assets/game/characters/1-right-idle.webp'),
      walk: require('../../assets/game/characters/1-right-walk.webp'),
    },
  },
  2: {
    top: {
      idle: require('../../assets/game/characters/2-top-idle.webp'),
      walk: require('../../assets/game/characters/2-top-walk.webp'),
    },
    bottom: {
      idle: require('../../assets/game/characters/2-bottom-idle.webp'),
      walk: require('../../assets/game/characters/2-bottom-walk.webp'),
    },
    left: {
      idle: require('../../assets/game/characters/2-left-idle.webp'),
      walk: require('../../assets/game/characters/2-left-walk.webp'),
    },
    right: {
      idle: require('../../assets/game/characters/2-right-idle.webp'),
      walk: require('../../assets/game/characters/2-right-walk.webp'),
    },
  },
  3: {
    top: {
      idle: require('../../assets/game/characters/3-top-idle.webp'),
      walk: require('../../assets/game/characters/3-top-walk.webp'),
    },
    bottom: {
      idle: require('../../assets/game/characters/3-bottom-idle.webp'),
      walk: require('../../assets/game/characters/3-bottom-walk.webp'),
    },
    left: {
      idle: require('../../assets/game/characters/3-left-idle.webp'),
      walk: require('../../assets/game/characters/3-left-walk.webp'),
    },
    right: {
      idle: require('../../assets/game/characters/3-right-idle.webp'),
      walk: require('../../assets/game/characters/3-right-walk.webp'),
    },
  },
  4: {
    top: {
      idle: require('../../assets/game/characters/4-top-idle.webp'),
      walk: require('../../assets/game/characters/4-top-walk.webp'),
    },
    bottom: {
      idle: require('../../assets/game/characters/4-bottom-idle.webp'),
      walk: require('../../assets/game/characters/4-bottom-walk.webp'),
    },
    left: {
      idle: require('../../assets/game/characters/4-left-idle.webp'),
      walk: require('../../assets/game/characters/4-left-walk.webp'),
    },
    right: {
      idle: require('../../assets/game/characters/4-right-idle.webp'),
      walk: require('../../assets/game/characters/4-right-walk.webp'),
    },
  },
};

export const OBJECT_SPRITES: ObjectSprite[] = [
  { id: 1, width: 96, height: 100, source: require('../../assets/game/objects/1.webp') },
  { id: 2, width: 91, height: 100, source: require('../../assets/game/objects/2.webp') },
  { id: 3, width: 93, height: 100, source: require('../../assets/game/objects/3.webp') },
  { id: 4, width: 119, height: 100, source: require('../../assets/game/objects/4.webp') },
  { id: 5, width: 105, height: 100, source: require('../../assets/game/objects/5.webp') },
  { id: 6, width: 156, height: 100, source: require('../../assets/game/objects/6.webp') },
  { id: 7, width: 180, height: 100, source: require('../../assets/game/objects/7.webp') },
  { id: 8, width: 82, height: 100, source: require('../../assets/game/objects/8.webp') },
  { id: 9, width: 235, height: 100, source: require('../../assets/game/objects/9.webp') },
  { id: 10, width: 128, height: 100, source: require('../../assets/game/objects/10.webp') },
  { id: 11, width: 144, height: 100, source: require('../../assets/game/objects/11.webp') },
  { id: 12, width: 191, height: 100, source: require('../../assets/game/objects/12.webp') },
  { id: 13, width: 86, height: 100, source: require('../../assets/game/objects/13.webp') },
  { id: 14, width: 159, height: 100, source: require('../../assets/game/objects/14.webp') },
  { id: 15, width: 74, height: 100, source: require('../../assets/game/objects/15.webp') },
  { id: 16, width: 189, height: 100, source: require('../../assets/game/objects/16.webp') },
  { id: 17, width: 87, height: 100, source: require('../../assets/game/objects/17.webp') },
  { id: 18, width: 92, height: 100, source: require('../../assets/game/objects/18.webp') },
  { id: 19, width: 111, height: 100, source: require('../../assets/game/objects/19.webp') },
  { id: 20, width: 80, height: 100, source: require('../../assets/game/objects/20.webp') },
  { id: 21, width: 87, height: 100, source: require('../../assets/game/objects/21.webp') },
  { id: 22, width: 121, height: 100, source: require('../../assets/game/objects/22.webp') },
  { id: 23, width: 109, height: 100, source: require('../../assets/game/objects/23.webp') },
  { id: 24, width: 67, height: 100, source: require('../../assets/game/objects/24.webp') },
  { id: 25, width: 166, height: 100, source: require('../../assets/game/objects/25.webp') },
  { id: 26, width: 193, height: 100, source: require('../../assets/game/objects/26.webp') },
  { id: 27, width: 108, height: 100, source: require('../../assets/game/objects/27.webp') },
  { id: 28, width: 143, height: 100, source: require('../../assets/game/objects/28.webp') },
  { id: 29, width: 121, height: 100, source: require('../../assets/game/objects/29.webp') },
  { id: 30, width: 107, height: 100, source: require('../../assets/game/objects/30.webp') },
  { id: 31, width: 189, height: 100, source: require('../../assets/game/objects/31.webp') },
  { id: 32, width: 148, height: 100, source: require('../../assets/game/objects/32.webp') },
  { id: 33, width: 136, height: 100, source: require('../../assets/game/objects/33.webp') },
  { id: 34, width: 82, height: 100, source: require('../../assets/game/objects/34.webp') },
  { id: 35, width: 92, height: 100, source: require('../../assets/game/objects/35.webp') },
  { id: 36, width: 100, height: 100, source: require('../../assets/game/objects/36.webp') },
  { id: 37, width: 118, height: 100, source: require('../../assets/game/objects/37.webp') },
  { id: 38, width: 220, height: 100, source: require('../../assets/game/objects/38.webp') },
  { id: 39, width: 119, height: 100, source: require('../../assets/game/objects/39.webp') },
  { id: 40, width: 151, height: 100, source: require('../../assets/game/objects/40.webp') },
];

export function getRandomCharacterId(): CharacterId {
  const nextId = Math.floor(Math.random() * 4) + 1;
  return nextId as CharacterId;
}
