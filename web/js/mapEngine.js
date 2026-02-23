import { SCREEN_W, SCREEN_H, TILE_SIZE, MAP_COLS, MAP_ROWS, VIEWPORT_COLS, VIEWPORT_ROWS, COLOR, SCENE, TILE } from './constants.js';
import { TILE_COLORS, STAGE_NAMES } from './gameData.js';

export class MapEngine {
    constructor(wasm, renderer) {
        this.wasm = wasm;
        this.renderer = renderer;
        this.moveDelay = 0;
        this.stageMessage = '';
        this.stageMessageTimer = 0;
        this.onEncounter = null;
        this.onShop = null;
    }

    update(keys, dt) {
        this.moveDelay -= dt;
        if (this.moveDelay < 0) this.moveDelay = 0;

        if (this.stageMessageTimer > 0) {
            this.stageMessageTimer -= dt;
        }

        if (this.moveDelay <= 0) {
            let dx = 0, dy = 0;
            if (keys['ArrowUp'])    dy = -1;
            else if (keys['ArrowDown'])  dy = 1;
            else if (keys['ArrowLeft'])  dx = -1;
            else if (keys['ArrowRight']) dx = 1;

            if (dx !== 0 || dy !== 0) {
                const resultJson = this.wasm.movePlayer(dx, dy);
                const result = JSON.parse(resultJson);

                if (result.moved) {
                    this.moveDelay = 150;

                    if (result.stageChange) {
                        this.stageMessage = STAGE_NAMES[result.stageChange] || '';
                        this.stageMessageTimer = 2000;
                    }

                    if (result.shopTile) {
                        this.wasm.setScene(SCENE.SHOP);
                    } else if (result.bossEncounter) {
                        if (this.onEncounter) this.onEncounter(null, true);
                    } else if (result.encounter && result.enemies) {
                        if (this.onEncounter) this.onEncounter(result.enemies, false);
                    }
                }
            }
        }

        if (keys['Escape'] || keys['KeyX']) {
            if (this.onMenu) this.onMenu();
        }

        this.render();
    }

    render() {
        const r = this.renderer;
        r.clear(COLOR.BLACK);

        const stage = this.wasm.getCurrentStage();
        const px = this.wasm.getPlayerMapX();
        const py = this.wasm.getPlayerMapY();

        // Camera: center on player
        let camX = px - Math.floor(VIEWPORT_COLS / 2);
        let camY = py - Math.floor(VIEWPORT_ROWS / 2);
        camX = Math.max(0, Math.min(camX, MAP_COLS - VIEWPORT_COLS));
        camY = Math.max(0, Math.min(camY, MAP_ROWS - VIEWPORT_ROWS));

        // Draw tiles
        const hudHeight = 32;
        const tileAreaH = SCREEN_H - hudHeight;
        const visibleRows = Math.floor(tileAreaH / TILE_SIZE);

        for (let ty = 0; ty < visibleRows && ty + camY < MAP_ROWS; ty++) {
            for (let tx = 0; tx < VIEWPORT_COLS && tx + camX < MAP_COLS; tx++) {
                const tileType = this.wasm.getMapTile(stage, tx + camX, ty + camY);
                const color = TILE_COLORS[tileType] || COLOR.BLACK;
                const screenX = tx * TILE_SIZE;
                const screenY = ty * TILE_SIZE;

                r.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE, color);

                // Draw tile details
                this.drawTileDetail(r, tileType, screenX, screenY);
            }
        }

        // Draw player
        const playerScreenX = (px - camX) * TILE_SIZE;
        const playerScreenY = (py - camY) * TILE_SIZE;
        this.drawPlayer(r, playerScreenX, playerScreenY);

        // Draw HUD
        this.drawHUD(r, hudHeight);

