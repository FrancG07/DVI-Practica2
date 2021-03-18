// Le asigna un nombre a cada sprite, indicando sus dimensiones
// en el spritesheet y su número de fotogramas
var sprites = {
    ship: { sx: 0, sy: 0, w: 38, h: 43, frames: 1 },
    missile: { sx: 0, sy: 30, w: 2, h: 10, frames: 1 },
    enemy_purple: { sx: 37, sy: 0, w: 42, h: 43, frames: 1 },
    enemy_bee: { sx: 79, sy: 0, w: 37, h: 43, frames: 1 },
    enemy_ship: { sx: 116, sy: 0, w: 42, h: 43, frames: 1 },
    enemy_circle: { sx: 158, sy: 0, w: 32, h: 33, frames: 1 },
    explosion: { sx: 0, sy: 64, w: 64, h: 64, frames: 12 }
};

var level1 = [
    // Start,  End,  Gap, Type,     Override
    [ 0,       4000, 500,'step'],
    [ 6000,   13000, 800,'ltr'],
    [ 12000,  16000, 400,'circle'],
    [ 18200,  20000, 500,'straight', { x: 150 } ],
    [ 18200,  20000, 500,'straight', { x: 100 } ],
    [ 18400,  20000, 500,'straight', { x: 200 } ],
    [ 22000,  25000, 400,'wiggle', { x: 300 }],
    [ 22000,  25000, 400,'wiggle', { x: 200 }]
];

// Especifica lo que se debe pintar al cargar el juego
var startGame = function() {
    Game.setBoard(0,
        new TitleScreen(
            "Alien Invasion",
            "Press fire to start playing",
            playGame
        )
    );
}

var playGame = function() {
    var board = new GameBoard();
    board.add(new PlayerShip());
    board.add(new Level(level1,winGame));
    Game.setBoard(0,board);
};

var winGame = function() {
    Game.setBoard(0,new TitleScreen
        (
            "You win!",
            "Press fire to play again",
            playGame
        )
    );
};

var loseGame = function() {
    Game.setBoard(0,new TitleScreen
        (
            "You lose!",
            "Press fire to play again",
            playGame
        )
    );
};

// Indica que se llame al método de inicialización una vez
// se haya terminado de cargar la página HTML
// y este después de realizar la inicialización llamará a
// startGame
window.addEventListener("load", function() {
    Game.initialize("game",sprites,startGame);
});   