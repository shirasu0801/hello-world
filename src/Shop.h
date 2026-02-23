#pragma once
#include "Player.h"
#include "Item.h"
#include <vector>

class Shop {
public:
    static std::vector<int> getAvailableItems(int stage);
    static bool buyItem(Player* player, int itemId);
    static bool equipItem(Player* player, int itemId);
};
