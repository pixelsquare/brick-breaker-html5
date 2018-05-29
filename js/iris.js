'use strict';

var Iris = Iris || { };

Iris.Math = function(game) { };

Iris.Math.prototype = {
    clamp: function(val, min, max) {
        if(val <= min) {
            return min;
        }

        if(val >= max) {
            return max;
        }

        return val;
    },
    length(vec) {
        return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    },
    normalize(vec) {
        var len = this.length(vec);
        vec.x = vec.x / len;
        vec.y = vec.y / len;
        return vec;
    },
    dot: function(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }
};

Iris.Math.constructor = Iris.Math;

Iris.Input = function(game) {

    this.game = game;

    this.mouseX = 0;
    this.mouseY = 0;

    this.isTouching = false;
    this.didClick = false;

    this.state = null;

    this.initialize();
};

Iris.Input.prototype = {
    initialize: function() {

        var root = this;

        // Touch Start 

        this.touchStart = function(event) {
            root.onTouchStart(event);
        };

        this.game.canvas.addEventListener('mousedown', this.touchStart, false);
        this.game.canvas.addEventListener('touchstart', this.touchStart, false);

        // Touch Move

        this.touchMove = function(event) {
            root.onTouchMove(event);
        };

        this.game.canvas.addEventListener('mousemove', this.touchMove, false);
        this.game.canvas.addEventListener('touchmove', this.touchMove, false);

        // Touch Ended 

        this.touchEnded = function(event) {
            root.onTouchEnded(event);
        };

        this.game.canvas.addEventListener('mouseup', this.touchEnded, false);
        this.game.canvas.addEventListener('touchend', this.touchEnded, false);

        // Touch Cancel 

        this.touchCancel = function(event) {
            root.onTouchCancel(event);
        };

        this.game.canvas.addEventListener('touchcancel', this.touchCancel, false);

    },
    setState: function(state) {
        this.state = state;
    },
    onTouchStart: function(event) {
        if(this.state !== null && typeof this.state.onTouchStart !== 'undefined') {
            this.state.onTouchStart(this.mouseX, this.mouseY);
        }

        this.isTouching = true;
        this.didClick = true;

        event.preventDefault();
    },
    onTouchMove: function(event) {
        var rect = this.game.canvas.getBoundingClientRect();

        if(window.mobileAndTabletCheck()) {
            if(event.touches.length >= 1) {
                var touch = event.touches[0];

                this.mouseX = touch.clientX - rect.left;
                this.mouseY = touch.clientY - rect.top;
            }
        }
        else {
            this.mouseX = event.clientX - rect.left;
            this.mouseY = event.clientY - rect.top;
        }

        if(this.state !== null && typeof this.state.onTouchMove !== 'undefined') {
            this.state.onTouchMove(this.mouseX, this.mouseY);
        }
        
        event.preventDefault();
    },
    onTouchEnded: function(event) {
        if(this.state !== null && typeof this.state.onTouchEnded !== 'undefined') {
            this.state.onTouchEnded(this.mouseX, this.mouseY);
        }

        this.isTouching = false;
        this.didClick = false;

        event.preventDefault();
    },
    onTouchCancel: function(event) {
        if(this.state !== null && typeof this.state.onTouchCancel !== 'undefined') {
            this.state.onTouchCancel(this.mouseX, this.mouseY);
        }

        event.preventDefault();
    }
};

Iris.Input.constructor = Iris.Input;

Iris.ObjectFactory = function(game) {

    this.game = game;
};

Iris.ObjectFactory.prototype = {
    image: function(x, y, name) {
        var img = this.game.load.images[name];

        this.game.ctx.save();
        this.game.ctx.drawImage(img, 0, 0, img.width, img.height, 
           x - ((img.width / this.game.contentScaleFactor) * .5), y - ((img.height / this.game.contentScaleFactor) * .5), 
            img.width / this.game.contentScaleFactor, img.height / this.game.contentScaleFactor);
        this.game.ctx.restore();
        return img;
    },
    imageFill: function(x, y, name) {
        var img = this.game.load.images[name];

        this.game.ctx.save();
        this.game.ctx.drawImage(img, x, y, img.width, img.height, 
            0, 0, window.innerWidth, window.innerHeight);
        this.game.ctx.restore();
        return img;
    }
};

