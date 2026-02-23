import { SCREEN_W, SCREEN_H, COLOR, SCENE } from './constants.js';

export class ShopUI {
    constructor(wasm, renderer) {
        this.wasm = wasm;
        this.renderer = renderer;
        this.cursor = 0;
        this.items = [];
        this.message = '';
        this.messageTimer = 0;
    }

    open() {
        const stage = this.wasm.getCurrentStage();
        const itemsJson = this.wasm.getShopItems(stage);
        this.items = JSON.parse(itemsJson);
        this.cursor = 0;
        this.message = '';
        this.messageTimer = 0;
    }

    update(keys, dt) {
        // Refresh items
        if (this.items.length === 0) {
            this.open();
        }

        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.message = '';
                this.refreshItems();
            }
            if (keys['Enter'] || keys['KeyZ']) {
                this.messageTimer = 0;
                this.message = '';
                this.refreshItems();
            }
            this.render();
            return;
        }

        if (keys['ArrowUp']) {
            this.cursor = Math.max(0, this.cursor - 1);
        } else if (keys['ArrowDown']) {
            this.cursor = Math.min(this.items.length, this.cursor + 1);
        }

        if (keys['Enter'] || keys['KeyZ']) {
            if (this.cursor >= this.items.length) {
                // Exit
                this.wasm.setScene(SCENE.FIELD);
                return;
            }
            this.buyItem();
        }

        if (keys['Escape'] || keys['KeyX']) {
            this.wasm.setScene(SCENE.FIELD);
            return;
        }

        this.render();
    }

    buyItem() {
        const item = this.items[this.cursor];
        if (!item.canBuy) {
            const stats = JSON.parse(this.wasm.getPlayerStats());
            if (stats.gold < item.price) {
                this.message = 'Not enough gold!';
            } else {
                this.message = 'Inventory full!';
            }
            this.messageTimer = 1500;
            return;
        }

        const success = this.wasm.shopBuyItem(item.itemId);
        if (success) {
            const typeNames = { 0: 'Equipped ', 1: 'Equipped ', 2: 'Bought ' };
            this.message = (typeNames[item.type] || 'Bought ') + item.name + '!';
            this.messageTimer = 1500;
        } else {
            this.message = 'Cannot buy!';
            this.messageTimer = 1500;
        }
    }

    refreshItems() {
        const stage = this.wasm.getCurrentStage();
        const itemsJson = this.wasm.getShopItems(stage);
        this.items = JSON.parse(itemsJson);
    }

    render() {
        const r = this.renderer;
        r.clear(COLOR.BLACK);

        const stats = JSON.parse(this.wasm.getPlayerStats());

        // Title
        r.drawWindow(4, 4, SCREEN_W - 8, 24);
        r.drawText('SHOP', 16, 12, COLOR.YELLOW);
        r.drawText('Gold: ' + stats.gold, 140, 12, COLOR.YELLOW);

        // Item list
        r.drawWindow(4, 32, SCREEN_W - 8, 160);

        const startY = 40;
        const lineH = 14;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const y = startY + i * lineH;
            const color = item.canBuy ? COLOR.WHITE : COLOR.DARK_GRAY;

            if (i === this.cursor) {
                r.drawText('>', 12, y, COLOR.WHITE);
            }

            r.drawText(item.name, 24, y, color);

            // Show price and effect
            r.drawText(String(item.price) + 'G', 170, y, color);

            // Show stat bonus
            if (item.type === 0) {
                r.drawText('+' + item.value + 'ATK', 215, y, COLOR.CYAN);
            } else if (item.type === 1) {
                r.drawText('+' + item.value + 'DEF', 215, y, COLOR.CYAN);
            }
        }

        // Exit option
        const exitY = startY + this.items.length * lineH;
        if (this.cursor >= this.items.length) {
            r.drawText('>', 12, exitY, COLOR.WHITE);
        }
        r.drawText('Exit', 24, exitY, COLOR.WHITE);

        // Player equipment info
        r.drawWindow(4, 196, SCREEN_W - 8, 40);
        r.drawText('ATK:' + stats.effectiveAtk + ' DEF:' + stats.effectiveDef, 16, 204, COLOR.WHITE);
        r.drawText('Items:' + this.getInvCount() + '/5', 16, 218, COLOR.GRAY);

        // Current equipment
        if (stats.equippedWeaponId >= 0) {
            const wepJson = this.wasm.getShopItems(1); // just to get name
            r.drawText('W:ID' + stats.equippedWeaponId, 140, 204, COLOR.GRAY);
        }

        // Message
        if (this.message) {
            r.drawWindow(30, 100, 196, 32);
            r.drawText(this.message, 42, 112, COLOR.YELLOW);
        }
    }

    getInvCount() {
        const inv = JSON.parse(this.wasm.getPlayerInventory());
        return inv.length;
    }
}
