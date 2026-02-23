import { SCREEN_W, SCREEN_H, COLOR, SCENE } from './constants.js';
import { ENEMY_COLORS } from './gameData.js';

const BATTLE_STATE = {
    INTRO: 0,
    COMMAND: 1,
    MAGIC_MENU: 2,
    ITEM_MENU: 3,
    TARGET_SELECT: 4,
    PLAYER_ACTION: 5,
    ENEMY_TURN: 6,
    MESSAGE: 7,
    VICTORY: 8,
    DEFEAT: 9,
};

export class BattleUI {
    constructor(wasm, renderer) {
        this.wasm = wasm;
        this.renderer = renderer;
        this.state = BATTLE_STATE.INTRO;
        this.cursor = 0;
        this.subCursor = 0;
        this.enemies = [];
        this.messages = [];
        this.messageTimer = 0;
        this.typingText = '';
        this.typingFull = '';
        this.typingIdx = 0;
        this.typingTimer = 0;
        this.typingSpeed = 30;
        this.actionQueue = [];
        this.currentEnemyTurnIdx = 0;
        this.isBoss = false;
        this.pendingCommand = -1;
        this.pendingParam = -1;
        this.victoryData = null;
        this.introTimer = 0;
        this.onBattleEnd = null;
    }

    startBattle(enemyTypes, isBoss) {
        let typesStr = '';
        if (!isBoss && enemyTypes) {
            typesStr = enemyTypes.map(e => e.type).join(',');
        }
        const resultJson = this.wasm.startBattle(typesStr, isBoss);
        const result = JSON.parse(resultJson);
        this.enemies = result.enemies;
        this.isBoss = result.isBoss;
        this.state = BATTLE_STATE.INTRO;
        this.cursor = 0;
        this.subCursor = 0;
        this.messages = [];
        this.victoryData = null;
        this.introTimer = 0;
        this.currentEnemyTurnIdx = 0;

        let introMsg = '';
        if (this.enemies.length === 1) {
            introMsg = this.enemies[0].name + ' appeared!';
        } else {
            introMsg = this.enemies[0].name + ' x' + this.enemies.length + ' appeared!';
        }
        this.setTypingMessage(introMsg);
    }

    setTypingMessage(text, callback) {
        this.typingFull = text;
        this.typingText = '';
        this.typingIdx = 0;
        this.typingTimer = 0;
        this.typingCallback = callback || null;
    }