Iris.ObjectFactory.constructor = Iris.ObjectFactory;

Iris.Loader = function(game) {

    this.game = game;

    this.queueCount = 0;
    this.loadedCount = 0;

    this.images = {};
};

Iris.Loader.prototype = {
    image: function(name, src) {
        var image = new Image();
        image.src = src;

        var root = this;
        image.onload = function() {
            root.loadedCount++;
        };

        this.images[name] = image;
        this.queueCount++;
        return image;
    },
    hasFinishedLoading: function() {
        return this.loadedCount == this.queueCount;
    }
};

Iris.Loader.constructor = Iris.Loader;

Iris.Time = function(game) {

    this.game = game;

    this.started = 0;

    this.time = 0;    
    this.dt = 0;

    this.frames = 0;
    this.fps = 0;
    this.timeLastSecond = 0;

    this.initialize();
};

Iris.Time.prototype = {
    initialize: function() {
        this.started = Date.now();
        this.time = Date.now();
    },
    update: function(time) {
        var then = this.time;  
        this.time = Date.now();

        this.dt = this.time - then;

        this.frames++;
        if(time > this.timeLastSecond + 1000) {
            this.fps = Math.round((this.frames * 1000) / (time - this.timeLastSecond));
            this.timeLastSecond = time;
            this.frames = 0;
        }
    },
    totalElapsedSeconds: function() {
        return (this.time - this.started) * 0.001;
    }
};

Iris.Time.prototype.constructor = Iris.Time;

// DEBUG

Iris.Debug = function(game) {

    this.game = game;

};

Iris.Debug.prototype = {
    isPointInsideRect: function(pos, rect) {
        return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y;
    },
    text: function(text, x, y) {
        this.game.ctx.save();
        this.game.ctx.fillStyle = "#fff";
        this.game.ctx.font = "normal 20px Arial";
        this.game.ctx.textAlign = 'left';
        this.game.ctx.textBaseline = 'middle';
        this.game. ctx.fillText(text, x, y);
        this.game.ctx.restore();
    },
    line: function(from, to) {
        this.game.ctx.save();
        this.game.ctx.fillStyle = 'black';
        this.game.ctx.strokeWidth = '1';
        this.game.ctx.beginPath();
        this.game.ctx.moveTo(from.x, from.y);
        this.game.ctx.lineTo(to.x, to.y);
        this.game.ctx.stroke();
        this.game.ctx.restore();
    },
    point: function(center, radius) {
        this.game.ctx.save();
        this.game.ctx.fillStyle = 'yellow';
        this.game.ctx.strokeWidth = 1;
        this.game.ctx.beginPath();
        this.game.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
        this.game.ctx.fill();
        this.game.ctx.restore();
    },
    popup1btn: function(message, buttonMsg) {

        var width = 300;
        var height = 200;
        var x = (this.game.width * .5) - (width * .5);
        var y = (this.game.height * .5) - (height * .5);

        this.game.ctx.save();
        this.game.ctx.beginPath();
        this.game.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.game.ctx.fillRect(0, 0, this.game.width, this.game.height);
        this.game.ctx.fill();
        this.game.ctx.restore();

        this.game.ctx.save();
        this.game.ctx.beginPath();
        this.game.ctx.fillStyle = 'white';
        this.game.ctx.rect(x, y, width, height);
        this.game.ctx.shadowColor = "#000";
        this.game.ctx.shadowBlur = 20;
        this.game.ctx.shadowOffsetX = 5;
        this.game.ctx.shadowOffsetY = 5;
        this.game.ctx.fill();
        this.game.ctx.restore();

        this.game.ctx.save();
        this.game.ctx.fillStyle = "#000";
        this.game.ctx.font = "normal 20px Arial";
        this.game.ctx.textAlign = 'left';
        this.game.ctx.textBaseline = 'middle';
        this.game. ctx.fillText(message, x + (width * .25), y + (height * .3));
        this.game.ctx.restore();

        var mousePos = {
            x: this.game.input.mouseX,
            y: this.game.input.mouseY
        };

        var rect = {
            x: x + (width * .5) - 40,
            y: y + (height * .5) + 15,
            width: 80,
            height: 30
        };

        this.game.ctx.save();
        this.game.ctx.beginPath();
        this.game.ctx.fillStyle = 'white';
        this.game.ctx.rect(rect.x, rect.y, rect.width, rect.height);
        this.game.ctx.shadowColor = "#000";
        this.game.ctx.shadowBlur = 5;
        this.game.ctx.shadowOffsetX = 2;
        this.game.ctx.shadowOffsetY = 2;
        this.game.ctx.fill();
        this.game.ctx.restore();

        this.game.ctx.save();
        this.game.ctx.fillStyle = "#000";
        this.game.ctx.font = "normal 20px Arial";
        this.game.ctx.textAlign = 'left';
        this.game.ctx.textBaseline = 'middle';
        this.game. ctx.fillText(buttonMsg, rect.x + (rect.width * .2), rect.y + (rect.height * .5));
        this.game.ctx.restore();

        if(this.isPointInsideRect(mousePos, rect) && this.game.input.didClick) {
            return true;
        }

        return false;
    }
};

