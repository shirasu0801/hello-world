#include <emscripten/bind.h>
#include <string>
#include <sstream>
#include <cstdlib>
#include <ctime>
#include "../GameState.h"
#include "../Item.h"
#include "../MapData.h"
#include "../Enemy.h"
#include "../Battle.h"
#include "../Shop.h"

static Battle g_battle;

static bool g_randInit = false;

static void ensureRand() {
    if (!g_randInit) {
        srand((unsigned)time(nullptr));
        g_randInit = true;
    }
}

void initGame() {
    g_state.reset();
    ensureRand();
}

int getInitStatus() { return 1; }

void startNewGame() {
    g_state.startNewGame();
}

int getCurrentScene() { return static_cast<int>(g_state.scene); }

void setScene(int scene) {
    g_state.scene = static_cast<GameScene>(scene);
}

std::string getPlayerStats() {
    auto& p = g_state.player;
    std::ostringstream ss;
    ss << "{\"hp\":" << p.hp
       << ",\"maxHp\":" << p.maxHp
       << ",\"mp\":" << p.mp
       << ",\"maxMp\":" << p.maxMp
       << ",\"atk\":" << p.atk
       << ",\"def\":" << p.def
       << ",\"effectiveAtk\":" << p.getEffectiveAtk()
       << ",\"effectiveDef\":" << p.getEffectiveDef()
       << ",\"level\":" << p.level
       << ",\"exp\":" << p.exp
       << ",\"expNext\":" << p.getExpForLevel(p.level + 1)
       << ",\"gold\":" << p.gold
       << ",\"equippedWeaponId\":" << p.equippedWeaponId
       << ",\"equippedArmorId\":" << p.equippedArmorId
       << ",\"atkDebuffTurns\":" << p.atkDebuffTurns
       << ",\"stage\":" << g_state.currentStage
       << "}";
    return ss.str();
}

std::string getPlayerInventory() {
    auto& p = g_state.player;
    std::ostringstream ss;
    ss << "[";
    for (int i = 0; i < (int)p.inventory.size(); i++) {
        if (i > 0) ss << ",";
        auto& inv = p.inventory[i];
        const auto& item = ItemDB::get(inv.itemId);
        ss << "{\"itemId\":" << inv.itemId
           << ",\"name\":\"" << item.name << "\""
           << ",\"quantity\":" << inv.quantity
           << ",\"type\":" << static_cast<int>(item.type)
           << ",\"value\":" << item.value
           << ",\"subType\":" << item.subType
           << "}";
    }
    ss << "]";
    return ss.str();
}

int getPlayerMapX() { return g_state.playerMapX; }
int getPlayerMapY() { return g_state.playerMapY; }
int getCurrentStage() { return g_state.currentStage; }

// Map functions
int getMapTile(int stage, int x, int y) {
    return MapData::getTile(stage, x, y);
}

int getMapWidth() { return MapData::MAP_WIDTH; }
int getMapHeight() { return MapData::MAP_HEIGHT; }

