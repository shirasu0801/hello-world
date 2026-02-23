import { SCREEN_W, SCREEN_H, COLOR } from './constants.js';
import { BitmapFont } from './font.js';

export class Renderer {
    constructor(canvas) {
        this.displayCanvas = canvas;
        this.displayCtx = canvas.getContext('2d');

        this.offscreen = document.createElement('canvas');
        this.offscreen.width = SCREEN_W;
        this.offscreen.height = SCREEN_H;
        this.ctx = this.offscreen.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.displayCanvas.width = SCREEN_W;
        this.displayCanvas.height = SCREEN_H;
        this.displayCtx.imageSmoothingEnabled = false;

        this.font = new BitmapFont();

        this.shakeOffset = 0;
        this.shakeFrames = 0;
        this.flashFrames = 0;
    }

    clear(color = COLOR.BLACK) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }

    fillRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    }

    strokeRect(x, y, w, h, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w - 1, h - 1);
    }

    drawWindow(x, y, w, h) {
        this.fillRect(x, y, w, h, COLOR.BLACK);
        this.strokeRect(x + 1, y + 1, w - 2, h - 2, COLOR.WHITE, 2);
    }

    drawText(text, x, y, color = COLOR.WHITE, scale = 1) {
        this.font.drawText(this.ctx, text, Math.floor(x), Math.floor(y), color, scale);
    }

    drawPixel(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }

    triggerShake(frames = 6) {
        this.shakeFrames = frames;
    }

    triggerFlash(frames = 4) {
        this.flashFrames = frames;
    }

    present() {
        if (this.shakeFrames > 0) {
            this.shakeOffset = (this.shakeFrames % 2 === 0) ? 2 : -2;
            this.shakeFrames--;
        } else {
            this.shakeOffset = 0;
        }

        this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);

        if (this.flashFrames > 0) {
            this.displayCtx.fillStyle = COLOR.WHITE;
            this.displayCtx.fillRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
            this.flashFrames--;
        } else {
            this.displayCtx.drawImage(
                this.offscreen,
                this.shakeOffset, 0
            );
        }
    }

    getTextWidth(text, scale = 1) {
        return this.font.getTextWidth(text, scale);
    }
}
