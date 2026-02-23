import { TILE, COLOR } from './constants.js';

export const TILE_COLORS = {
    [TILE.GRASS]:         COLOR.GREEN,
    [TILE.TREE]:          COLOR.DARK_GREEN,
    [TILE.WATER]:         COLOR.WATER,
    [TILE.MOUNTAIN]:      COLOR.BROWN,
    [TILE.ROAD]:          COLOR.YELLOW,
    [TILE.VILLAGE]:       COLOR.GRAY,
    [TILE.CAVE_ENTRANCE]: COLOR.DARK_GRAY,
    [TILE.CASTLE]:        COLOR.PURPLE,
    [TILE.WALL]:          COLOR.DARK_BROWN,
    [TILE.LAVA]:          COLOR.LAVA,
    [TILE.FLOOR]:         COLOR.LIGHT_GRAY,
    [TILE.STAIRS_DOWN]:   COLOR.DARK_GRAY,
    [TILE.STAIRS_UP]:     COLOR.GRAY,
    [TILE.BOSS_TILE]:     COLOR.RED,
    [TILE.SHOP_TILE]:     COLOR.SKIN,
};

export const STAGE_NAMES = {
    1: 'GRASSLAND',
    2: 'LAVA CAVE',
    3: 'DEMON CASTLE'
};

export const ENEMY_COLORS = {
    'Slime':         COLOR.GREEN,
    'Bat':           COLOR.PURPLE,
    'Goblin':        COLOR.BROWN,
    'Wolf':          COLOR.GRAY,
    'Fire Snake':    COLOR.ORANGE,
    'Golem':         COLOR.DARK_GRAY,
    'Dark Mage':     COLOR.DARK_BLUE,
    'Flame Dragon':  COLOR.RED,
    'Demon Knight':  COLOR.DARK_GRAY,
    'Shadow':        COLOR.PURPLE,
    'Dark Sorcerer': COLOR.DARK_BLUE,
    'Demon Lord':    COLOR.RED,
};
