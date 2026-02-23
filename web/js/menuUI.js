import { SCREEN_W, SCREEN_H, COLOR } from './constants.js';

const MENU_STATE = {
    MAIN: 0,
    ITEMS: 1,
    USE_ITEM: 2,
    MESSAGE: 3,
};

export class MenuUI {
    constructor(wasm, renderer) {
        this.wasm = wasm;
        this.renderer = renderer;
        this.isOpen = false;
        this.state = MENU_STATE.MAIN;
        this.cursor = 0;
        this.itemCursor = 0;
        this.message = '';
        this.messageTimer = 0;
    }

    open() {
        this.isOpen = true;
        this.state = MENU_STATE.MAIN;
        this.cursor = 0;
        this.message = '';
        this.messageTimer = 0;
    }

    close() {
        this.isOpen = false;
    }

    update(keys, dt) {
        if (!this.isOpen) return false;

        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0 || keys['Enter'] || keys['KeyZ']) {
                this.messageTimer = 0;
                this.message = '';
                this.state = MENU_STATE.ITEMS;
            }
            return true;
        }

        switch (this.state) {
            case MENU_STATE.MAIN:
                if (keys['ArrowUp']) this.cursor = (this.cursor + 1) % 2;
                else if (keys['ArrowDown']) this.cursor = (this.cursor + 1) % 2;

                if (keys['Enter'] || keys['KeyZ']) {
                    if (this.cursor === 0) {
                        // Status - just show (already shown)
                    } else if (this.cursor === 1) {
                        this.state = MENU_STATE.ITEMS;
                        this.itemCursor = 0;
                    }
                }

                if (keys['Escape'] || keys['KeyX']) {
                    this.close();
                    return false;
                }
                break;

            case MENU_STATE.ITEMS:
                {
                    const inv = JSON.parse(this.wasm.getPlayerInventory());
                    if (keys['ArrowUp']) this.itemCursor = Math.max(0, this.itemCursor - 1);
                    else if (keys['ArrowDown']) this.itemCursor = Math.min(inv.length - 1, this.itemCursor + 1);

                    if (keys['Enter'] || keys['KeyZ']) {
                        if (inv.length > 0 && this.itemCursor < inv.length) {
                            const item = inv[this.itemCursor];
                            if (item.type === 2) {
                                const resultJson = this.wasm.useFieldItem(item.itemId);
                                const result = JSON.parse(resultJson);
                                this.message = result.message;
                                this.messageTimer = 1500;
                                this.state = MENU_STATE.MESSAGE;
                            }
                        }
                    }

                    if (keys['Escape'] || keys['KeyX']) {
                        this.state = MENU_STATE.MAIN;
                    }
                }
                break;
        }

        return true;
    }

    render(r) {
        if (!this.isOpen) return;

        const stats = JSON.parse(this.wasm.getPlayerStats());

        // Status window
        r.drawWindow(8, 8, 240, 100);
        r.drawText('STATUS', 20, 16, COLOR.YELLOW);
        r.drawText('LV:' + stats.level, 20, 32, COLOR.WHITE);
        r.drawText('HP:' + stats.hp + '/' + stats.maxHp, 20, 46, COLOR.WHITE);
        r.drawText('MP:' + stats.mp + '/' + stats.maxMp, 20, 60, COLOR.CYAN);
        r.drawText('ATK:' + stats.effectiveAtk, 20, 74, COLOR.WHITE);
        r.drawText('DEF:' + stats.effectiveDef, 20, 88, COLOR.WHITE);
        r.drawText('EXP:' + stats.exp, 130, 32, COLOR.WHITE);
        r.drawText('NEXT:' + stats.expNext, 130, 46, COLOR.WHITE);
        r.drawText('GOLD:' + stats.gold, 130, 60, COLOR.YELLOW);

        // Equipment
        if (stats.equippedWeaponId >= 0) {
            r.drawText('W:ID' + stats.equippedWeaponId, 130, 74, COLOR.GRAY);
        }
        if (stats.equippedArmorId >= 0) {
            r.drawText('A:ID' + stats.equippedArmorId, 130, 88, COLOR.GRAY);
        }

        // Menu options
        r.drawWindow(8, 112, 100, 50);
        const menuItems = ['Status', 'Items'];
        for (let i = 0; i < menuItems.length; i++) {
            const y = 122 + i * 16;
            if (this.state === MENU_STATE.MAIN && i === this.cursor) {
                r.drawText('>', 16, y, COLOR.WHITE);
            }
            r.drawText(menuItems[i], 28, y, COLOR.WHITE);
        }

        // Items list
        if (this.state === MENU_STATE.ITEMS || this.state === MENU_STATE.MESSAGE) {
            const inv = JSON.parse(this.wasm.getPlayerInventory());
            r.drawWindow(8, 166, 240, 68);
            r.drawText('ITEMS', 20, 174, COLOR.YELLOW);

            if (inv.length === 0) {
                r.drawText('No items', 20, 192, COLOR.DARK_GRAY);
            } else {
                for (let i = 0; i < inv.length; i++) {
                    const y = 192 + i * 12;
                    if (this.state === MENU_STATE.ITEMS && i === this.itemCursor) {
                        r.drawText('>', 14, y, COLOR.WHITE);
                    }
                    r.drawText(inv[i].name, 24, y, COLOR.WHITE);
                    r.drawText('x' + inv[i].quantity, 190, y, COLOR.GRAY);
                }
            }
        }

        // Message
        if (this.message) {
            r.drawWindow(30, 130, 196, 28);
            r.drawText(this.message, 42, 140, COLOR.YELLOW);
        }
    }
}