    update(keys, dt) {
        // Update typing
        if (this.typingIdx < this.typingFull.length) {
            this.typingTimer += dt;
            while (this.typingTimer >= this.typingSpeed && this.typingIdx < this.typingFull.length) {
                this.typingTimer -= this.typingSpeed;
                this.typingIdx++;
                this.typingText = this.typingFull.substring(0, this.typingIdx);
            }
        }

        const typingDone = this.typingIdx >= this.typingFull.length;

        switch (this.state) {
            case BATTLE_STATE.INTRO:
                this.introTimer += dt;
                if (typingDone && (this.introTimer > 1500 || keys['Enter'] || keys['KeyZ'])) {
                    this.state = BATTLE_STATE.COMMAND;
                    this.cursor = 0;
                    this.typingFull = '';
                    this.typingText = '';
                }
                break;

            case BATTLE_STATE.COMMAND:
                if (keys['ArrowUp']) this.cursor = (this.cursor + 3) % 4;
                else if (keys['ArrowDown']) this.cursor = (this.cursor + 1) % 4;

                if (keys['Enter'] || keys['KeyZ']) {
                    this.handleCommandSelect();
                }
                break;

            case BATTLE_STATE.MAGIC_MENU:
                if (keys['ArrowUp']) this.subCursor = (this.subCursor + 1) % 2;
                else if (keys['ArrowDown']) this.subCursor = (this.subCursor + 1) % 2;
                if (keys['Escape'] || keys['KeyX']) {
                    this.state = BATTLE_STATE.COMMAND;
                }
                if (keys['Enter'] || keys['KeyZ']) {
                    this.handleMagicSelect();
                }
                break;

            case BATTLE_STATE.ITEM_MENU:
                {
                    const inv = JSON.parse(this.wasm.getPlayerInventory());
                    const consumables = inv.filter(i => i.type === 2);
                    if (consumables.length === 0) {
                        this.setTypingMessage('No items!');
                        this.state = BATTLE_STATE.MESSAGE;
                        this.afterMessage = () => { this.state = BATTLE_STATE.COMMAND; };
                        break;
                    }
                    if (keys['ArrowUp']) this.subCursor = Math.max(0, this.subCursor - 1);
                    else if (keys['ArrowDown']) this.subCursor = Math.min(consumables.length - 1, this.subCursor + 1);
                    if (keys['Escape'] || keys['KeyX']) {
                        this.state = BATTLE_STATE.COMMAND;
                    }
                    if (keys['Enter'] || keys['KeyZ']) {
                        const item = consumables[this.subCursor];
                        this.executeAction(3, item.itemId);
                    }
                }
                break;

            case BATTLE_STATE.TARGET_SELECT:
                {
                    const battleState = JSON.parse(this.wasm.getBattleState());
                    const alive = battleState.enemies.filter(e => e.alive);
                    if (alive.length <= 1) {
                        this.executeAction(this.pendingCommand, 0);
                    } else {
                        if (keys['ArrowLeft']) this.subCursor = Math.max(0, this.subCursor - 1);
                        else if (keys['ArrowRight']) this.subCursor = Math.min(alive.length - 1, this.subCursor + 1);
                        if (keys['Escape'] || keys['KeyX']) {
                            this.state = BATTLE_STATE.COMMAND;
                        }
                        if (keys['Enter'] || keys['KeyZ']) {
                            // Find actual index of the alive enemy
                            let realIdx = -1;
                            let count = 0;
                            for (let i = 0; i < battleState.enemies.length; i++) {
                                if (battleState.enemies[i].alive) {
                                    if (count === this.subCursor) { realIdx = i; break; }
                                    count++;
                                }
                            }
                            this.executeAction(this.pendingCommand, realIdx >= 0 ? realIdx : 0);
                        }
                    }
                }
                break;

            case BATTLE_STATE.PLAYER_ACTION:
            case BATTLE_STATE.ENEMY_TURN:
                if (typingDone && (keys['Enter'] || keys['KeyZ'])) {
                    this.processNextAction();
                }
                break;

            case BATTLE_STATE.MESSAGE:
                if (typingDone && (keys['Enter'] || keys['KeyZ'])) {
                    if (this.afterMessage) {
                        this.afterMessage();
                        this.afterMessage = null;
                    }
                }
                break;

            case BATTLE_STATE.VICTORY:
                if (typingDone && (keys['Enter'] || keys['KeyZ'])) {
                    if (this.victoryData && this.victoryData.result === 'gameClear') {
                        this.wasm.setScene(SCENE.GAME_CLEAR);
                    } else {
                        this.wasm.setScene(SCENE.FIELD);
                    }
                    if (this.onBattleEnd) this.onBattleEnd();
                }
                break;

            case BATTLE_STATE.DEFEAT:
                if (typingDone && (keys['Enter'] || keys['KeyZ'])) {
                    this.wasm.setScene(SCENE.GAME_OVER);
                    if (this.onBattleEnd) this.onBattleEnd();
                }
                break;
        }

        this.render();
    }

    handleCommandSelect() {
        switch (this.cursor) {
            case 0: // Attack
                this.pendingCommand = 0;
                const bs = JSON.parse(this.wasm.getBattleState());
                const aliveCount = bs.enemies.filter(e => e.alive).length;
                if (aliveCount > 1) {
                    this.state = BATTLE_STATE.TARGET_SELECT;
                    this.subCursor = 0;
                } else {
                    this.executeAction(0, 0);
                }
                break;
            case 1: // Magic
                this.state = BATTLE_STATE.MAGIC_MENU;
                this.subCursor = 0;
                break;
            case 2: // Item
                this.state = BATTLE_STATE.ITEM_MENU;
                this.subCursor = 0;
                break;
            case 3: // Run
                this.executeAction(4, 0);
                break;
        }
    }