Iris.Debug.prototype.constructor = Iris.Debug;

// GAME

var global = this;

Iris.Game = function(width, height, name, state) {

    this.canvas = null;
    this.ctx = null;

    this.name = name;
    this.state = state;

    this.width = 0;
    this.height = 0;

    this.targetWidth = width;
    this.targetHeight = height;
    this.aspectRatio = this.targetWidth / this.targetHeight;

    this.contentScaleFactor = 0;

    this.hasInitialized = false;
    this.isRunning = false;

    this.raf = null;

    this.time = null;
    this.debug = null;
    this.load = null;
    this.add = null;
    this.input = null;
    this.math = null;

    if(typeof width !== 'undefined') {
        this.targetWidth = width;
    }

    if(typeof height !== 'undefined') {
        this.targetHeight = height;
    }

    this.initialize();
};

Iris.Game.prototype = {
    initialize: function() {        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.targetWidth;
        this.canvas.height = this.targetHeight;

        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);

        this.contentScaleFactor = 1 + (this.getPixelRatio() / 10);

        var w = window.innerWidth;
        var h = window.innerHeight;
        var r = this.targetWidth / this.targetHeight;        

        this.width = h * r;
        this.height = h;
        this.aspectRatio = this.width / this.height;

        this.canvas.width = this.width * this.contentScaleFactor;
        this.canvas.height = this.height * this.contentScaleFactor;
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";

        this.ctx.scale(this.contentScaleFactor, this.contentScaleFactor);

        this.time = new Iris.Time(this);
        this.debug = new Iris.Debug(this);
        this.load = new Iris.Loader(this);
        this.add = new Iris.ObjectFactory(this);
        this.input = new Iris.Input(this);
        this.math = new Iris.Math(this);

        this.isRunning = true;

        var root = this;
        this.init = function() {
            root.awake();
        }

        window.requestAnimationFrame(this.init);
    },
    awake: function() {
        if(this.state !== null && typeof this.state.awake === 'function') {
            this.state.awake();
        }

        var root = this;
        var interval = setInterval(function() {
            if(root.load.hasFinishedLoading()) {
                root.start();
                clearInterval(interval);
                interval = null;
            }
        }, 10);
    },
    start: function() {
        if(this.state !== null && typeof this.state.start === 'function') {
            this.state.start();
        }

        var root = this;
        this.loop = function(time) {
            root.update(time);
        };

        this.raf = window.requestAnimationFrame(this.loop);
    },
    update: function(time) {
        if(this.isRunning) {
            this.time.update(time);

            if(this.state !== null && typeof this.state.update === 'function') {
                this.state.update();
            }

            this.render();
            this.raf = window.requestAnimationFrame(this.loop);
        }
    },
    render: function() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.width, this.height);

        if(this.state !== null && typeof this.state.render === 'function') {
            this.state.render();
        }

        this.ctx.restore();
    },
    getPixelRatio: function() {
        var dpr = window.devicePixelRatio || 1,
        bsr = this.ctx.webkitBackingStorePixelRatio ||
            this.ctx.mozBackingStorePixelRatio ||
            this.ctx.msBackingStorePixelRatio ||
            this.ctx.oBackingStorePixelRatio ||
            this.ctx.backingStorePixelRatio || 1;

        return dpr / bsr;
    }
};

Iris.Game.prototype.constructor = Iris.Game;