// Returns JSON: {moved, encounter, bossEncounter, stageChange, shopTile, enemies:[...]}
std::string movePlayer(int dx, int dy) {
    int newX = g_state.playerMapX + dx;
    int newY = g_state.playerMapY + dy;

    int tile = MapData::getTile(g_state.currentStage, newX, newY);
    bool walkable = MapData::isWalkable(tile);

    std::ostringstream ss;
    ss << "{\"moved\":" << (walkable ? "true" : "false");

    if (walkable) {
        g_state.playerMapX = newX;
        g_state.playerMapY = newY;

        // Check tile events
        if (tile == 5 || tile == 14) {
            // Shop tile
            ss << ",\"shopTile\":true";
        } else if (tile == 13) {
            // Boss tile
            ss << ",\"bossEncounter\":true";
        } else if (tile == 6) {
            // Cave entrance -> go to stage 2
            if (g_state.currentStage == 1) {
                g_state.currentStage = 2;
                g_state.playerMapX = MapData::getStartX(2);
                g_state.playerMapY = MapData::getStartY(2);
                ss << ",\"stageChange\":2";
            }
        } else if (tile == 11) {
            // Stairs down -> next stage
            if (g_state.currentStage == 2) {
                g_state.currentStage = 3;
                g_state.playerMapX = MapData::getStartX(3);
                g_state.playerMapY = MapData::getStartY(3);
                ss << ",\"stageChange\":3";
            }
        } else if (tile == 12) {
            // Stairs up -> previous stage
            if (g_state.currentStage == 2) {
                g_state.currentStage = 1;
                g_state.playerMapX = 27;
                g_state.playerMapY = 7;
                ss << ",\"stageChange\":1";
            } else if (g_state.currentStage == 3) {
                g_state.currentStage = 2;
                g_state.playerMapX = 27;
                g_state.playerMapY = 13;
                ss << ",\"stageChange\":2";
            }
        } else if (MapData::canEncounter(tile)) {
            // Random encounter
            float rate = 0.0f;
            if (g_state.currentStage == 1) rate = 0.08f;
            else if (g_state.currentStage == 2) rate = 0.15f;
            else if (g_state.currentStage == 3) rate = 0.12f;

            float r = (float)(rand() % 1000) / 1000.0f;
            if (r < rate) {
                ss << ",\"encounter\":true";

                // Determine enemies for this stage
                int stage = g_state.currentStage;
                int enemyStart = 0, enemyEnd = 0;
                if (stage == 1) { enemyStart = 0; enemyEnd = 3; }
                else if (stage == 2) { enemyStart = 4; enemyEnd = 6; }
                else if (stage == 3) { enemyStart = 8; enemyEnd = 10; }

                int enemyIdx = enemyStart + (rand() % (enemyEnd - enemyStart + 1));
                const EnemyDef& eDef = Enemy::getDefinition(static_cast<EnemyType>(enemyIdx));

                // Determine group size: if player level > enemy "level" + 3, 40% chance of 2
                int enemyPower = eDef.hp / 5; // rough "level" estimate
                int count = 1;
                if (g_state.player.level > enemyPower + 3) {
                    if (rand() % 100 < 40) count = 2;
                }

                ss << ",\"enemies\":[";
                for (int i = 0; i < count; i++) {
                    if (i > 0) ss << ",";
                    ss << "{\"type\":" << enemyIdx
                       << ",\"name\":\"" << eDef.name << "\""
                       << ",\"hp\":" << eDef.hp
                       << ",\"atk\":" << eDef.atk
                       << ",\"def\":" << eDef.def
                       << ",\"exp\":" << eDef.exp
                       << ",\"gold\":" << eDef.gold
                       << "}";
                }
                ss << "]";
            }
        }
    }

    ss << "}";
    return ss.str();
}

// Battle functions
std::string startBattle(const std::string& enemiesJson, bool isBoss) {
    // Parse simple enemy type list from JS
    // Format: comma-separated enemy type indices, e.g. "0,0" or "7"
    std::vector<Enemy> enemies;

    if (isBoss) {
        // Determine boss type based on stage
        Enemy boss;
        if (g_state.currentStage == 2) {
            boss.init(EnemyType::MIDBOSS_FLAME_DRAGON);
        } else {
            boss.init(EnemyType::BOSS_DEMON_LORD);
        }
        enemies.push_back(boss);
    } else {
        // Parse enemy types from string
        std::istringstream iss(enemiesJson);
        std::string token;
        while (std::getline(iss, token, ',')) {
            int typeIdx = std::stoi(token);
            Enemy e;
            e.init(static_cast<EnemyType>(typeIdx));
            enemies.push_back(e);
        }
    }

    g_battle.start(&g_state.player, enemies, isBoss);
    g_state.scene = GameScene::BATTLE;
    g_state.battleEnemies = enemies;
    g_state.isBossBattle = isBoss;

    // Return battle info
    std::ostringstream ss;
    ss << "{\"enemies\":[";
    for (int i = 0; i < (int)enemies.size(); i++) {
        if (i > 0) ss << ",";
        ss << "{\"name\":\"" << enemies[i].name << "\""
           << ",\"hp\":" << enemies[i].hp
           << ",\"maxHp\":" << enemies[i].maxHp
           << ",\"atk\":" << enemies[i].atk
           << ",\"def\":" << enemies[i].def
           << ",\"isBoss\":" << (enemies[i].isBoss ? "true" : "false")
           << "}";
    }
    ss << "],\"isBoss\":" << (isBoss ? "true" : "false") << "}";
    return ss.str();
}

std::string executeBattleCommand(int command, int param) {
    // 0=Attack, 1=MagicAttack, 2=MagicHeal, 3=Item(param=itemId), 4=Run
    std::string result;
    switch (command) {
        case 0: result = g_battle.playerAttack(param); break;
        case 1: result = g_battle.playerMagicAttack(param); break;
        case 2: result = g_battle.playerMagicHeal(); break;
        case 3: result = g_battle.playerUseItem(param); break;
        case 4: result = g_battle.playerRun(); break;
        default: result = "{\"error\":true}"; break;
    }
    return result;
}

std::string executeEnemyTurn(int enemyIdx) {
    return g_battle.enemyTurn(enemyIdx);
}

std::string checkBattleEnd() {
    return g_battle.checkBattleEnd();
}