    handleMagicSelect() {
        if (this.subCursor === 0) {
            // Attack magic
            this.pendingCommand = 1;
            const bs = JSON.parse(this.wasm.getBattleState());
            const aliveCount = bs.enemies.filter(e => e.alive).length;
            if (aliveCount > 1) {
                this.state = BATTLE_STATE.TARGET_SELECT;
                this.subCursor = 0;
            } else {
                this.executeAction(1, 0);
            }
        } else {
            // Heal magic
            this.executeAction(2, 0);
        }
    }

    executeAction(command, param) {
        const resultJson = this.wasm.executeBattleCommand(command, param);
        const result = JSON.parse(resultJson);

        this.state = BATTLE_STATE.PLAYER_ACTION;
        let msg = '';

        switch (result.event) {
            case 'playerAttack':
                msg = 'You attack ' + result.target + '! ' + result.damage + ' damage!';
                this.renderer.triggerFlash(3);
                break;
            case 'playerMagicAttack':
                msg = 'Magic blast! ' + result.target + ' takes ' + result.damage + ' damage!';
                this.renderer.triggerFlash(3);
                break;
            case 'playerHeal':
                msg = 'Healed ' + result.healAmount + ' HP!';
                break;
            case 'useItem':
                if (result.healAmount) msg = 'Used ' + result.itemName + '. HP +' + result.healAmount + '!';
                else if (result.mpRestore) msg = 'Used ' + result.itemName + '. MP +' + result.mpRestore + '!';
                else if (result.curedStatus) msg = 'Used ' + result.itemName + '. Status cured!';
                break;
            case 'noMp':
            case 'noItem':
            case 'cantUse':
                msg = result.message;
                this.setTypingMessage(msg);
                this.state = BATTLE_STATE.MESSAGE;
                this.afterMessage = () => { this.state = BATTLE_STATE.COMMAND; };
                return;
            case 'runSuccess':
                msg = result.message;
                this.setTypingMessage(msg);
                this.state = BATTLE_STATE.MESSAGE;
                this.afterMessage = () => {
                    this.wasm.setScene(SCENE.FIELD);
                    if (this.onBattleEnd) this.onBattleEnd();
                };
                return;
            case 'runFail':
                msg = result.message;
                this.setTypingMessage(msg);
                this.actionQueue = [];
                this.currentEnemyTurnIdx = 0;
                this.state = BATTLE_STATE.MESSAGE;
                this.afterMessage = () => { this.startEnemyPhase(); };
                return;
            case 'cantRun':
                msg = result.message;
                this.setTypingMessage(msg);
                this.state = BATTLE_STATE.MESSAGE;
                this.afterMessage = () => { this.state = BATTLE_STATE.COMMAND; };
                return;
        }

        this.setTypingMessage(msg);

        // Check if killed enemy - then check battle end
        if (result.killed) {
            this.afterPlayerAction = () => {
                this.setTypingMessage(result.target + ' defeated!');
                this.state = BATTLE_STATE.MESSAGE;
                this.afterMessage = () => { this.checkEnd(); };
            };
        } else {
            this.afterPlayerAction = () => { this.checkEnd(); };
        }
    }

    processNextAction() {
        if (this.afterPlayerAction) {
            const fn = this.afterPlayerAction;
            this.afterPlayerAction = null;
            fn();
            return;
        }

        if (this.state === BATTLE_STATE.ENEMY_TURN) {
            this.continueEnemyPhase();
        }
    }

    checkEnd() {
        const endJson = this.wasm.checkBattleEnd();
        const end = JSON.parse(endJson);

        if (end.ended) {
            if (end.result === 'victory' || end.result === 'gameClear') {
                this.victoryData = end;
                let msg = 'Victory! +' + end.expGained + ' EXP +' + end.goldGained + ' G';
                if (end.levelUp) {
                    msg += ' Level Up! LV ' + end.newLevel + '!';
                }
                this.setTypingMessage(msg);
                this.state = BATTLE_STATE.VICTORY;
            } else if (end.result === 'defeat') {
                this.setTypingMessage('You have been defeated...');
                this.state = BATTLE_STATE.DEFEAT;
            }
        } else {
            this.startEnemyPhase();
        }
    }

