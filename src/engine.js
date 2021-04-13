///////////////////////////////////////////////
// SpriteSheet del juego, encargado de
// cargar los sprites y de dibujarlos.
///////////////////////////////////////////////
var SpriteSheet = new function() {
    this.map = { };
    this.load = function(spriteData, callback) {
        this.map = spriteData;
        this.image = new Image();
        this.image.onload = callback;
        this.image.src = 'img/sprites.png';
    };
    this.draw = function(ctx,sprite,x,y,frame) {
        var s = this.map[sprite];
        if(!frame) frame = 0;
        ctx.drawImage(this.image,
            s.sx + frame * s.w,
            s.sy,
            s.w, s.h,
            x, y,
            s.w, s.h
        );
    };
}

///////////////////////////////////////////////
// Canvas del juego
///////////////////////////////////////////////
var canvas = document.getElementById('game');
var ctx = canvas.getContext && canvas.getContext('2d');
if(!ctx) {
    // No 2d context available, let the user know
    alert('Please upgrade your browser');
} else {
    startGame();
}
function startGame() {
    
}

///////////////////////////////////////////////
// Objeto Game, encargado de controlar las
// teclas pulsadas, el bucle del juego, etc
///////////////////////////////////////////////
var Game = new function() {
    // Le asignamos un nombre lógico a cada tecla que nos interesa
    var KEY_CODES = { 37:'left', 38 :'up', 39:'right', 40:'down', 13:'enter' };
    this.keys = {};

    var boards = [];

    // Inicialización del juego
    // se obtiene el canvas, se cargan los recursos y se llama a callback
    this.initialize = function(canvasElementId, sprite_data, callback) {
        this.canvas = document.getElementById(canvasElementId)
        this.width = this.canvas.width;
        this.height= this.canvas.height;
        this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
        if(!this.ctx) {
            return alert("Please upgrade your browser to play"); 
        }
        this.setupInput();
        this.loop();
        SpriteSheet.load(sprite_data,callback);
    };

    this.setupInput = function(){
        window.addEventListener('keydown',function(e) {
            if(KEY_CODES[e.keyCode]) {
                Game.keys[KEY_CODES[e.keyCode]] = true;
                e.preventDefault();
            }
        }, false);

        window.addEventListener('keyup',function(e) {
            if(KEY_CODES[e.keyCode]) {
                Game.keys[KEY_CODES[e.keyCode]] = false;
                e.preventDefault();
            }
        }, false);            
    }

    this.loop = function(){
        var dt = 30 / 1000;

        // Cada pasada borramos el canvas
        /*Game.ctx.fillStyle = "#000";
        Game.ctx.fillRect(0, 0, Game.width, Game.height);*/
        
        // Actualizamos y dibujamos todas las entidades
        for (var i = 0, len = boards.length; i<len; i++){
            if(boards[i]){
                boards[i].step(dt);
                boards[i].draw(Game.ctx);
            }
        }

        setTimeout(Game.loop, 30);
    }

    this.setBoard = function(num, board) { boards[num] = board;}
	
	this.closeBoard = function(num) { boards[num].changeEnable();}
}

///////////////////////////////////////////////
// Objeto TitleScreen, encargado de mostrar
// el menú principal y los menús de victoria
// y/o derrota
///////////////////////////////////////////////
var TitleScreen = function TitleScreen(title,subtitle,callback) {
    var up = false;
    this.step = function(dt) {
        if( !Game.keys['enter'] ) up = true;
        if( up && Game.keys['enter'] && callback ) callback();
    };

    this.draw = function(ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.font = "bold 40px bangers";
        ctx.fillText(title,Game.width/2,Game.height/2);
        ctx.font = "bold 20px bangers";
        ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
    };
};

