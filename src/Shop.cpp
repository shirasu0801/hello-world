#include "Shop.h"

std::vector<int> Shop::getAvailableItems(int stage) {
    std::vector<int> items;
    for (int i = 0; i < ItemDB::getCount(); i++) {
        const ItemDef& item = ItemDB::get(i);
        if (item.stage == 0 || item.stage == stage) {
            // For consumables sold in stage 2+, check if correct stage
            if (item.type == ItemType::CONSUMABLE) {
                if (item.stage == 0 || item.stage <= stage) {
                    items.push_back(i);
                }
            } else {
                if (item.stage == stage) {
                    items.push_back(i);
                }
            }
        }
    }
    return items;
}

bool Shop::buyItem(Player* player, int itemId) {
    const ItemDef& item = ItemDB::get(itemId);

    if (player->gold < item.price) return false;

    if (item.type == ItemType::WEAPON || item.type == ItemType::ARMOR) {
        player->gold -= item.price;
        equipItem(player, itemId);
        return true;
    }

    // Consumable
    if (!player->addItem(itemId)) return false;
    player->gold -= item.price;
    return true;
}

bool Shop::equipItem(Player* player, int itemId) {
    const ItemDef& item = ItemDB::get(itemId);
    if (item.type == ItemType::WEAPON) {
        player->equippedWeaponId = itemId;
        return true;
    } else if (item.type == ItemType::ARMOR) {
        player->equippedArmorId = itemId;
        return true;
    }
    return false;
}