    startEnemyPhase() {
        this.currentEnemyTurnIdx = 0;
        this.state = BATTLE_STATE.ENEMY_TURN;
        this.continueEnemyPhase();
    }

    continueEnemyPhase() {
        const bs = JSON.parse(this.wasm.getBattleState());

        // Find next alive enemy
        while (this.currentEnemyTurnIdx < bs.enemies.length &&
               !bs.enemies[this.currentEnemyTurnIdx].alive) {
            this.currentEnemyTurnIdx++;
        }

        if (this.currentEnemyTurnIdx >= bs.enemies.length) {
            // All enemies acted, check end then back to command
            const endJson = this.wasm.checkBattleEnd();
            const end = JSON.parse(endJson);
            if (end.ended && end.result === 'defeat') {
                this.setTypingMessage('You have been defeated...');
                this.state = BATTLE_STATE.DEFEAT;
            } else {
                this.state = BATTLE_STATE.COMMAND;
                this.cursor = 0;
                this.typingFull = '';
                this.typingText = '';
            }
            return;
        }

        const resultJson = this.wasm.executeEnemyTurn(this.currentEnemyTurnIdx);
        const result = JSON.parse(resultJson);
        this.currentEnemyTurnIdx++;

        if (result.event === 'skip') {
            this.continueEnemyPhase();
            return;
        }

        let msg = '';
        switch (result.event) {
            case 'enemyAttack':
                msg = result.enemy + ' attacks! ' + result.damage + ' damage!';
                this.renderer.triggerShake(6);
                break;
            case 'enemyAoe':
                msg = result.enemy + ' uses special attack! ' + result.damage + ' damage!';
                this.renderer.triggerShake(8);
                break;
            case 'enemyHeal':
                msg = result.enemy + ' heals ' + result.healAmount + ' HP!';
                break;
            case 'enemyStatus':
                msg = result.enemy + ' curses you! ' + result.damage + ' damage! ' + result.message;
                this.renderer.triggerShake(6);
                break;
        }

        this.setTypingMessage(msg);

        // After this enemy acts, check if player died, then continue
        this.afterPlayerAction = () => {
            const endJson2 = this.wasm.checkBattleEnd();
            const end2 = JSON.parse(endJson2);
            if (end2.ended && end2.result === 'defeat') {
                this.setTypingMessage('You have been defeated...');
                this.state = BATTLE_STATE.DEFEAT;
            } else {
                this.continueEnemyPhase();
            }
        };
    }

    render() {
        const r = this.renderer;
        r.clear(COLOR.BLACK);

        const bs = JSON.parse(this.wasm.getBattleState());

        // Draw enemies (top half)
        this.drawEnemies(r, bs);

        // Draw dialog window (bottom half)
        const dialogY = 140;
        r.drawWindow(4, dialogY, SCREEN_W - 8, SCREEN_H - dialogY - 4);

        // Draw based on state
        switch (this.state) {
            case BATTLE_STATE.INTRO:
            case BATTLE_STATE.PLAYER_ACTION:
            case BATTLE_STATE.ENEMY_TURN:
            case BATTLE_STATE.MESSAGE:
            case BATTLE_STATE.VICTORY:
            case BATTLE_STATE.DEFEAT:
                r.drawText(this.typingText, 16, dialogY + 12, COLOR.WHITE);
                break;

            case BATTLE_STATE.COMMAND:
                this.drawCommandMenu(r, dialogY);
                break;

            case BATTLE_STATE.MAGIC_MENU:
                this.drawMagicMenu(r, dialogY);
                break;

            case BATTLE_STATE.ITEM_MENU:
                this.drawItemMenu(r, dialogY);
                break;

            case BATTLE_STATE.TARGET_SELECT:
                this.drawTargetSelect(r, bs, dialogY);
                break;
        }

        // Draw HP/MP bar
        this.drawBattleStatus(r, bs);
    }