///////////////////////////////////////////////
// Objeto GameBoard que controla los elementos
// que hay en el juego y sus interacciones
///////////////////////////////////////////////
var GameBoard = function() {
    var board = this;
	var enable = true;
    // The current list of objects
    this.objects = [];
    this.cnt = {};

    // Add a new object to the object list
    this.add = function(obj) {
        obj.board=this;
        this.objects.push(obj);
        this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
        return obj;
    };

	// añade un nuevo objecto antes del último
    this.addBeforeLast = function(obj){
        obj.board = this;
        this.objects.splice(this.objects.length - 2, 0, obj);
        this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
        return obj;
    }

    // Reset the list of removed objects
    this.resetRemoved = function() { this.removed = []; };

    // Mark an object for removal
    this.remove = function(obj) {
        var idx = this.removed.indexOf(obj);
        if(idx == -1) {
            this.removed.push(obj);
            return true;
        } else {
            return false;
        }
    }

    // Removed an objects marked for removal from the list
    this.finalizeRemoved = function() {
        for(var i=0,len=this.removed.length;i<len;i++) {
            var idx = this.objects.indexOf(this.removed[i]);
            if(idx != -1) {
                this.cnt[this.removed[i].type]--;
                this.objects.splice(idx,1);
            }
        }
    };

    // Call the same method on all current objects
    this.iterate = function(funcName) {
        var args = Array.prototype.slice.call(arguments,1);
        for(var i=0,len=this.objects.length; i < len; i++) {
            var obj = this.objects[i];
            obj[funcName].apply(obj,args);
        }
    };

    // Find the first object for which func is true
    this.detect = function(func) {
        for(var i = 0,val=null, len=this.objects.length; i < len; i++) {
            if(func.call(this.objects[i])) return this.objects[i];
        }
        return false;
    }; 

    // Call step on all objects and them delete
    // any object that have been marked for removal
    this.step = function(dt) {
		// se realizan los pasos si el Board está activo
		if(enable){
			this.resetRemoved();
			this.iterate('step',dt);
			this.finalizeRemoved();
		}
    };

    // Draw all the objects
    this.draw = function(ctx) {
		// se realizan los dibujar si el Board está activo
		if(enable){
			this.iterate('draw',ctx);
		}
    };

    // Check if two boundboxes are overlaping
    this.overlap = function(o1,o2) {
        return !((o1.y+o1.h-1 < o2.y) || (o1.y > o2.y+o2.h-1) ||
        (o1.x+o1.w-1 < o2.x) || (o1.x > o2.x+o2.w-1));
    };

    // Check if two game objects are colliding
    this.collide = function(obj,type) {
        return this.detect(function() {
            if(obj != this) {
                var col = (!type || this.type & type) && board.overlap(obj,this);
                return col ? this : false;
            }
        });
    };
	
	// cambia el estado del Board
	this.changeEnable = function(){
		enable = !enable;
	}
}

///////////////////////////////////////////////
// Objeto Sprite, prototipo encargado de las
// funciones generales de los objetos del juego
///////////////////////////////////////////////
var Sprite = function() {};
var OBJECT_PLAYER = 1,
    OBJECT_ENEMY = 2,
    OBJECT_PLATFORM = 4;

Sprite.prototype.setup = function(sprite,props) {
    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;
    this.w = SpriteSheet.map[sprite].w;
    this.h = SpriteSheet.map[sprite].h;
}

Sprite.prototype.merge = function(props) {
    if(props) {
        for (var prop in props) {
            this[prop] = props[prop];
        }
    }
}

Sprite.prototype.draw = function(ctx) {
	ctx.save();
	
	ctx.translate(this.x+this.w/2, this.y+this.h/2);
	ctx.rotate(this.rotation * Math.PI /180);
	ctx.translate(-(this.x+this.w/2), -(this.y+this.h/2));
	
    SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
	ctx.restore();
}

Sprite.prototype.hit = function(damage) {
    this.board.remove(this);
}

///////////////////////////////////////////////
// Objeto Background que dibuja el fondo del
// juego
///////////////////////////////////////////////
var BackGround = function(){
    this.x = 0;
    this.y = 0;
    this.setup('background', {});
}

BackGround.prototype = new Sprite();
BackGround.prototype.step = function(ctx) { }

