;(function(exports) {
    var Game = function(canvasId, width, height, backgroundColor) {
        this.coq = new Coquette(this, canvasId, width, height, backgroundColor);
        this.coq.renderer.getCtx().canvas.style.backgroundColor = backgroundColor;

        this.step = 0;
    };

    Game.prototype = {

        init: function() {
            console.log('Game initialized');

            // this.coq.camera.shake(60, 50);
        }, 

        update: function(tick) {
            var width = this.coq.renderer.width,
                height = this.coq.renderer.height;

            // Move the camera in a circle around the center
            var x = (width/4)*Math.cos(this.step),
                y = (height/4)*Math.sin(this.step);
            // this.coq.camera.followPos({x:width/2 + x, y:height/2 + y}, 5);
            
            this.step += 0.01;
        },

        draw: function(ctx) {
            var width = this.coq.renderer.width,
                height = this.coq.renderer.height;

            ctx.font = '32px "Ubuntu Mono"';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Hello World', width/2, height/2);
        },

    };

    exports.Game = Game;
})(this);