#pragma once

class MapData {
public:
    static const int MAP_WIDTH = 30;
    static const int MAP_HEIGHT = 15;

    static int getTile(int stage, int x, int y);
    static bool isWalkable(int tileType);
    static bool canEncounter(int tileType);
    static int getStartX(int stage);
    static int getStartY(int stage);

    static const int stage1[MAP_HEIGHT][MAP_WIDTH];
    static const int stage2[MAP_HEIGHT][MAP_WIDTH];
    static const int stage3[MAP_HEIGHT][MAP_WIDTH];
};
