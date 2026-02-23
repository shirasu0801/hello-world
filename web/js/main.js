import { SCENE, SCREEN_W, SCREEN_H } from './constants.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { TitleScreen, GameOverScreen, GameClearScreen } from './titleScreen.js';
import { MapEngine } from './mapEngine.js';
import { BattleUI } from './battleUI.js';
import { ShopUI } from './shopUI.js';
import { MenuUI } from './menuUI.js';

let wasm = null;
let renderer, input;
let titleScreen, gameOverScreen, gameClearScreen;
let mapEngine, battleUI, shopUI, menuUI;

async function init() {
    const canvas = document.getElementById('game-canvas');

    const createModule = (await import('../wasm/game.js')).default;
    wasm = await createModule();
    wasm.initGame();
    console.log('WASM initialized');

    renderer = new Renderer(canvas);
    input = new InputHandler();

    titleScreen = new TitleScreen(wasm, renderer);
    gameOverScreen = new GameOverScreen(wasm, renderer);
    gameClearScreen = new GameClearScreen(wasm, renderer);
    mapEngine = new MapEngine(wasm, renderer);
    battleUI = new BattleUI(wasm, renderer);
    shopUI = new ShopUI(wasm, renderer);
    menuUI = new MenuUI(wasm, renderer);

    mapEngine.onEncounter = (enemies, isBoss) => {
        battleUI.startBattle(enemies, isBoss);
    };

    battleUI.onBattleEnd = () => {};

    mapEngine.onMenu = () => {
        menuUI.open();
    };

    let lastTime = 0;
    function gameLoop(timestamp) {
        const dt = timestamp - lastTime;
        lastTime = timestamp;

        const keys = input.consume();
        const scene = wasm.getCurrentScene();

        switch (scene) {
            case SCENE.TITLE:
                titleScreen.update(keys, dt);
                break;
            case SCENE.FIELD:
                if (menuUI.isOpen) {
                    menuUI.update(keys, dt);
                    // Render field first, then menu overlay
                    mapEngine.render();
                    menuUI.render(renderer);
                } else {
                    mapEngine.update(keys, dt);
                }
                break;
            case SCENE.BATTLE:
                battleUI.update(keys, dt);
                break;
            case SCENE.SHOP:
                shopUI.update(keys, dt);
                break;
            case SCENE.GAME_OVER:
                gameOverScreen.update(keys, dt);
                break;
            case SCENE.GAME_CLEAR:
                gameClearScreen.update(keys, dt);
                break;
        }

        renderer.present();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

init().catch(err => console.error('Init failed:', err));