///////////////////////////////////////////////
// Objeto Logo que dibuja el fondo del
// juego
///////////////////////////////////////////////
var Logo = function(){
	this.setup('logo', {});
    this.x = Game.width/2 - this.w/2;
    this.y = Game.height/2 - this.h*1.3;
}

Logo.prototype = new Sprite();
Logo.prototype.step = function(ctx) { }

///////////////////////////////////////////////
// Objeto Water con sus funciones de control
///////////////////////////////////////////////
var Water = function(x, y, h, w){
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w; 
}

Water.prototype = new Sprite();
Water.prototype.type = OBJECT_ENEMY;
Water.prototype.draw = function(){};
Water.prototype.step = function(ctx){
    var collisionFrog = this.board.collide(this, OBJECT_PLAYER);
	// comprobación de si la rana colisiona con Water
    if(collisionFrog){
        var collisionPlatform = this.board.collide(collisionFrog, OBJECT_PLATFORM);
        if(!collisionPlatform){
            collisionFrog.hit();
        }
    }
};

///////////////////////////////////////////////
// Objeto Home con sus funciones de control
///////////////////////////////////////////////
var Home = function(x, y, h, w){
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
}

Home.prototype = new Sprite();
Home.prototype.type = OBJECT_ENEMY;
Home.prototype.draw = function(){};
Home.prototype.step = function(ctx){
    var collisionFrog = this.board.collide(this, OBJECT_PLAYER);
    // comprobación de si la rana colisiona con Home/meta
    if(collisionFrog){
        var collisionPlatform = this.board.collide(collisionFrog, OBJECT_PLATFORM);
        if(!collisionPlatform){
			this.board.changeEnable();
            winGame();
        }
    }
};

///////////////////////////////////////////////
// Objeto Death con sus funciones de control
///////////////////////////////////////////////
var Death = function(posX, posY){
    this.x = posX;
    this.y = posY;
    this.w = 45;
    this.h = 35;
    this.subFrame = 0;

    this.setup('death', {frame:0});
}
Death.prototype = new Sprite();
Death.prototype.step = function(){
	// realiza la animación de la muerte
    this.frame = Math.floor(this.subFrame++ / 6);
    if(this.subFrame >= 24) {
        this.board.remove(this);
    }
}

///////////////////////////////////////////////
// Objeto Heart con sus funciones de control
///////////////////////////////////////////////

var Heart = function(posX){
    this.x = posX;
    this.y = 0;
    this.w = 27;
    this.h = 27;

    this.setup('heart', {});

    this.draw = function(ctx){
        SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
    }
}

Heart.prototype = new Sprite();
Heart.prototype.step = function(){};

///////////////////////////////////////////////
// Objeto Frog con sus funciones de control
///////////////////////////////////////////////
var Frog = function() {
	this.subFrame = 0;
	this.setup('frog', { });
	
	this.delay = 0.2;
	this.keyDelay = 0.0;
	this.vx = 0;
	this.safe = true;
	this.rotation = 0;
	this.direction = 'stop';
    
    this.lifes = 3;
    this.hearts = [];

    for(var i = 0; i < this.lifes; i++){
        this.hearts.push(new Heart(i*28));
    }
    
	this.x = Game.width/2 - this.w/2;
    this.y = Game.height - this.h;
	
	// función para realizar la animación de la rana
	this.playMoveAnimation = function(){
        this.frame = Math.floor(this.subFrame++ / 3);

        switch(this.direction){
            case 'right': this.x += (this.w/9); break;
            case 'left': this.x += (-this.w/9); break;
            case 'up': this.y += (-this.h/9); break;
            case 'down': this.y += (this.h/9); break;
        }
        
        if(this.subFrame >= 9){
            this.stop();
        }
	}

    // Función para detener la animación de movimiento de la rana
    this.stop = function(){
        this.direction = 'stop';
        this.safe = true;
        this.frame = 0;
        this.subFrame = 0;
    }

}