        // Stage transition message
        if (this.stageMessageTimer > 0) {
            r.drawWindow(40, 80, 176, 40);
            r.drawText(this.stageMessage, 56, 96, COLOR.YELLOW);
        }
    }

    drawTileDetail(r, tileType, x, y) {
        if (tileType === TILE.TREE) {
            r.fillRect(x + 6, y + 2, 4, 6, '#00A800');
            r.fillRect(x + 4, y + 4, 8, 4, '#00A800');
            r.fillRect(x + 7, y + 8, 2, 6, COLOR.BROWN);
        } else if (tileType === TILE.VILLAGE || tileType === TILE.SHOP_TILE) {
            r.fillRect(x + 3, y + 4, 10, 10, COLOR.BROWN);
            r.fillRect(x + 2, y + 2, 12, 4, COLOR.RED);
            r.fillRect(x + 6, y + 9, 4, 5, COLOR.DARK_BROWN);
        } else if (tileType === TILE.CAVE_ENTRANCE) {
            r.fillRect(x + 3, y + 3, 10, 10, COLOR.BLACK);
            r.fillRect(x + 4, y + 2, 8, 2, COLOR.DARK_BROWN);
        } else if (tileType === TILE.STAIRS_DOWN) {
            for (let i = 0; i < 4; i++) {
                r.fillRect(x + 2 + i * 2, y + 4 + i * 2, 10 - i * 2, 2, COLOR.LIGHT_GRAY);
            }
        } else if (tileType === TILE.STAIRS_UP) {
            for (let i = 0; i < 4; i++) {
                r.fillRect(x + 2 + i * 2, y + 10 - i * 2, 10 - i * 2, 2, COLOR.WHITE);
            }
        } else if (tileType === TILE.BOSS_TILE) {
            r.fillRect(x + 4, y + 2, 8, 8, COLOR.PURPLE);
            r.fillRect(x + 6, y + 4, 4, 4, COLOR.YELLOW);
        } else if (tileType === TILE.WATER) {
            r.fillRect(x + 2, y + 6, 6, 1, '#88BBFF');
            r.fillRect(x + 8, y + 10, 5, 1, '#88BBFF');
        } else if (tileType === TILE.LAVA) {
            r.fillRect(x + 2, y + 5, 5, 2, COLOR.ORANGE);
            r.fillRect(x + 8, y + 9, 4, 2, COLOR.YELLOW);
        } else if (tileType === TILE.MOUNTAIN) {
            r.fillRect(x + 6, y + 2, 4, 4, COLOR.GRAY);
            r.fillRect(x + 4, y + 6, 8, 4, COLOR.BROWN);
            r.fillRect(x + 2, y + 10, 12, 4, COLOR.BROWN);
        }
    }

    drawPlayer(r, x, y) {
        // Body
        r.fillRect(x + 4, y + 2, 8, 4, COLOR.SKIN);
        // Hair
        r.fillRect(x + 4, y + 1, 8, 2, COLOR.BROWN);
        // Eyes
        r.fillRect(x + 5, y + 4, 2, 1, COLOR.BLACK);
        r.fillRect(x + 9, y + 4, 2, 1, COLOR.BLACK);
        // Body armor
        r.fillRect(x + 3, y + 6, 10, 5, COLOR.BLUE);
        // Legs
        r.fillRect(x + 4, y + 11, 3, 4, COLOR.BROWN);
        r.fillRect(x + 9, y + 11, 3, 4, COLOR.BROWN);
        // Sword
        r.fillRect(x + 13, y + 5, 2, 8, COLOR.GRAY);
        r.fillRect(x + 12, y + 4, 4, 2, COLOR.YELLOW);
    }

    drawHUD(r, height) {
        const y = SCREEN_H - height;
        r.fillRect(0, y, SCREEN_W, height, COLOR.BLACK);
        r.strokeRect(0, y, SCREEN_W, height, COLOR.WHITE, 1);

        const statsJson = this.wasm.getPlayerStats();
        const stats = JSON.parse(statsJson);

        r.drawText('HP:' + stats.hp + '/' + stats.maxHp, 8, y + 6, COLOR.WHITE);
        r.drawText('MP:' + stats.mp + '/' + stats.maxMp, 8, y + 18, COLOR.CYAN);
        r.drawText('LV:' + stats.level, 130, y + 6, COLOR.YELLOW);
        r.drawText('G:' + stats.gold, 130, y + 18, COLOR.YELLOW);
        r.drawText(STAGE_NAMES[stats.stage] || '', 200, y + 12, COLOR.GRAY);
    }
}
