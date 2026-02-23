#include "GameState.h"

GameState g_state;

GameState::GameState() {
    reset();
}

void GameState::reset() {
    scene = GameScene::TITLE;
    player.reset();
    currentStage = 1;
    playerMapX = 2;
    playerMapY = 7;
    battleEnemies.clear();
    isBossBattle = false;
}

void GameState::startNewGame() {
    reset();
    scene = GameScene::FIELD;
}
