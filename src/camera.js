;(function(exports) {
  var Camera = function(coquette, pos, size) {
    this.coquette = coquette;
    this.pos = pos; // Initial position
    this.size = size; // Size of viewport
    this.updateBorders();
    // Shaking
    this.shaking = false;
    this.force = 10;
    this.step = 0;
    this.max = 0;
  };

  Camera.prototype = {
    update: function(tick) {
      if (this.shaking && this.step > 0) {
        var effect = this.force * (this.step/this.max);
        this.pos.x += Math.random()*effect - (effect/2);
        this.pos.y += Math.random()*effect - (effect/2);
        this.step--;
      } else {
        this.max = 0;
        this.shaking = false;
      }
      this.updateBorders();
    },

    prep: function(ctx, backgroundColor) {
      // Move viewport to position
      ctx.setTransform(1,0,0,1,0,0);
      ctx.translate(-this.pos.x + this.size.x/2, -this.pos.y + this.size.y/2);
      // Clear rect
      ctx.clearRect(this.borders.left, this.borders.top, this.size.x, this.size.y);
      // Draw background (moved from Renderer)
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(this.borders.left, this.borders.top, this.size.x, this.size.y);
    },

    followObj: function(obj, speed) {
      this.follow(obj.pos.x, obj.pos.y, speed);
    },

    followPos: function(pos, speed) {
      this.follow(pos.x, pos.y, speed);
    },

    follow: function(x, y, speed) {
      if (speed) {
        // If X-distance is greater than speed (else, just set position)
        if (Math.abs(this.pos.x-x) >= speed) {
          if (this.pos.x > x) this.pos.x -= speed;
          else                this.pos.x += speed;
        } else {
          this.pos.x = x;
        }
        if (Math.abs(this.pos.y-y) >= speed) {
          if (this.pos.y > y) this.pos.y -= speed;
          else                this.pos.y += speed;
        } else {
          this.pos.y = y;
        }
      } else { // Move camera to obj.pos instantly
        this.pos.x = x;
        this.pos.y = y;
      }
    },

    updateBorders: function() {
      this.borders = {
        top: this.pos.y - this.size.y/2,
        left: this.pos.x - this.size.x/2,
        right: this.pos.x + this.size.x/2,
        bottom: this.pos.y + this.size.y/2
      };
    },

    shake: function(steps, force, debug) {
      if (force) { this.force = force; }
      else       { this.force = 10; }
      this.max = steps;
      this.step = steps;
      this.shaking = true;

      if (debug) {
        console.log(
          'Shaking camera with a force of '
          + force + ' for ' + steps/60
          + ' seconds.'
        );
      }
    }
  };

  exports.Camera = Camera;
})(typeof exports === 'undefined' ? this.Coquette : exports);
