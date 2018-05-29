'use strict'

var game = new Iris.Game(1080, 1920, "block-breaker", {
    awake: awake,
    start: start,
    update: update,
    render: render
});

var IS_DEBUG = false;
var BALL_SPEED = 300;
var POINT_PER_BRICK = 10;

// http://unluckystudio.com/game-art-giveaway-6-breakout-sprites-pack/
// http://www.downloadfreesound.com/8-bit-sound-effects/
// http://ericskiff.com/music/

var beep = new Audio('media/beep2.wav');

var GameState = {
    'INTRO' : "INTRO",
    'START' : "START",
    'GAMETIME' : "GAMETIME",
    'GAMEOVER' : "GAMEOVER"
};

var Transform = function(game) {

    this.game = game;

    this.rect = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };

    this.position = {
        x: 0,
        y: 0
    };

    this.scale = {
        x: 0,
        y: 0
    };

    this.anchor = { 
        x: .5, 
        y: .5 
    };

    this.anchoredPosition = { 
        x: 0,
        y: 0 
    };

    this.size = {
        x: 0,
        y: 0
    };

    this.offset = {
        x: 0,
        y: 0
    };
};

Transform.prototype = {
    render: function() {
        if(!IS_DEBUG) {
            return;
        }

        this.game.debug.point({
            x: this.position.x,
            y: this.position.y
        }, 2);
    },
    setDirty: function() {
        this.anchoredPosition.x = this.position.x - (this.size.x * this.anchor.x);
        this.anchoredPosition.y = this.position.y - (this.size.y * this.anchor.y);

        this.rect.left = this.anchoredPosition.x - (this.size.x * this.anchor.x);
        this.rect.right = this.anchoredPosition.x + (this.size.x * this.anchor.x);

        this.rect.top = this.anchoredPosition.y - (this.size.y * this.anchor.y);
        this.rect.bottom = this.anchoredPosition.y + (this.size.y * this.anchor.y);
    }
};

var CollisionBox = function(target, game) {

    this.game = game;

    this.target = target;

    this.isVerticalCollision = false;
    this.isHorizontalCollision = false;

    this.top = 0;
    this.bottom = 0;
    this.left = 0;
    this.right = 0;

    this.position = {
        x: 0,
        y: 0
    };

    this.size = {
        x: 0,
        y: 0
    };

    this.anchor = {
        x: .5,
        y: .5
    };

    this.anchoredPosition = {
        x: 0,
        y: 0
    };

    this.normal = {
        x: 0,
        y: 0
    };
};

