#include "Battle.h"
#include "Item.h"
#include <cstdlib>
#include <sstream>
#include <algorithm>

Battle::Battle() : player(nullptr), isBoss(false), phase(BattlePhase::AWAITING_COMMAND), currentEnemyIdx(0) {}

void Battle::start(Player* p, const std::vector<Enemy>& e, bool boss) {
    player = p;
    enemies = e;
    isBoss = boss;
    phase = BattlePhase::AWAITING_COMMAND;
    currentEnemyIdx = 0;
}

int Battle::calculateDamage(int atk, int def) {
    int dmg = atk / 2 - def / 4;
    // Add +-10% randomness
    int variance = std::max(1, dmg / 10);
    dmg += (rand() % (variance * 2 + 1)) - variance;
    return std::max(1, dmg);
}

std::string Battle::playerAttack(int targetIdx) {
    if (targetIdx < 0 || targetIdx >= (int)enemies.size() || !enemies[targetIdx].isAlive()) {
        targetIdx = getFirstAliveEnemy();
    }
    if (targetIdx < 0) return "{\"error\":true}";

    int dmg = calculateDamage(player->getEffectiveAtk(), enemies[targetIdx].def);
    enemies[targetIdx].takeDamage(dmg);

    std::ostringstream ss;
    ss << "{\"event\":\"playerAttack\""
       << ",\"target\":\"" << enemies[targetIdx].name << "\""
       << ",\"targetIdx\":" << targetIdx
       << ",\"damage\":" << dmg
       << ",\"enemyHp\":" << enemies[targetIdx].hp
       << ",\"enemyMaxHp\":" << enemies[targetIdx].maxHp
       << ",\"killed\":" << (enemies[targetIdx].isAlive() ? "false" : "true")
       << "}";
    return ss.str();
}

std::string Battle::playerMagicAttack(int targetIdx) {
    if (!player->canCastAttackMagic()) {
        return "{\"event\":\"noMp\",\"message\":\"Not enough MP!\"}";
    }

    if (targetIdx < 0 || targetIdx >= (int)enemies.size() || !enemies[targetIdx].isAlive()) {
        targetIdx = getFirstAliveEnemy();
    }
    if (targetIdx < 0) return "{\"error\":true}";

    player->mp -= 10;
    // Magic damage: 1.5x player ATK
    int magicAtk = (int)(player->getEffectiveAtk() * 1.5);
    int dmg = calculateDamage(magicAtk, enemies[targetIdx].def);
    enemies[targetIdx].takeDamage(dmg);

    std::ostringstream ss;
    ss << "{\"event\":\"playerMagicAttack\""
       << ",\"target\":\"" << enemies[targetIdx].name << "\""
       << ",\"targetIdx\":" << targetIdx
       << ",\"damage\":" << dmg
       << ",\"mpCost\":10"
       << ",\"enemyHp\":" << enemies[targetIdx].hp
       << ",\"enemyMaxHp\":" << enemies[targetIdx].maxHp
       << ",\"killed\":" << (enemies[targetIdx].isAlive() ? "false" : "true")
       << "}";
    return ss.str();
}

std::string Battle::playerMagicHeal() {
    if (!player->canCastHealMagic()) {
        return "{\"event\":\"noMp\",\"message\":\"Not enough MP!\"}";
    }

    player->mp -= 15;
    int healAmt = 30 + player->level * 2;
    player->heal(healAmt);

    std::ostringstream ss;
    ss << "{\"event\":\"playerHeal\""
       << ",\"healAmount\":" << healAmt
       << ",\"mpCost\":15"
       << ",\"hp\":" << player->hp
       << ",\"maxHp\":" << player->maxHp
       << "}";
    return ss.str();
}

std::string Battle::playerUseItem(int itemId) {
    if (player->getItemCount(itemId) <= 0) {
        return "{\"event\":\"noItem\",\"message\":\"No item!\"}";
    }

    const ItemDef& item = ItemDB::get(itemId);
    std::ostringstream ss;

    if (item.type == ItemType::CONSUMABLE) {
        player->removeItem(itemId);

        if (item.subType == 1) {
            // Herb - heal HP
            player->heal(item.value);
            ss << "{\"event\":\"useItem\""
               << ",\"itemName\":\"" << item.name << "\""
               << ",\"healAmount\":" << item.value
               << ",\"hp\":" << player->hp
               << ",\"maxHp\":" << player->maxHp
               << "}";
        } else if (item.subType == 2) {
            // Antidote - cure status
            player->atkDebuffTurns = 0;
            ss << "{\"event\":\"useItem\""
               << ",\"itemName\":\"" << item.name << "\""
               << ",\"curedStatus\":true"
               << "}";
        } else if (item.subType == 3) {
            // MP Potion
            player->restoreMp(item.value);
            ss << "{\"event\":\"useItem\""
               << ",\"itemName\":\"" << item.name << "\""
               << ",\"mpRestore\":" << item.value
               << ",\"mp\":" << player->mp
               << ",\"maxMp\":" << player->maxMp
               << "}";
        }
    } else {
        ss << "{\"event\":\"cantUse\",\"message\":\"Cannot use this item!\"}";
    }

    return ss.str();
}

