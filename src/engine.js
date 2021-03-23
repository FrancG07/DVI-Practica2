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
        this.image.src = 'img/spritesFrogger.png';
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
    var KEY_CODES = { 37:'left', 38 :'up', 39:'right', 40:'down' };
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
}

///////////////////////////////////////////////
// Objeto TitleScreen, encargado de mostrar
// el menú principal y los menús de victoria
// y/o derrota
///////////////////////////////////////////////
var TitleScreen = function TitleScreen(title,subtitle,callback) {
    var up = false;
    this.step = function(dt) {
        if( !Game.keys['fire'] ) up = true;
        if( up && Game.keys['fire'] && callback ) callback();
    };

    this.draw = function(ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.font = "bold 40px bangers";
        ctx.fillText(title,Game.width/2,Game.height/2);
        ctx.font = "bold 20px bangers";
        ctx.fillText(subtitle,Game.width/2,Game.height/2 + 140);
    };
};

///////////////////////////////////////////////
// Objeto GameBoard que controla los elementos
// que hay en el juego y sus interacciones
///////////////////////////////////////////////
var GameBoard = function() {
    var board = this;
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
        this.resetRemoved();
        this.iterate('step',dt);
        this.finalizeRemoved();
    };

    // Draw all the objects
    this.draw = function(ctx) {
        this.iterate('draw',ctx);
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
}    

/*
///////////////////////////////////////////////
// Objeto Level encargado de gestionar los
// niveles del juego (en desuso para Frogger)
///////////////////////////////////////////////
var Level = function(levelData,callback) {
    this.levelData = [];
    for(var i = 0; i < levelData.length; i++) {
        this.levelData.push(Object.create(levelData[i]));
    }
    this.t = 0;
    this.callback = callback;
}

Level.prototype.draw = function(ctx) { }

Level.prototype.step = function(dt) {
    var idx = 0, remove = [], curShip = null;
    // Update the current time offset
    this.t += dt * 1000;
    // Example levelData
    // Start, End, Gap, Type, Override
    // [[ 0, 4000, 500, 'step', { x: 100 } ]
    while((curShip = this.levelData[idx]) &&
        (curShip[0] < this.t + 2000)) {
        // Check if past the end time
        if(this.t > curShip[1]) {
            // If so, remove the entry
            remove.push(curShip);
        } else if(curShip[0] < this.t) {
            // Get the enemy definition blueprint
            var enemy = enemies[curShip[3]],
            override = curShip[4];
            // Add a new enemy with the blueprint and override
            this.board.add(new Enemy(enemy,override));
            // Increment the start time by the gap
            curShip[0] += curShip[2];
        }
        idx++;
    }
    // Remove any objects from the levelData that have passed
    for(var i = 0, len = remove.length; i < len; i++) {
        var idx = this.levelData.indexOf(remove[i]);
        if(idx != -1) this.levelData.splice(idx,1);
    }
    // If there are no more enemies on the board or in
    // levelData, this level is done
    if(this.levelData.length == 0 && this.board.cnt[OBJECT_ENEMY] == 0) {
        if(this.callback) this.callback();
    }
}

*/