CollisionBox.prototype = {
    update: function() {
        if(this.target != null) {
            this.position.x = this.target.transform.position.x;
            this.position.y = this.target.transform.position.y;

            this.left = this.position.x - (this.size.x * this.anchor.x);
            this.right = this.position.x + (this.size.x * this.anchor.x);
            this.top = this.position.y - (this.size.y * this.anchor.y);
            this.bottom = this.position.y + (this.size.y * this.anchor.y);
        }
    },
    render: function() {
        if(!IS_DEBUG) {
            return;
        }
        
        this.game.ctx.save();
        this.game.ctx.translate(this.position.x, this.position.y);
        this.game.ctx.fillStyle = 'black';
        this.game.ctx.strokeWidth = '1';
        this.game.ctx.beginPath();
        this.game.ctx.rect(
            this.anchoredPosition.x, 
            this.anchoredPosition.y, 
            this.size.x, this.size.y);
        this.game.ctx.stroke();
        this.game.ctx.restore();

        this.game.debug.point({
            x: this.left,
            y: this.position.y
        }, 2);

        this.game.debug.point({
            x: this.right,
            y: this.position.y
        }, 2);

        this.game.debug.point({
            x: this.position.x,
            y: this.top
        }, 2);

        this.game.debug.point({
            x: this.position.x,
            y: this.bottom
        }, 2);
    },   
    hasCollidedWith: function(target) {

        if(Math.abs(this.position.x - target.position.x) * 2 < this.size.x + target.size.x
        && Math.abs(this.position.y - target.position.y) * 2 < this.size.y + target.size.y) {

            var direction = {
                x: target.position.x - this.position.x,
                y: target.position.y - this.position.y
            };

            var length = this.game.math.length(direction);

            this.normal.x = this.game.math.normalize(direction).x;
            this.normal.y = this.game.math.normalize(direction).y;

            this.isHorizontalCollision = false;
            this.isVerticalCollision = false;

            var angle = Math.atan2(this.normal.y, this.normal.x) * (180 / Math.PI);

            if(angle > 150 && angle < 180 || angle > -180 && angle < -150 ||
                angle > 0 && angle < 30 || angle > -30 && angle < 0) {
                if(this.position.x <= target.position.x - (target.size.x * .5)) {
                    this.isHorizontalCollision = true;
                }
    
                if(this.position.x >= target.position.x + (target.size.x * .5)) {
                    this.isHorizontalCollision = true;
                }
            }
            else {
                if(this.position.y >= target.position.y + (target.size.y * .5)) {
                    this.isVerticalCollision = true;
                }

                if(this.position.y <= target.position.y - (target.size.y * .5)) {
                    this.isVerticalCollision = true;
                }
            }

            beep.play();

            return true;
        }

        return false;
    },
    setDirty: function() {
        this.anchoredPosition.x = this.position.x - (this.size.x * this.anchor.x);
        this.anchoredPosition.y = this.position.y - (this.size.y * this.anchor.y);
    }
};

var Paddle = function(game) {

    this.game = game;

    this.name = "paddle";
    this.src = "assets/bats/bat_black01.png";

    this.image = null;
    this.speed = 1;

    this.transform = new Transform(game);
    this.collisionBox = new CollisionBox(this, game);

    this.initialize();
};

Paddle.prototype = {
    initialize: function() {
        this.image = game.load.image(this.name, this.src);
    },
    start: function() {
        this.transform.size.x = this.image.width / this.game.contentScaleFactor;
        this.transform.size.y = this.image.height / this.game.contentScaleFactor;
        this.transform.setDirty();

        this.transform.position.x = this.game.width * .5;
        this.transform.position.y = this.game.height * .9;

        this.transform.offset.x = 0;
        this.transform.offset.y = 5 / this.game.contentScaleFactor;

        this.collisionBox.anchor.y = .55;
        this.collisionBox.size.x = this.transform.size.x * .9;
        this.collisionBox.size.y = this.transform.size.y * .2;
        this.collisionBox.setDirty();
    },
    update: function() {
        if(gameState == GameState.GAMETIME) {
            var horiz = this.game.input.mouseX;
            horiz = this.game.math.clamp(horiz, 
                (this.transform.size.x * .5), 
                this.game.width - (this.transform.size.x * .5));
            this.transform.position.x = horiz;
    
            this.collisionBox.update();
        }
    },
    render: function() {
        this.game.ctx.save();
        this.game.add.image(
            this.transform.position.x + this.transform.offset.x, 
            this.transform.position.y + this.transform.offset.y, 
            this.name);
        this.game.ctx.restore();

        this.collisionBox.render();
        this.transform.render();
    }
}

Paddle.prototype.constructor = Paddle;

var Ball = function(game) {

    this.game = game;

    this.name = "ball";
    this.src = "assets/balls/ball_silver01.png";

    this.image = null;
    this.speed = BALL_SPEED;

    this.direction = {
        x: 1,
        y: 1
    };

    this.velocity = {
        x: 0,
        y: -1
    };

    this.transform = new Transform(game);
    this.collisionBox = new CollisionBox(this, game);

    this.initialize();
};

