// Le asigna un nombre a cada sprite, indicando sus dimensiones
// en el spritesheet y su número de fotogramas
var sprites = {
    blueCar: { sx: 9, sy: 6, w: 89, h: 48, frames: 1 },
    greenCar: { sx: 109, sy: 6, w: 94, h: 48, frames: 1 },
    yellowCar: { sx: 214, sy: 6, w: 94, h: 48, frames: 1 },
    redTruck: { sx: 7, sy: 62, w: 123, h: 46, frames: 1 },
    brownTruck: { sx: 148, sy: 62, w: 199, h: 46, frames: 1 },
    mediumLog: { sx: 10, sy: 123, w: 190, h: 39, frames: 1 },
    largeLog: { sx: 10, sy: 173, w: 246, h: 39, frames: 1 },
    smallLog: { sx: 271, sy: 172, w: 129, h: 40, frames: 1 },
    death: { sx: 212, sy: 128, w: 45, h: 35, frames: 4 },
    lilyPad: { sx: 4, sy: 235, w: 43, h: 38, frames: 1 },
    fly: { sx: 58, sy: 239, w: 31, h: 33, frames: 1 },
    greenSquare: { sx: 95, sy: 225, w: 57, h: 57, frames: 1 },
    blueSquare: { sx: 159, sy: 225, w: 57, h: 57, frames: 1 },
    blackSquare: { sx: 222, sy: 225, w: 57, h: 57, frames: 1 },
    bushSquare: { sx: 285, sy: 225, w: 57, h: 57, frames: 1 },
    lilySquare: { sx: 348, sy: 225, w: 57, h: 57, frames: 1 },
    movingTurtle: { sx: 5, sy: 289, w: 50, h: 45, frames: 9 },
    frog: { sx: 0, sy: 340, w: 40, h: 48, frames: 7 },
    staticTurtle1: { sx: 282, sy: 345, w: 50, h: 41, frames: 1 },
    staticTurtle2: { sx: 335, sy: 344, w: 50, h: 43, frames: 1 },
    logo: { sx: 7, sy: 395, w: 263, h: 162, frames: 1 },
    background: { sx: 421, sy: 0, w: 550, h: 626, frames: 1 }
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

var addObjects = function(){
	var board = new GameBoard();
	
	board.add(new Car('brownTruck',2,'right',5));
	board.add(new Car('redTruck',3,'left',5));
	board.add(new Car('brownTruck',4,'right',5.5));
	board.add(new Car('greenCar',5,'left',3.2));
	board.add(new Car('blueCar',6,'left',3));
	//board.add(new Car('blueCar',6,'left',5));
	
	board.add(new Trunk('mediumLog',8,'right',0,5));
	board.add(new Trunk('mediumLog',8,'right',(Game.width*2/3),5));
	
	board.add(new Turtle(9,'left',0,2));
	board.add(new Turtle(9,'left',(Game.width/3),2));
	board.add(new Turtle(9,'left',(Game.width/3*2),2));
	
	board.add(new Trunk('mediumLog',10,'left',0,3));
	board.add(new Trunk('mediumLog',10,'left',(Game.width*2/3),3));
	//board.add(new Trunk(10,'left', (Game.width*4/3)));
	
	board.add(new Turtle(11,'left',0,1.5	));
	board.add(new Turtle(11,'left',(Game.width/3),1.5));
	board.add(new Turtle(11,'left',(Game.width/3*2),1.5));
	
	board.add(new Trunk('mediumLog',12,'right',0,4));
	board.add(new Trunk('mediumLog',12,'right',(Game.width*2/3),4));
	
	board.add(new Frog());
    //board.add(new Level(level1,winGame));
	
	Game.setBoard(1,board);
}

var playGame = function() {
    var board = new GameBoard();
    board.add(new BackGround());
	
    Game.setBoard(0,board);
	
	addObjects();
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
    Game.initialize("game",sprites,playGame);
});   