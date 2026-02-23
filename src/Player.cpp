#include "Player.h"
#include "Item.h"

static const int EXP_TABLE[] = {
    0,      // Level 1 (base)
    15,     // Level 2
    40,     // Level 3
    80,     // Level 4
    140,    // Level 5
    220,    // Level 6
    330,    // Level 7
    470,    // Level 8
    650,    // Level 9
    880,    // Level 10
    1200,   // Level 11
    1600,   // Level 12
    2100,   // Level 13
    2700,   // Level 14
    3400,   // Level 15
    4200,   // Level 16
    5200,   // Level 17
    6400,   // Level 18
    7800,   // Level 19
    9500,   // Level 20
    12000,  // Level 21
    14000,  // Level 22
    16500,  // Level 23
    19500,  // Level 24
    23000,  // Level 25
    27000,  // Level 26
    31500,  // Level 27
    36500,  // Level 28
    42000,  // Level 29
    48000,  // Level 30
};

Player::Player() {
    reset();
}

void Player::reset() {
    hp = 60; maxHp = 60;
    mp = 30; maxMp = 30;
    atk = 40; def = 30;
    level = 1;
    exp = 0;
    gold = 100;
    equippedWeaponId = -1;
    equippedArmorId = -1;
    inventory.clear();
    atkDebuffTurns = 0;
}

int Player::getEffectiveAtk() const {
    int a = atk;
    if (equippedWeaponId >= 0) {
        a += ItemDB::get(equippedWeaponId).value;
    }
    if (atkDebuffTurns > 0) {
        a /= 2;
    }
    return a;
}

int Player::getEffectiveDef() const {
    int d = def;
    if (equippedArmorId >= 0) {
        d += ItemDB::get(equippedArmorId).value;
    }
    return d;
}

bool Player::addItem(int itemId, int qty) {
    const ItemDef& item = ItemDB::get(itemId);

    // Weapons and armor equip immediately, don't take inventory space
    if (item.type == ItemType::WEAPON || item.type == ItemType::ARMOR) {
        return true;
    }

    // Check if already in inventory
    for (auto& inv : inventory) {
        if (inv.itemId == itemId) {
            inv.quantity += qty;
            return true;
        }
    }

    // Check inventory limit
    if (getTotalItemSlots() >= MAX_ITEMS) {
        return false;
    }

    inventory.push_back({itemId, qty});
    return true;
}

bool Player::removeItem(int itemId, int qty) {
    for (int i = 0; i < (int)inventory.size(); i++) {
        if (inventory[i].itemId == itemId) {
            inventory[i].quantity -= qty;
            if (inventory[i].quantity <= 0) {
                inventory.erase(inventory.begin() + i);
            }
            return true;
        }
    }
    return false;
}

int Player::getItemCount(int itemId) const {
    for (const auto& inv : inventory) {
        if (inv.itemId == itemId) {
            return inv.quantity;
        }
    }
    return 0;
}

int Player::getTotalItemSlots() const {
    return (int)inventory.size();
}

int Player::getExpForLevel(int lv) const {
    if (lv <= 1) return 0;
    if (lv <= 30) return EXP_TABLE[lv - 1];
    // Beyond level 30: each level adds 7000 more
    int base = EXP_TABLE[29]; // level 30 = 48000
    for (int i = 31; i <= lv; i++) {
        base += 7000;
    }
    return base;
}

bool Player::checkLevelUp() {
    if (level >= MAX_LEVEL) return false;

    int needed = getExpForLevel(level + 1);
    if (exp >= needed) {
        level++;
        maxHp += 5;
        hp += 5;
        maxMp += 3;
        mp += 3;
        atk += 3;
        def += 3;
        return true;
    }
    return false;
}

void Player::takeDamage(int amount) {
    hp -= amount;
    if (hp < 0) hp = 0;
}

void Player::heal(int amount) {
    hp += amount;
    if (hp > maxHp) hp = maxHp;
}

void Player::restoreMp(int amount) {
    mp += amount;
    if (mp > maxMp) mp = maxMp;
}

bool Player::isAlive() const {
    return hp > 0;
}

bool Player::canCastAttackMagic() const {
    return mp >= 10;
}

bool Player::canCastHealMagic() const {
    return mp >= 15;
}
