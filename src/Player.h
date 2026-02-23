#pragma once
#include <vector>

struct InventoryItem {
    int itemId;
    int quantity;
};

class Player {
public:
    int hp, maxHp;
    int mp, maxMp;
    int atk, def;
    int level;
    int exp;
    int gold;
    int equippedWeaponId;
    int equippedArmorId;
    std::vector<InventoryItem> inventory;

    // Status effect
    int atkDebuffTurns;  // turns remaining with ATK halved

    static const int MAX_LEVEL = 50;
    static const int MAX_ITEMS = 5;

    Player();
    void reset();

    int getEffectiveAtk() const;
    int getEffectiveDef() const;

    bool addItem(int itemId, int qty = 1);
    bool removeItem(int itemId, int qty = 1);
    int getItemCount(int itemId) const;
    int getTotalItemSlots() const;

    bool checkLevelUp();
    int getExpForLevel(int lv) const;

    void takeDamage(int amount);
    void heal(int amount);
    void restoreMp(int amount);
    bool isAlive() const;
    bool canCastAttackMagic() const;
    bool canCastHealMagic() const;
};