///////////////////////////////////////////////
// Objeto Sprite, prototipo encargado de las
// funciones generales de los objetos del juego
///////////////////////////////////////////////
var Sprite = function() {};

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
    SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
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
// Objeto Frog con sus funciones de control
///////////////////////////////////////////////
var Frog = function() {
	// variables del sprite de la rana
	var frog = ['frog', 'frog1', 'frog2', 'frog3', 'frog4', 'frog5']
	var cont = 0;
	
	this.setup(frog[cont], { });
	
	this.x = Game.width/2 - this.w/2;
    this.y = Game.height - this.h;
    
	this.step = function(dt) {
        if(Game.keys['left']) { 
			this.x -= 40;
			this.cambioS();
		}
        else if(Game.keys['right']) {
			this.x += 40;
			this.cambioS();
		}
		else if(Game.keys['up']) {
			this.y -= 48;
			this.cambioS();
		}
		else if(Game.keys['down']) {
			this.y += 48;
			this.cambioS();
		}
        
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
	
	// función para cambiar el sprite de la rana
	this.cambioS = function(){
		cont = (cont < 5) ? cont+1 : 0;
		this.setup(frog[cont], { });
	}
}

Frog.prototype = new Sprite();
Frog.prototype.step = function(ctx) { }

/*
var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY = 4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;

var PlayerShip = function() {
    this.setup('ship', { vx: 0, frame: 0, reloadTime: 0.25, maxVel: 200 });

    this.x = Game.width/2 - this.w / 2;
    this.y = Game.height - 10 - this.h;
    
    this.reload = this.reloadTime;

    this.step = function(dt) {
        if(Game.keys['left']) { this.vx = -this.maxVel; }
        else if(Game.keys['right']) { this.vx = this.maxVel; }
        else { this.vx = 0; }
        this.x += this.vx * dt;
        if(this.x < 0) { this.x = 0; }
        else if(this.x > Game.width - this.w) {
            this.x = Game.width - this.w
        }

        this.reload -= dt;
        if(Game.keys['fire'] && this.reload < 0){
            Game.keys['fire'] = false;
            this.reload = this.reloadTime;
            this.board.add(new PlayerMissile(this.x,this.y+this.h/2));
            this.board.add(new PlayerMissile(this.x+this.w,this.y+this.h/2));
        }
    }
}

PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;

PlayerShip.prototype.hit = function(damage) {
    if(this.board.remove(this)) {
        loseGame();
    }
}

var PlayerMissile = function(x,y) {
    this.setup('missile',{ vy: -700, damage:10 });
    this.x = x - this.w/2;
    this.y = y - this.h;
};

PlayerMissile.prototype = new Sprite();
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

PlayerMissile.prototype.step = function(dt) {
    this.y += this.vy * dt;
    var collision = this.board.collide(this,OBJECT_ENEMY);
    if(collision) {
        collision.hit(this.damage);
        this.board.remove(this);
    } else if(this.y < -this.h) {
        this.board.remove(this);
    }
};

var enemies = {
    straight: { x: 0, y: -50, sprite:'enemy_ship', health: 10,
        E: 100 },
    ltr: { x: 0, y: -100, sprite:'enemy_purple', health: 10,
        B: 200, C: 1, E: 200  },
    circle: { x: 400,   y: -50, sprite:'enemy_circle', health: 10,
        A: 0,  B: -200, C: 1, E: 20, F: 200, G: 1, H: Math.PI/2 },
    wiggle: { x: 100, y: -50, sprite:'enemy_bee', health: 20,
        B: 100, C: 4, E: 100 },
    step: { x: 0,   y: -50, sprite:'enemy_circle', health: 10,
        B: 300, C: 1.5, E: 60 }
};

var Enemy = function(blueprint,override) {
    this.merge(this.baseParameters);
    this.setup(blueprint.sprite,blueprint);
    this.merge(override);
}

Enemy.prototype = new Sprite();
Enemy.prototype.type = OBJECT_ENEMY;
Enemy.prototype.baseParameters = { 
    A: 0, B: 0, C: 0, D: 0,
    E: 0, F: 0, G: 0, H: 0,
    t: 0 
};

Enemy.prototype.step = function(dt) {
    this.t += dt;
    this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
    this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    var collision = this.board.collide(this,OBJECT_PLAYER);
    if(collision) {
        collision.hit(this.damage);
        this.board.remove(this);
    }

    if(this.y > Game.height ||
    this.x < -this.w ||
    this.x > Game.width) {
        this.board.remove(this);
    }
}
Enemy.prototype.hit = function(damage) {
    this.health -= damage;
    if(this.health <= 0)
        if(this.board.remove(this)) {
            this.board.add(new Explosion
                (
                this.x + this.w/2,
                this.y + this.h/2
                )
            );
        }
}

var Explosion = function(centerX, centerY){
    this.setup('explosion', { frame: 0 });
    this.x = centerX - this.w/2;
    this.y = centerY - this.h/2;
    this.subFrame = 0;
}

Explosion.prototype = new Sprite();

Explosion.prototype.step = function(dt) {
    this.frame = Math.floor(this.subFrame++ / 3);
    if(this.subFrame >= 36) {
        this.board.remove(this);
    }
};
*/