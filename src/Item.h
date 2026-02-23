#pragma once

enum class ItemType {
    WEAPON = 0,
    ARMOR = 1,
    CONSUMABLE = 2
};

struct ItemDef {
    const char* name;
    ItemType type;
    int price;
    int value;    // ATK bonus for weapons, DEF bonus for armor, heal/restore amount for consumables
    int subType;  // 0=normal, 1=herb, 2=antidote, 3=mp_potion
    int stage;    // 0=all stages, 1/2/3=specific stage
};

class ItemDB {
public:
    static const ItemDef& get(int itemId);
    static int getCount();
    static const ItemDef ITEMS[];
    static const int ITEM_COUNT = 17;
};
