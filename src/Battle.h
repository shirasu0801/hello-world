#pragma once
#include "Player.h"
#include "Enemy.h"
#include <vector>
#include <string>

enum class BattlePhase {
    AWAITING_COMMAND,
    PLAYER_TURN,
    ENEMY_TURN,
    VICTORY,
    DEFEAT,
    RAN_AWAY
};

class Battle {
public:
    Player* player;
    std::vector<Enemy> enemies;
    bool isBoss;
    BattlePhase phase;
    int currentEnemyIdx;

    Battle();
    void start(Player* p, const std::vector<Enemy>& e, bool boss);

    static int calculateDamage(int atk, int def);

    // Player actions - return JSON result
    std::string playerAttack(int targetIdx);
    std::string playerMagicAttack(int targetIdx);
    std::string playerMagicHeal();
    std::string playerUseItem(int itemId);
    std::string playerRun();

    // Enemy action
    std::string enemyTurn(int enemyIdx);

    // Check victory/defeat
    std::string checkBattleEnd();

    int getAliveEnemyCount() const;
    int getFirstAliveEnemy() const;
    bool isOver() const;
};
