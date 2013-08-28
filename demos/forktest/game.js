;(function(exports) {
    var Game = function(canvasId, width, height, backgroundColor) {
        this.coq = new Coquette(this, canvasId, width, height, backgroundColor);
        this.coq.renderer.getCtx().canvas.style.backgroundColor = backgroundColor;

        this.step = 0; // Steps passed (FPS)

        this.STATE = {
            DEFAULT: 0,
            LOADING: 1,
            INITIALIZED: 2,
            STARTED: 3
        };
        this.state = this.STATE.DEFAULT;
    };

    Game.prototype = {

        load: function(downloadQueue, callback) {
            this.state = this.STATE.LOADING;

            this.coq.loader.addQueue(downloadQueue);
            this.coq.loader.downloadAll(callback);
        },

        init: function() {
            this.state = this.STATE.INITIALIZED;
            console.log('Game initialized');

            var self = this;
            setTimeout(function() {
                self.start();
            }, 500);
        }, 

        start: function() {
            this.state = this.STATE.STARTED;
            console.log('Game started');

            this.music = this.coq.loader.get('titlemp3');
            this.music.play();

            this.greyscale = this.coq.loader.get('greyscale'); // Shadow runner

            this.coq.camera.shake(120, 50);
        },

        update: function(tick) {
            var width = this.coq.renderer.width,
                height = this.coq.renderer.height;
            
            this.coq.camera.followPos({x:width/2, y:height/2}, 10);

            this.step += 1;

            if (this.coq.inputter.state(this.coq.inputter.S)) {
                if (!this.music.paused) this.music.pause();
            }
            if (this.coq.inputter.state(this.coq.inputter.P)) {
                if (this.music.paused) this.music.play();
            }
        },

        draw: function(ctx) {
            var width = this.coq.renderer.width,
                height = this.coq.renderer.height;

            ctx.font = '32px "Ubuntu Mono"';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Loading screen
            if (this.state == this.STATE.LOADING) {
                var loaded = this.coq.loader.loaded(),
                    total = this.coq.loader.total();
                ctx.fillText('Loading...', width/2, height/2);
                // Loading bar
                var w = 400,
                    h = 50,
                    x = width/2 - w/2 + 0.5,
                    y = height/2 + h + 0.5,
                    length = (w-4)*(loaded/total);
                ctx.strokeRect(x, y, w, h);
                ctx.fillRect(x+2, y+2, length, h-4);
                // Loading bar text
                var perctext = ((loaded/total)*100).toFixed(0) + ' %';
                ctx.fillStyle = '#fff';
                ctx.fillText(perctext, width/2, height/2 + 50 +h/2);
            }

            // Main drawing
            if (this.state == this.STATE.STARTED) {
                // ctx.fillText('Hello World', width/2, height/2-32);

                // Switch between 8 frames of the spritesheet every 4th step
                var frame = Math.round(this.step/4)%8,
                    sx = 64*frame,      sy = 0, // pos in spritesheet
                    sw = 64,            sh = 64, // dimensions of a frame
                    dx = width/2-32,    dy = height/2-32, // destination pos
                    dw = sw,            dh = sh; // drawing size (same as frame)
                ctx.drawImage(this.greyscale, sx, sy, sw, sh, dx, dy, dw, dh);

                ctx.beginPath();
                ctx.moveTo(200, height/2+32.5);
                ctx.lineTo(width-200, height/2+32.5);
                ctx.stroke();
                ctx.closePath();

                ctx.font = '16px "Ubuntu Mono"';
                ctx.textAlign = 'start';
                ctx.fillText('Press P to play music', 10, 16)
                ctx.textAlign = 'end';
                ctx.fillText('Press S to stop music', width-10, 16);
            }
        },

    };

    exports.Game = Game;
})(this);