    drawEnemies(r, bs) {
        const count = bs.enemies.length;
        const spacing = SCREEN_W / (count + 1);

        for (let i = 0; i < count; i++) {
            const enemy = bs.enemies[i];
            if (!enemy.alive) continue;

            const cx = spacing * (i + 1);
            const cy = 60;
            const color = ENEMY_COLORS[enemy.name] || COLOR.WHITE;

            if (enemy.isBoss) {
                // Larger boss sprite
                this.drawBossSprite(r, cx - 24, cy - 30, color, enemy.name);
            } else {
                this.drawEnemySprite(r, cx - 12, cy - 12, color, enemy.name);
            }

            // Name
            const nameW = r.getTextWidth(enemy.name);
            r.drawText(enemy.name, cx - nameW / 2, cy + 30, COLOR.WHITE);

            // HP bar
            const barW = 40;
            const hpRatio = enemy.hp / enemy.maxHp;
            r.fillRect(cx - barW / 2, cy + 40, barW, 4, COLOR.DARK_GRAY);
            r.fillRect(cx - barW / 2, cy + 40, Math.floor(barW * hpRatio), 4,
                hpRatio > 0.5 ? COLOR.GREEN : hpRatio > 0.25 ? COLOR.YELLOW : COLOR.RED);
        }
    }

    drawEnemySprite(r, x, y, color, name) {
        // Simple pixel art enemy
        if (name.includes('Slime')) {
            r.fillRect(x + 4, y + 8, 16, 12, color);
            r.fillRect(x + 6, y + 4, 12, 6, color);
            r.fillRect(x + 8, y + 2, 8, 4, color);
            r.fillRect(x + 7, y + 10, 3, 3, COLOR.WHITE);
            r.fillRect(x + 14, y + 10, 3, 3, COLOR.WHITE);
            r.fillRect(x + 8, y + 11, 2, 2, COLOR.BLACK);
            r.fillRect(x + 15, y + 11, 2, 2, COLOR.BLACK);
        } else if (name.includes('Bat')) {
            r.fillRect(x + 8, y + 6, 8, 8, color);
            r.fillRect(x + 2, y + 4, 6, 8, color);
            r.fillRect(x + 16, y + 4, 6, 8, color);
            r.fillRect(x + 0, y + 6, 4, 4, color);
            r.fillRect(x + 20, y + 6, 4, 4, color);
            r.fillRect(x + 10, y + 8, 2, 2, COLOR.RED);
            r.fillRect(x + 14, y + 8, 2, 2, COLOR.RED);
        } else {
            // Generic enemy shape
            r.fillRect(x + 6, y + 2, 12, 6, color);
            r.fillRect(x + 4, y + 8, 16, 10, color);
            r.fillRect(x + 6, y + 18, 4, 4, color);
            r.fillRect(x + 14, y + 18, 4, 4, color);
            r.fillRect(x + 8, y + 4, 3, 3, COLOR.WHITE);
            r.fillRect(x + 13, y + 4, 3, 3, COLOR.WHITE);
            r.fillRect(x + 9, y + 5, 2, 2, COLOR.BLACK);
            r.fillRect(x + 14, y + 5, 2, 2, COLOR.BLACK);
        }
    }

    drawBossSprite(r, x, y, color, name) {
        // Larger boss sprite
        r.fillRect(x + 10, y + 2, 28, 12, color);
        r.fillRect(x + 6, y + 14, 36, 20, color);
        r.fillRect(x + 12, y + 34, 8, 8, color);
        r.fillRect(x + 28, y + 34, 8, 8, color);
        // Eyes
        r.fillRect(x + 14, y + 6, 6, 6, COLOR.WHITE);
        r.fillRect(x + 28, y + 6, 6, 6, COLOR.WHITE);
        r.fillRect(x + 16, y + 8, 4, 4, COLOR.RED);
        r.fillRect(x + 30, y + 8, 4, 4, COLOR.RED);
        // Horns
        r.fillRect(x + 8, y - 4, 4, 8, COLOR.YELLOW);
        r.fillRect(x + 36, y - 4, 4, 8, COLOR.YELLOW);
        // Mouth
        r.fillRect(x + 18, y + 16, 12, 2, COLOR.BLACK);
        r.fillRect(x + 20, y + 18, 2, 2, COLOR.WHITE);
        r.fillRect(x + 26, y + 18, 2, 2, COLOR.WHITE);
    }