Frog.prototype = new Sprite();
Frog.prototype.type = OBJECT_PLAYER;

// Redefinimos el método de dibujado para así poder dibujar los corazones con la vida restante
// Hacemos esto en vez de añadirlo directamente al board para que así quede asociado al objeto Frog correspondiente
Frog.prototype.draw = function(ctx){
    ctx.save();
	
	ctx.translate(this.x+this.w/2, this.y+this.h/2);
	ctx.rotate(this.rotation * Math.PI /180);
	ctx.translate(-(this.x+this.w/2), -(this.y+this.h/2));
	
    SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
	ctx.restore();

    for(var i = 0; i < this.lifes; i++){
        this.hearts[i].draw(ctx);
    }
}

// acción tras que la rana sea tocada/colisionada
Frog.prototype.hit = function(){
    if(this.lifes > 1){
        this.lifes--;
        this.hearts.pop();
        this.board.add(new Death(this.x, this.y));
        this.x = Game.width/2 - this.w/2;
        this.y = Game.height - this.h;
        this.stop();
    } else{
        this.board.remove(this);
	    this.board.changeEnable();
	    loseGame(this.x, this.y);
    }    
}
// acción de la rana tras colisionar con Trunk/Turtle
Frog.prototype.onTrunk = function(trunk){
    if(trunk.dir == "right")
        this.x -= trunk.vx;
    else if(trunk.dir == "left")
        this.x += trunk.vx;
}

// acción en cada paso de la rana
Frog.prototype.step = function(dt) {
    this.keyDelay -= dt;
    
    if(!this.safe){
        this.playMoveAnimation();
    }

    // usando keyDelay determinamos el tiempo entre cada paso de la rana
    if(this.keyDelay <= 0){
        
        if(this.safe){
            // dependiendo de la tecla pulsada irá hacia ese lado al mismo tiempo que se rota su sprite
            if(Game.keys['left']) { 
                this.safe = false;
                this.rotation = -90;
                this.keyDelay = this.delay;
                this.direction = 'left';
            }
            else if(Game.keys['right']) {
                this.safe = false;
                this.rotation = 90;
                this.keyDelay = this.delay;
                this.direction = 'right';
            }
            else if(Game.keys['up']) {
                this.safe = false;
                this.rotation = 0;
                this.keyDelay = this.delay;
                this.direction = 'up';
            }
            else if(Game.keys['down']) {
                this.safe = false;
                this.rotation = 180;
                this.keyDelay = this.delay;
                this.direction = 'down';
            }
        }
        
    
        // estos dos "if" sirven para determinar los límites verticales y horizontales y que la rana no se salga de la "pantalla"
        if(this.x < 0) {
            this.x = 0;
        }
        else if(this.x > Game.width - this.w) {
            this.x = Game.width - this.w
        }
        if(this.y < 0) {
            this.y = 0;
        }
        else if(this.y > Game.height - this.h) {
            this.y = Game.height - this.h
        }
    }
}

///////////////////////////////////////////////
// Objeto Car con sus funciones de control
///////////////////////////////////////////////
var Car = function(typeCar, position, direction, speed) {
	// variables de la clase Car:
	// typeCar determina el sprite asignado, 
	// pos determina la "línea" en el que se coloca, 
	// dir determinada desde que lado sale 
	// vx determina la velocidad a la que se mueve horizontalmente
	this.setup(typeCar, {pos: position, dir: direction, vx: speed});
	
	if(this.dir == 'right'){
		this.x = Game.width;
	}
	else if(this.dir == 'left'){
		this.x = -this.w;
	}
	
	this.y = Game.height-(48*this.pos);
	
}

