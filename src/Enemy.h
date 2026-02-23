#pragma once
#include <string>

enum class EnemyType {
    SLIME = 0, BAT, GOBLIN, WOLF,
    FIRE_SNAKE, GOLEM, DARK_MAGE,
    MIDBOSS_FLAME_DRAGON,
    DEMON_KNIGHT, SHADOW, DARK_SORCERER,
    BOSS_DEMON_LORD,
    COUNT
};

struct EnemyDef {
    const char* name;
    int hp;
    int atk;
    int def;
    int exp;
    int gold;
    int stage;
    bool isBoss;
    bool canHeal;
    bool canAoe;
    bool canStatusAttack;
};

class Enemy {
public:
    EnemyType type;
    std::string name;
    int hp, maxHp;
    int atk, def;
    int exp, gold;
    int stage;
    bool isBoss;
    bool canHeal;
    bool canAoe;
    bool canStatusAttack;

    Enemy();
    void init(EnemyType t);
    void takeDamage(int amount);
    void healSelf(int amount);
    bool isAlive() const;

    static const EnemyDef& getDefinition(EnemyType t);
    static const EnemyDef DEFINITIONS[];
    static const int ENEMY_COUNT = 12;
};