Ball.prototype = {
    initialize: function() {
        this.image = game.load.image(this.name, this.src);
    },
    start: function() {
        this.transform.size.x = this.image.width / this.game.contentScaleFactor;
        this.transform.size.y = this.image.height / this.game.contentScaleFactor;
        this.transform.setDirty();


        this.transform.position.x = paddle.transform.position.x;
        this.transform.position.y = paddle.transform.position.y - (35 / this.game.contentScaleFactor);

        this.collisionBox.size.x = this.transform.size.x * .8;
        this.collisionBox.size.y = this.transform.size.y * .8;
        this.collisionBox.setDirty();
    },
    update: function() {
        if(gameState === GameState.START) {
            this.transform.position.x = paddle.transform.position.x;
            this.transform.position.y = paddle.transform.position.y - (35 / this.game.contentScaleFactor);
        }
        else if(gameState === GameState.GAMETIME) {
            // This will prevent the ball from sticking to the paddle
            // whenever the ball's hit point is either left or right side.
            // Disable all ball collision detection.
            if(ball.collisionBox.bottom - 10 < paddle.collisionBox.top){
                if(ball.collisionBox.hasCollidedWith(upperBox) ||
                    ball.collisionBox.hasCollidedWith(paddle.collisionBox)) {
                    this.direction.y = -this.direction.y;
                }

                if(ball.collisionBox.hasCollidedWith(rightBox) ||
                    ball.collisionBox.hasCollidedWith(leftBox)) {
                    this.direction.x = -this.direction.x;
                }

                for(var i = 0; i < bricks.length; i++) {
                    var brick = bricks[i];

                    if(brick != null && ball.collisionBox.hasCollidedWith(brick.collisionBox)) {

                        var length = Math.sqrt(
                            this.transform.position.x * brick.transform.position.x + 
                            this.transform.position.y * brick.transform.position.y);
            
                        var direction = {
                            x: brick.transform.position.x - this.transform.position.x,
                            y: brick.transform.position.y - this.transform.position.y
                        };
            
                        var normal = {
                            x: direction.x / length,
                            y: direction.y / length
                        };
    
                        var angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);

                        // Destroy the brick
                        bricks[i] = null;
                        score += POINT_PER_BRICK;

                        if(ball.collisionBox.isHorizontalCollision) {
                            this.direction.x = -this.direction.x;
                            break;
                        }

                        if(ball.collisionBox.isVerticalCollision) {
                            this.direction.y = -this.direction.y;
                            break;
                        }
                    }
                }

                if(ball.collisionBox.hasCollidedWith(paddle.collisionBox)) {
                    var length = Math.sqrt(
                        this.transform.position.x * paddle.transform.position.x + 
                        this.transform.position.y * paddle.transform.position.y);
        
                    var direction = {
                        x: paddle.transform.position.x - this.transform.position.x,
                        y: paddle.transform.position.y - this.transform.position.y
                    };
        
                    var normal = {
                        x: direction.x / length,
                        y: direction.y / length
                    };

                    this.direction.x = 1;
                    this.velocity.x = -normal.x * 10;
                }
            }

            this.transform.position.x += this.velocity.x * this.speed * this.direction.x * 0.02;
            this.transform.position.y += this.velocity.y * this.speed * this.direction.y * 0.02;
        }

        this.collisionBox.update();
    },
    render: function() {
        this.game.ctx.save();
        this.game.add.image(
            this.transform.position.x, 
            this.transform.position.y, 
            this.name);
        this.game.ctx.restore();

        this.collisionBox.render();
        this.transform.render();
    }
};

Ball.prototype.constructor = Ball;

var Brick = function(game) {

    this.game = game;

    this.name = "brick";
    this.src = "assets/bricks/brick_blue_small01.png";

    this.image = null;
    this.speed = 1;

    this.transform = new Transform(game);
    this.collisionBox = new CollisionBox(this, game);

    this.initialize();
};