    drawCommandMenu(r, dialogY) {
        const commands = ['Attack', 'Magic', 'Item', 'Run'];
        for (let i = 0; i < 4; i++) {
            const x = 32;
            const y = dialogY + 12 + i * 18;
            if (i === this.cursor) {
                r.drawText('>', x - 12, y, COLOR.WHITE);
            }
            r.drawText(commands[i], x, y, COLOR.WHITE);
        }

        // Show HP/MP on right side
        const stats = JSON.parse(this.wasm.getPlayerStats());
        r.drawText('HP:' + stats.hp + '/' + stats.maxHp, 140, dialogY + 12, COLOR.WHITE);
        r.drawText('MP:' + stats.mp + '/' + stats.maxMp, 140, dialogY + 30, COLOR.CYAN);
    }

    drawMagicMenu(r, dialogY) {
        const stats = JSON.parse(this.wasm.getPlayerStats());
        const spells = [
            { name: 'Attack Magic', cost: 10 },
            { name: 'Heal Magic', cost: 15 }
        ];

        r.drawText('MAGIC', 16, dialogY + 8, COLOR.YELLOW);

        for (let i = 0; i < 2; i++) {
            const y = dialogY + 26 + i * 18;
            if (i === this.subCursor) {
                r.drawText('>', 20, y, COLOR.WHITE);
            }
            const canCast = stats.mp >= spells[i].cost;
            r.drawText(spells[i].name, 32, y, canCast ? COLOR.WHITE : COLOR.DARK_GRAY);
            r.drawText('MP:' + spells[i].cost, 170, y, canCast ? COLOR.CYAN : COLOR.DARK_GRAY);
        }

        r.drawText('MP:' + stats.mp + '/' + stats.maxMp, 140, dialogY + 8, COLOR.CYAN);
    }

    drawItemMenu(r, dialogY) {
        const inv = JSON.parse(this.wasm.getPlayerInventory());
        const consumables = inv.filter(i => i.type === 2);

        r.drawText('ITEMS', 16, dialogY + 8, COLOR.YELLOW);

        if (consumables.length === 0) {
            r.drawText('No items', 32, dialogY + 26, COLOR.DARK_GRAY);
        } else {
            for (let i = 0; i < consumables.length; i++) {
                const y = dialogY + 26 + i * 14;
                if (i === this.subCursor) {
                    r.drawText('>', 20, y, COLOR.WHITE);
                }
                r.drawText(consumables[i].name, 32, y, COLOR.WHITE);
                r.drawText('x' + consumables[i].quantity, 180, y, COLOR.GRAY);
            }
        }
    }

    drawTargetSelect(r, bs, dialogY) {
        r.drawText('Select target', 16, dialogY + 12, COLOR.YELLOW);

        const alive = bs.enemies.filter(e => e.alive);
        for (let i = 0; i < alive.length; i++) {
            const y = dialogY + 30 + i * 18;
            if (i === this.subCursor) {
                r.drawText('>', 20, y, COLOR.WHITE);
            }
            r.drawText(alive[i].name, 32, y, COLOR.WHITE);
        }
    }

    drawBattleStatus(r, bs) {
        const y = 126;
        r.fillRect(0, y, SCREEN_W, 14, COLOR.BLACK);
        r.fillRect(0, y, SCREEN_W, 1, COLOR.WHITE);

        r.drawText('HP:' + bs.playerHp + '/' + bs.playerMaxHp, 8, y + 3,
            bs.playerHp > bs.playerMaxHp * 0.3 ? COLOR.WHITE : COLOR.RED);
        r.drawText('MP:' + bs.playerMp + '/' + bs.playerMaxMp, 140, y + 3, COLOR.CYAN);
    }
}
