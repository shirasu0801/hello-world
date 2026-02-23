import { SCREEN_W, SCREEN_H, COLOR, SCENE } from './constants.js';

export class TitleScreen {
    constructor(wasm, renderer) {
        this.wasm = wasm;
        this.renderer = renderer;
        this.blinkTimer = 0;
        this.showText = true;
    }

    update(keys, dt) {
        this.blinkTimer += dt;
        if (this.blinkTimer > 500) {
            this.blinkTimer = 0;
            this.showText = !this.showText;
        }

        if (keys['Enter'] || keys['KeyZ']) {
            this.wasm.startNewGame();
        }

        this.render();
    }

    render() {
        const r = this.renderer;
        r.clear(COLOR.BLACK);

        r.drawText('LEGEND OF THE', 70, 60, COLOR.YELLOW, 2);
        r.drawText('HELLO WORLD', 82, 90, COLOR.YELLOW, 2);

        this.drawSword(128, 130);

        if (this.showText) {
            r.drawText('PRESS ENTER TO START', 48, 190, COLOR.WHITE);
        }

        r.drawText('(C) 2026', 100, 220, COLOR.GRAY);
    }

    drawSword(cx, cy) {
        const r = this.renderer;
        r.fillRect(cx - 1, cy - 15, 3, 20, COLOR.GRAY);
        r.fillRect(cx - 6, cy + 3, 13, 3, COLOR.BROWN);
        r.fillRect(cx - 1, cy + 6, 3, 6, COLOR.BROWN);
        r.fillRect(cx, cy - 16, 1, 2, COLOR.WHITE);
    }
}

export class GameOverScreen {
    constructor(wasm, renderer) {
        this.wasm = wasm;
        this.renderer = renderer;
        this.blinkTimer = 0;
        this.showText = true;
    }

    update(keys, dt) {
        this.blinkTimer += dt;
        if (this.blinkTimer > 500) {
            this.blinkTimer = 0;
            this.showText = !this.showText;
        }

        if (keys['Enter'] || keys['KeyZ']) {
            this.wasm.setScene(SCENE.TITLE);
        }

        this.render();
    }

    render() {
        const r = this.renderer;
        r.clear(COLOR.BLACK);

        r.drawText('GAME OVER', 88, 100, COLOR.RED, 2);

        if (this.showText) {
            r.drawText('PRESS ENTER', 88, 160, COLOR.WHITE);
        }
    }
}

export class GameClearScreen {
    constructor(wasm, renderer) {
        this.wasm = wasm;
        this.renderer = renderer;
        this.timer = 0;
        this.phase = 0;
        this.blinkTimer = 0;
        this.showText = true;
    }

    update(keys, dt) {
        this.timer += dt;
        if (this.phase === 0 && this.timer > 3000) {
            this.phase = 1;
        }

        if (this.phase === 1) {
            this.blinkTimer += dt;
            if (this.blinkTimer > 500) {
                this.blinkTimer = 0;
                this.showText = !this.showText;
            }
            if (keys['Enter'] || keys['KeyZ']) {
                this.timer = 0;
                this.phase = 0;
                this.wasm.setScene(SCENE.TITLE);
            }
        }

        this.render();
    }

    render() {
        const r = this.renderer;
        r.clear(COLOR.BLACK);

        r.drawText('The Demon Lord', 60, 50, COLOR.YELLOW);
        r.drawText('has been defeated!', 48, 66, COLOR.YELLOW);
        r.drawText('Peace returns', 64, 100, COLOR.WHITE);
        r.drawText('to the world.', 64, 116, COLOR.WHITE);

        if (this.phase >= 1) {
            r.drawText('THE END', 98, 160, COLOR.CYAN, 2);
            if (this.showText) {
                r.drawText('PRESS ENTER', 88, 210, COLOR.GRAY);
            }
        }
    }
}
