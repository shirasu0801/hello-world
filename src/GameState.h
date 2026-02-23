#pragma once
#include "Player.h"
#include "Enemy.h"
#include <vector>

enum class GameScene { TITLE = 0, FIELD = 1, BATTLE = 2, SHOP = 3, GAME_OVER = 4, GAME_CLEAR = 5 };

struct GameState {
    GameScene scene;
    Player player;
    int currentStage;
    int playerMapX;
    int playerMapY;

    // Battle state
    std::vector<Enemy> battleEnemies;
    bool isBossBattle;

    GameState();
    void reset();
    void startNewGame();
};

extern GameState g_state;
