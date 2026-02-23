#include "Item.h"

const ItemDef ItemDB::ITEMS[] = {
    // Weapons (ID 0-5)
    {"Ki no Tsurugi",      ItemType::WEAPON, 50,    5,  0, 1},  // 0
    {"Dou no Tsurugi",     ItemType::WEAPON, 200,   12, 0, 1},  // 1
    {"Tetsu no Tsurugi",   ItemType::WEAPON, 600,   22, 0, 2},  // 2
    {"Hagane no Tsurugi",  ItemType::WEAPON, 1500,  35, 0, 2},  // 3
    {"Honoo no Ken",       ItemType::WEAPON, 4000,  50, 0, 3},  // 4
    {"Seinaru Ken",        ItemType::WEAPON, 10000, 70, 0, 3},  // 5

    // Armor (ID 6-11)
    {"Kawa no Yoroi",      ItemType::ARMOR, 40,    5,  0, 1},   // 6
    {"Kusari Katabira",    ItemType::ARMOR, 250,   12, 0, 1},   // 7
    {"Tetsu no Yoroi",     ItemType::ARMOR, 700,   22, 0, 2},   // 8
    {"Hagane no Yoroi",    ItemType::ARMOR, 1800,  35, 0, 2},   // 9
    {"Dragon Mail",        ItemType::ARMOR, 5000,  50, 0, 3},   // 10
    {"Mithril Armor",      ItemType::ARMOR, 12000, 70, 0, 3},   // 11

    // Consumables (ID 12-16)
    {"Yakusou",            ItemType::CONSUMABLE, 10,  30,  1, 0},  // 12 - Herb HP+30
    {"Jou Yakusou",        ItemType::CONSUMABLE, 40,  80,  1, 2},  // 13 - Strong Herb HP+80
    {"Dokukeshi",          ItemType::CONSUMABLE, 8,   0,   2, 0},  // 14 - Antidote
    {"MP Potion",          ItemType::CONSUMABLE, 30,  20,  3, 0},  // 15 - MP+20
    {"Mantan Yaku",        ItemType::CONSUMABLE, 150, 200, 1, 3},  // 16 - Full Herb HP+200
};

const ItemDef& ItemDB::get(int itemId) {
    if (itemId < 0 || itemId >= ITEM_COUNT) {
        return ITEMS[0];
    }
    return ITEMS[itemId];
}

int ItemDB::getCount() {
    return ITEM_COUNT;
}