Car.prototype = new Sprite();
Car.prototype.type = OBJECT_ENEMY;
Car.prototype.step = function(dt) {
	// movimiento de Car dependiendo desde donde aparece
    if(this.dir == 'right'){
        (this.x < -this.w) ? this.board.remove(this) : this.x-=this.vx;
    }
    else if(this.dir == 'left'){
        (this.x > Game.width) ? this.board.remove(this) : this.x+=this.vx;
    }

	// comprobación de si la rana colisiona con Car
    var collision = this.board.collide(this, OBJECT_PLAYER);
    if(collision){
        collision.hit();
    }
}
// devuelve un objeto copia con sus mismos datos
Car.prototype.copia = function(){
	return new Car(this.sprite, this.pos, this.dir, this.vx);
}

///////////////////////////////////////////////
// Objeto Trunk con sus funciones de control
///////////////////////////////////////////////
var Trunk = function(typeLog, position, direction, speed) {
	// variables de la clase Trunk:
	// typeLog determina el sprite asignado, 
	// pos determina la "línea" en el que se coloca, 
	// dir determinada desde que lado sale
	// vx determina la velocidad a la que se mueve horizontalmente
	this.setup(typeLog, {pos: position, dir: direction, vx: speed});
	
	if(this.dir == 'right'){
		this.x = Game.width;
	}
	else if(this.dir == 'left'){
		this.x = -this.w;
	}
	
	this.y = Game.height-(48*this.pos);
	
}

Trunk.prototype = new Sprite();
Trunk.prototype.type = OBJECT_PLATFORM;
Trunk.prototype.step = function(ctx) { 
	// movimiento de Trunk dependiendo desde donde aparece
    if(this.dir == 'right'){
        (this.x < -this.w) ? this.board.remove(this) : this.x-=this.vx;
    }
    else if(this.dir == 'left'){
        (this.x > Game.width) ? this.board.remove(this) : this.x+=this.vx;
    }
	
	// comprobación de si la rana colisiona con Trunk
    var collision = this.board.collide(this, OBJECT_PLAYER);
    if(collision){
        collision.onTrunk(this);
    }
}
// devuelve un objeto copia con sus mismos datos
Trunk.prototype.copia = function(){
	return new Trunk(this.sprite, this.pos, this.dir, this.vx);
}

///////////////////////////////////////////////
// Objeto Turtle con sus funciones de control
///////////////////////////////////////////////
var Turtle = function(position, direction, speed) {
	// variables de la clase Turtle:
	// pos determina la "línea" en el que se coloca, 
	// dir determinada desde que lado sale
	// vx determina la velocidad a la que se mueve horizontalmente
	this.setup('movingTurtle', {pos: position, dir: direction, vx: speed});
	
	if(this.dir == 'right'){
		this.x = Game.width;
	}
	else if(this.dir == 'left'){
		this.x = -this.w;
	}
	
	this.y = Game.height-(48*this.pos);

}

Turtle.prototype = new Sprite();
Turtle.prototype.type = OBJECT_PLATFORM;
Turtle.prototype.step = function(ctx) { 
	// movimiento de Turtle dependiendo desde donde aparece
    if(this.dir == 'right'){
        (this.x < -this.w) ? this.board.remove(this) : this.x-=this.vx;
    }
    else if(this.dir == 'left'){
        (this.x > Game.width) ? this.board.remove(this) : this.x+=this.vx;
    }
	
	// comprobación de si la rana colisiona con Turtle
    var collision = this.board.collide(this, OBJECT_PLAYER);
    if(collision){
        collision.onTrunk(this);
    }
}
// devuelve un objeto copia con sus mismos datos
Turtle.prototype.copia = function(){
	return new Turtle(this.pos, this.dir, this.vx);
}

///////////////////////////////////////////////
// Objeto Spawner con sus funciones de control
///////////////////////////////////////////////
var Spawner = function(objeto, intervalo){
	
	this.obj = objeto;
	this.inter = intervalo;
	this.delay = 0.0;
}
Spawner.prototype.step = function(dt){
	// usa this.inter como tiempo intervalo entre aparaciones del objeto
	this.delay -= dt;
	if(this.delay <= 0){
		var obj = this.obj.copia();
		this.board.addBeforeLast(obj);
		this.delay = this.inter;
	}
}
Spawner.prototype.draw = function(ctx) {}