std::string Battle::playerRun() {
    if (isBoss) {
        return "{\"event\":\"cantRun\",\"message\":\"Cannot run from boss!\"}";
    }

    // Calculate average enemy level (estimated from HP)
    int totalPower = 0;
    int count = getAliveEnemyCount();
    for (auto& e : enemies) {
        if (e.isAlive()) totalPower += e.maxHp / 5;
    }
    int avgEnemyPower = count > 0 ? totalPower / count : 1;

    int successRate = 50 + (player->level - avgEnemyPower) * 10;
    successRate = std::max(10, std::min(90, successRate));

    bool success = (rand() % 100) < successRate;

    std::ostringstream ss;
    if (success) {
        phase = BattlePhase::RAN_AWAY;
        ss << "{\"event\":\"runSuccess\",\"message\":\"Got away safely!\"}";
    } else {
        ss << "{\"event\":\"runFail\",\"message\":\"Could not escape!\"}";
    }
    return ss.str();
}

std::string Battle::enemyTurn(int enemyIdx) {
    if (enemyIdx < 0 || enemyIdx >= (int)enemies.size() || !enemies[enemyIdx].isAlive()) {
        return "{\"event\":\"skip\"}";
    }

    auto& e = enemies[enemyIdx];
    std::ostringstream ss;

    // Decrement ATK debuff
    if (player->atkDebuffTurns > 0 && enemyIdx == 0) {
        player->atkDebuffTurns--;
    }

    // Boss AI
    if (e.isBoss) {
        int roll = rand() % 100;
        bool lowHp = e.hp < e.maxHp * 30 / 100;

        if (e.canHeal && lowHp && roll < 15) {
            // Heal
            int healAmt = e.isBoss && e.type == EnemyType::BOSS_DEMON_LORD ? 80 : 40;
            e.healSelf(healAmt);
            ss << "{\"event\":\"enemyHeal\""
               << ",\"enemy\":\"" << e.name << "\""
               << ",\"healAmount\":" << healAmt
               << ",\"enemyHp\":" << e.hp
               << ",\"enemyMaxHp\":" << e.maxHp
               << "}";
            return ss.str();
        } else if (e.canStatusAttack && e.type == EnemyType::BOSS_DEMON_LORD && roll < 35) {
            // Status attack - halve player ATK
            player->atkDebuffTurns = 3;
            int dmg = calculateDamage(e.atk / 2, player->getEffectiveDef());
            player->takeDamage(dmg);
            ss << "{\"event\":\"enemyStatus\""
               << ",\"enemy\":\"" << e.name << "\""
               << ",\"damage\":" << dmg
               << ",\"message\":\"ATK halved for 3 turns!\""
               << ",\"playerHp\":" << player->hp
               << "}";
            return ss.str();
        } else if (e.canAoe && roll < 60) {
            // AoE - 1.5x ATK
            int aoeAtk = (int)(e.atk * 1.5);
            int dmg = calculateDamage(aoeAtk, player->getEffectiveDef());
            player->takeDamage(dmg);
            ss << "{\"event\":\"enemyAoe\""
               << ",\"enemy\":\"" << e.name << "\""
               << ",\"damage\":" << dmg
               << ",\"playerHp\":" << player->hp
               << "}";
            return ss.str();
        }
    }

    // Normal attack
    int dmg = calculateDamage(e.atk, player->getEffectiveDef());
    player->takeDamage(dmg);

    ss << "{\"event\":\"enemyAttack\""
       << ",\"enemy\":\"" << e.name << "\""
       << ",\"damage\":" << dmg
       << ",\"playerHp\":" << player->hp
       << ",\"playerMaxHp\":" << player->maxHp
       << "}";
    return ss.str();
}

std::string Battle::checkBattleEnd() {
    if (!player->isAlive()) {
        phase = BattlePhase::DEFEAT;
        return "{\"ended\":true,\"result\":\"defeat\"}";
    }

    if (getAliveEnemyCount() == 0) {
        phase = BattlePhase::VICTORY;
        int totalExp = 0, totalGold = 0;
        for (auto& e : enemies) {
            totalExp += e.exp;
            totalGold += e.gold;
        }
        player->exp += totalExp;
        player->gold += totalGold;

        bool leveledUp = false;
        int newLevel = player->level;
        while (player->checkLevelUp()) {
            leveledUp = true;
            newLevel = player->level;
        }

        std::ostringstream ss;
        ss << "{\"ended\":true,\"result\":\"victory\""
           << ",\"expGained\":" << totalExp
           << ",\"goldGained\":" << totalGold
           << ",\"levelUp\":" << (leveledUp ? "true" : "false")
           << ",\"newLevel\":" << newLevel
           << "}";

        // Check if final boss defeated
        for (auto& e : enemies) {
            if (e.type == EnemyType::BOSS_DEMON_LORD) {
                ss.str("");
                ss << "{\"ended\":true,\"result\":\"gameClear\""
                   << ",\"expGained\":" << totalExp
                   << ",\"goldGained\":" << totalGold
                   << "}";
                break;
            }
        }

        return ss.str();
    }

    return "{\"ended\":false}";
}

int Battle::getAliveEnemyCount() const {
    int count = 0;
    for (auto& e : enemies) {
        if (e.isAlive()) count++;
    }
    return count;
}

int Battle::getFirstAliveEnemy() const {
    for (int i = 0; i < (int)enemies.size(); i++) {
        if (enemies[i].isAlive()) return i;
    }
    return -1;
}

bool Battle::isOver() const {
    return phase == BattlePhase::VICTORY || phase == BattlePhase::DEFEAT || phase == BattlePhase::RAN_AWAY;
}
