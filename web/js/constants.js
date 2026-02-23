export const SCREEN_W = 256;
export const SCREEN_H = 240;
export const TILE_SIZE = 16;
export const MAP_COLS = 30;
export const MAP_ROWS = 15;
export const SCALE = 3;
export const VIEWPORT_COLS = 16;
export const VIEWPORT_ROWS = 15;

export const COLOR = {
    BLACK:     '#000000',
    WHITE:     '#FCFCFC',
    BLUE:      '#0000FC',
    RED:       '#A80020',
    GREEN:     '#00A800',
    YELLOW:    '#F8D878',
    BROWN:     '#A85400',
    GRAY:      '#BCBCBC',
    SKIN:      '#F8B878',
    ORANGE:    '#F85800',
    PURPLE:    '#7800A8',
    CYAN:      '#00E8D8',
    LAVA:      '#D82800',
    DARK_GRAY: '#585858',
    DARK_BLUE: '#000088',
    DARK_GREEN:'#005800',
    WATER:     '#0058F8',
    LIGHT_GRAY:'#A0A0A0',
    DARK_BROWN:'#383838'
};

export const TILE = {
    GRASS: 0,
    TREE: 1,
    WATER: 2,
    MOUNTAIN: 3,
    ROAD: 4,
    VILLAGE: 5,
    CAVE_ENTRANCE: 6,
    CASTLE: 7,
    WALL: 8,
    LAVA: 9,
    FLOOR: 10,
    STAIRS_DOWN: 11,
    STAIRS_UP: 12,
    BOSS_TILE: 13,
    SHOP_TILE: 14
};

export const SCENE = {
    TITLE: 0,
    FIELD: 1,
    BATTLE: 2,
    SHOP: 3,
    GAME_OVER: 4,
    GAME_CLEAR: 5
};