std::string getBattleState() {
    std::ostringstream ss;
    ss << "{\"phase\":" << static_cast<int>(g_battle.phase)
       << ",\"isBoss\":" << (g_battle.isBoss ? "true" : "false")
       << ",\"playerHp\":" << g_state.player.hp
       << ",\"playerMaxHp\":" << g_state.player.maxHp
       << ",\"playerMp\":" << g_state.player.mp
       << ",\"playerMaxMp\":" << g_state.player.maxMp
       << ",\"enemies\":[";
    for (int i = 0; i < (int)g_battle.enemies.size(); i++) {
        if (i > 0) ss << ",";
        ss << "{\"name\":\"" << g_battle.enemies[i].name << "\""
           << ",\"hp\":" << g_battle.enemies[i].hp
           << ",\"maxHp\":" << g_battle.enemies[i].maxHp
           << ",\"alive\":" << (g_battle.enemies[i].isAlive() ? "true" : "false")
           << ",\"isBoss\":" << (g_battle.enemies[i].isBoss ? "true" : "false")
           << "}";
    }
    ss << "]}";
    return ss.str();
}

int getBattleEnemyCount() {
    return g_battle.getAliveEnemyCount();
}

// Shop functions
std::string getShopItems(int stage) {
    auto items = Shop::getAvailableItems(stage);
    std::ostringstream ss;
    ss << "[";
    for (int i = 0; i < (int)items.size(); i++) {
        if (i > 0) ss << ",";
        int id = items[i];
        const ItemDef& item = ItemDB::get(id);
        bool canBuy = g_state.player.gold >= item.price;
        // Check inventory limit for consumables
        if (item.type == ItemType::CONSUMABLE && g_state.player.getTotalItemSlots() >= Player::MAX_ITEMS) {
            // Can still buy if item already exists in inventory
            if (g_state.player.getItemCount(id) == 0) canBuy = false;
        }
        ss << "{\"itemId\":" << id
           << ",\"name\":\"" << item.name << "\""
           << ",\"price\":" << item.price
           << ",\"type\":" << static_cast<int>(item.type)
           << ",\"value\":" << item.value
           << ",\"canBuy\":" << (canBuy ? "true" : "false")
           << "}";
    }
    ss << "]";
    return ss.str();
}

bool shopBuyItem(int itemId) {
    return Shop::buyItem(&g_state.player, itemId);
}

std::string useFieldItem(int itemId) {
    const ItemDef& item = ItemDB::get(itemId);
    if (g_state.player.getItemCount(itemId) <= 0) {
        return "{\"success\":false,\"message\":\"No item!\"}";
    }
    if (item.type != ItemType::CONSUMABLE) {
        return "{\"success\":false,\"message\":\"Cannot use here!\"}";
    }

    std::ostringstream ss;
    g_state.player.removeItem(itemId);
    if (item.subType == 1) {
        g_state.player.heal(item.value);
        ss << "{\"success\":true,\"message\":\"HP +" << item.value << "!\"}";
    } else if (item.subType == 3) {
        g_state.player.restoreMp(item.value);
        ss << "{\"success\":true,\"message\":\"MP +" << item.value << "!\"}";
    } else if (item.subType == 2) {
        g_state.player.atkDebuffTurns = 0;
        ss << "{\"success\":true,\"message\":\"Status cured!\"}";
    } else {
        ss << "{\"success\":false,\"message\":\"Cannot use here!\"}";
    }
    return ss.str();
}

EMSCRIPTEN_BINDINGS(game_module) {
    emscripten::function("initGame", &initGame);
    emscripten::function("getInitStatus", &getInitStatus);
    emscripten::function("startNewGame", &startNewGame);
    emscripten::function("getCurrentScene", &getCurrentScene);
    emscripten::function("setScene", &setScene);
    emscripten::function("getPlayerStats", &getPlayerStats);
    emscripten::function("getPlayerInventory", &getPlayerInventory);
    emscripten::function("getPlayerMapX", &getPlayerMapX);
    emscripten::function("getPlayerMapY", &getPlayerMapY);
    emscripten::function("getCurrentStage", &getCurrentStage);
    emscripten::function("getMapTile", &getMapTile);
    emscripten::function("getMapWidth", &getMapWidth);
    emscripten::function("getMapHeight", &getMapHeight);
    emscripten::function("movePlayer", &movePlayer);
    emscripten::function("startBattle", &startBattle);
    emscripten::function("executeBattleCommand", &executeBattleCommand);
    emscripten::function("executeEnemyTurn", &executeEnemyTurn);
    emscripten::function("checkBattleEnd", &checkBattleEnd);
    emscripten::function("getBattleState", &getBattleState);
    emscripten::function("getBattleEnemyCount", &getBattleEnemyCount);
    emscripten::function("getShopItems", &getShopItems);
    emscripten::function("shopBuyItem", &shopBuyItem);
    emscripten::function("useFieldItem", &useFieldItem);
}
