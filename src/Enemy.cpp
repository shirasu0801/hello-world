#include "Enemy.h"

const EnemyDef Enemy::DEFINITIONS[] = {
    // Stage 1
    {"Slime",          12,  20,  8,   5,   3,  1, false, false, false, false}, // 0
    {"Bat",            10,  24,  4,   7,   5,  1, false, false, false, false}, // 1
    {"Goblin",         18,  28,  12,  12,  8,  1, false, false, false, false}, // 2
    {"Wolf",           15,  32,  8,   10,  6,  1, false, false, false, false}, // 3

    // Stage 2
    {"Fire Snake",     35,  60,  28,  25,  20, 2, false, false, false, false}, // 4
    {"Golem",          55,  50,  48,  35,  30, 2, false, false, false, false}, // 5
    {"Dark Mage",      30,  70,  20,  30,  25, 2, false, false, false, false}, // 6

    // Stage 2 Boss
    {"Flame Dragon",   200, 80,  40,  300, 200, 2, true,  true,  true,  false}, // 7

    // Stage 3
    {"Demon Knight",   70,  110, 60,  60,  50, 3, false, false, false, false}, // 8
    {"Shadow",         50,  130, 30,  55,  45, 3, false, false, false, false}, // 9
    {"Dark Sorcerer",  60,  120, 40,  65,  55, 3, false, false, false, false}, // 10

    // Stage 3 Boss
    {"Demon Lord",     500, 150, 80,  0,   0,  3, true,  true,  true,  true},  // 11
};

Enemy::Enemy() : type(EnemyType::SLIME), hp(0), maxHp(0), atk(0), def(0),
    exp(0), gold(0), stage(1), isBoss(false), canHeal(false), canAoe(false), canStatusAttack(false) {}

void Enemy::init(EnemyType t) {
    const EnemyDef& d = getDefinition(t);
    type = t;
    name = d.name;
    hp = d.hp;
    maxHp = d.hp;
    atk = d.atk;
    def = d.def;
    exp = d.exp;
    gold = d.gold;
    stage = d.stage;
    isBoss = d.isBoss;
    canHeal = d.canHeal;
    canAoe = d.canAoe;
    canStatusAttack = d.canStatusAttack;
}

void Enemy::takeDamage(int amount) {
    hp -= amount;
    if (hp < 0) hp = 0;
}

void Enemy::healSelf(int amount) {
    hp += amount;
    if (hp > maxHp) hp = maxHp;
}

bool Enemy::isAlive() const {
    return hp > 0;
}

const EnemyDef& Enemy::getDefinition(EnemyType t) {
    int idx = static_cast<int>(t);
    if (idx < 0 || idx >= ENEMY_COUNT) idx = 0;
    return DEFINITIONS[idx];
}
