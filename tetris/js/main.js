import { Game } from './game.js';

const canvas = document.getElementById('game');

let game = new Game(canvas);

function handleResize() {
    if (game && game.renderer) {
        game.renderer.resize();
    }
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
});
