export class InputHandler {
    constructor() {
        this.keys = {};
        this.justPressed = {};

        window.addEventListener('keydown', (e) => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape','KeyZ','KeyX'].includes(e.code)) {
                e.preventDefault();
                if (!this.keys[e.code]) {
                    this.justPressed[e.code] = true;
                }
                this.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    isPressed(code) {
        return !!this.justPressed[code];
    }

    isHeld(code) {
        return !!this.keys[code];
    }

    consume() {
        const pressed = { ...this.justPressed };
        this.justPressed = {};
        return pressed;
    }

    get up() { return this.isPressed('ArrowUp'); }
    get down() { return this.isPressed('ArrowDown'); }
    get left() { return this.isPressed('ArrowLeft'); }
    get right() { return this.isPressed('ArrowRight'); }
    get confirm() { return this.isPressed('Enter') || this.isPressed('KeyZ'); }
    get cancel() { return this.isPressed('Escape') || this.isPressed('KeyX'); }
}