Brick.prototype = {
    initialize: function() {
        this.image = game.load.image(this.name, this.src);
    },
    start: function() {
        this.transform.size.x = this.image.width / this.game.contentScaleFactor;
        this.transform.size.y = this.image.height / this.game.contentScaleFactor;
        this.transform.setDirty();

        this.transform.offset.x = 0;
        this.transform.offset.y = 5 / this.game.contentScaleFactor;

        this.collisionBox.anchor.y = .55;
        this.collisionBox.size.x = this.transform.size.x * .45;
        this.collisionBox.size.y = this.transform.size.y * .2;
        this.collisionBox.setDirty();
    },
    update: function() {
        this.collisionBox.update();
    },
    render: function() {
        this.game.ctx.save();
        this.game.add.image(
            this.transform.position.x + this.transform.offset.x, 
            this.transform.position.y + this.transform.offset.y, 
            this.name);
        this.game.ctx.restore();

        this.collisionBox.render();
        this.transform.render();
    }
};

Brick.prototype.constructor = Brick;

// --

var paddle;
var ball;

var bricks = [];

var upperBox;
var leftBox;
var rightBox;

var score = 0;
var showStartPopup = true;
var showGameOverPopup = false;

var gameState = GameState.INTRO;

function awake() {
    game.load.image('background', 'assets/background/background.jpg');
    game.input.setState({
        onTouchStart: onTouchStart,
        onTouchEnded: onTouchEnded
    });

    upperBox = new CollisionBox(null, game);
    upperBox.size.x = game.width;
    upperBox.size.y = 20;
    upperBox.setDirty();

    upperBox.position.x = game.width * .5;
    upperBox.position.y = -10;

    rightBox = new CollisionBox(null, game);
    rightBox.size.x = 20;
    rightBox.size.y = game.height;
    rightBox.setDirty();

    rightBox.position.x = game.width + 10;
    rightBox.position.y = game.height * .5;

    leftBox = new CollisionBox(null, game);
    leftBox.size.x = 20;
    leftBox.size.y = game.height;
    leftBox.setDirty();

    leftBox.position.x = -10;
    leftBox.position.y = game.height * .5;

    paddle = new Paddle(game);
    ball = new Ball(game);

    for(var y = 0; y < 5; y++) {
        for(var x = 0; x < 5; x++) {
            var brick = new Brick(game);
            bricks.push(brick);
        }
    }
}

function start() {
    paddle.start();
    ball.start();

    for(var i = 0; i < bricks.length; i++) {
        if(bricks[i] != null) {
            bricks[i].start();
        }
    }

    var i = 0;
    for(var y = 0; y < 5; y++) {
        for(var x = 0; x < 5; x++) {
            var brick = bricks[i];
            brick.transform.position.x = (game.width * .5) + brick.transform.size.x - x * brick.transform.size.x * .5;
            brick.transform.position.y = (game.height * .25) + brick.transform.size.y - y * brick.transform.size.y * .5;
            i++;
        }
    }
}

function update() {
    paddle.update();
    ball.update();

    for(var i = 0; i < bricks.length; i++) {
        if(bricks[i] != null) {
            bricks[i].update();
        }
    }

    upperBox.update();
    rightBox.update();
    leftBox.update();
}

function render() {
    game.add.imageFill(0, 0, 'background');

    paddle.render();
    ball.render();

    for(var i = 0; i < bricks.length; i++) {
        if(bricks[i] != null) {
            bricks[i].render();
        }
    }

    upperBox.render();
    rightBox.render();
    leftBox.render();

    game.debug.text("SCORE: " + score, 10, 15);
    game.debug.text("FPS: " + game.time.fps, 10, game.height - 15);

    if(gameState == GameState.INTRO) {
        if(showStartPopup) {
            showStartPopup = !game.debug.popup1btn("Are you ready?", "Start");
        }
        else {            
            gameState = GameState.START;
        }
    }
}

function onTouchStart() {
    if(gameState == GameState.START) {    
        beep.play();
    }
}

function onTouchEnded() {
    if(gameState == GameState.START) {           
        gameState = GameState.GAMETIME;
        beep.play();
    }
}
