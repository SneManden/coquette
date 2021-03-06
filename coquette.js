;(function(exports) {
  var Coquette = function(game, canvasId, width, height, backgroundColor, autoFocus) {
    var canvas = document.getElementById(canvasId);
    this.loader = new Coquette.Loader(this);
    this.renderer = new Coquette.Renderer(this, game, canvas, width,height, backgroundColor);
    this.inputter = new Coquette.Inputter(this, canvas, autoFocus);
    this.entities = new Coquette.Entities(this, game);
    this.runner = new Coquette.Runner(this);
    this.collider = new Coquette.Collider(this);
    this.camera = new Coquette.Camera(this, {x:width/2, y:height/2}, {x:width, y:height});

    var self = this;
    new Coquette.Ticker(this, function(interval) {
      self.collider.update(interval);
      self.runner.update(interval);
      self.camera.update(interval);
      if (game.update !== undefined) {
        game.update(interval);
      }
      
      self.camera.prep(self.renderer.getCtx(), backgroundColor);
      self.entities.update(interval)
      self.renderer.update(interval);
    });
  };

  exports.Coquette = Coquette;
})(this);

;(function(exports) {
  var Collider = function(coquette) {
    this.coquette = coquette;
  };

  Collider.prototype = {
    collideRecords: [],

    update: function() {
      var ent = this.coquette.entities.all();
      for (var i = 0, len = ent.length; i < len; i++) {
        for (var j = i; j < len; j++) {
          if (ent[i] !== ent[j]) {
            if (this.isIntersecting(ent[i], ent[j])) {
              this.collision(ent[i], ent[j]);
            } else {
              this.removeOldCollision(ent[i], ent[j]);
            }
          }
        }
      }
    },

    collision: function(entity1, entity2) {
      if (this.getCollideRecord(entity1, entity2) === undefined) {
        this.collideRecords.push([entity1, entity2]);
        notifyEntityOfCollision(entity1, entity2, this.INITIAL);
        notifyEntityOfCollision(entity2, entity1, this.INITIAL);
      } else {
        notifyEntityOfCollision(entity1, entity2, this.SUSTAINED);
        notifyEntityOfCollision(entity2, entity1, this.SUSTAINED);
      }
    },

    removeEntity: function(entity) {
      this.removeOldCollision(entity);
    },

    // if passed entities recorded as colliding in history record, remove that record
    removeOldCollision: function(entity1, entity2) {
      var recordId = this.getCollideRecord(entity1, entity2);
      if (recordId !== undefined) {
        var record = this.collideRecords[recordId];
        notifyEntityOfUncollision(record[0], record[1])
        notifyEntityOfUncollision(record[1], record[0])
        this.collideRecords.splice(recordId, 1);
      }
    },

    getCollideRecord: function(entity1, entity2) {
      for (var i = 0, len = this.collideRecords.length; i < len; i++) {
        // looking for coll where one entity appears
        if (entity2 === undefined &&
            (this.collideRecords[i][0] === entity1 ||
             this.collideRecords[i][1] === entity1)) {
          return i;
        // looking for coll between two specific entities
        } else if (this.collideRecords[i][0] === entity1 &&
                   this.collideRecords[i][1] === entity2) {
          return i;
        }
      }
    },

    isIntersecting: function(obj1, obj2) {
      var obj1BoundingBox = obj1.boundingBox || this.RECTANGLE;
      var obj2BoundingBox = obj2.boundingBox || this.RECTANGLE;
      if (obj1BoundingBox === this.RECTANGLE &&
          obj2BoundingBox === this.RECTANGLE) {
        return Maths.rectanglesIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.CIRCLE &&
                 obj2BoundingBox === this.CIRCLE) {
        return Maths.circlesIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.CIRCLE) {
        return Maths.circleAndRectangleIntersecting(obj1, obj2);
      } else if (obj1BoundingBox === this.RECTANGLE) {
        return Maths.circleAndRectangleIntersecting(obj2, obj1);
      } else {
        throw "Objects being collision tested have unsupported bounding box types."
      }
    },

    INITIAL: 0,
    SUSTAINED: 1,

    RECTANGLE: 0,
    CIRCLE: 1
  };

  var notifyEntityOfCollision = function(entity, other, type) {
    if (entity.collision !== undefined) {
      entity.collision(other, type);
    }
  };

  var notifyEntityOfUncollision = function(entity, other) {
    if (entity.uncollision !== undefined) {
      entity.uncollision(other);
    }
  };

  var Maths = {
    center: function(obj) {
      if(obj.pos !== undefined) {
        return {
          x: obj.pos.x + (obj.size.x / 2),
          y: obj.pos.y + (obj.size.y / 2),
        };
      }
    },

    circlesIntersecting: function(obj1, obj2) {
      return Maths.distance(Maths.center(obj1), Maths.center(obj2)) <
        obj1.size.x / 2 + obj2.size.x / 2;
    },

    pointInsideObj: function(point, obj) {
      return point.x >= obj.pos.x
        && point.y >= obj.pos.y
        && point.x <= obj.pos.x + obj.size.x
        && point.y <= obj.pos.y + obj.size.y;
    },

    rectanglesIntersecting: function(obj1, obj2) {
      if(obj1.pos.x + obj1.size.x < obj2.pos.x) {
        return false;
      } else if(obj1.pos.x > obj2.pos.x + obj2.size.x) {
        return false;
      } else if(obj1.pos.y > obj2.pos.y + obj2.size.y) {
        return false;
      } else if(obj1.pos.y + obj1.size.y < obj2.pos.y) {
        return false
      } else {
        return true;
      }
    },

    distance: function(point1, point2) {
      var x = point1.x - point2.x;
      var y = point1.y - point2.y;
      return Math.sqrt((x * x) + (y * y));
    },

    rectangleCorners: function(rectangleObj) {
      var corners = [];
      corners.push({ x:rectangleObj.pos.x, y: rectangleObj.pos.y });
      corners.push({ x:rectangleObj.pos.x + rectangleObj.size.x, y:rectangleObj.pos.y });
      corners.push({
        x:rectangleObj.pos.x + rectangleObj.size.x,
        y:rectangleObj.pos.y + rectangleObj.size.y
      });
      corners.push({ x:rectangleObj.pos.x, y: rectangleObj.pos.y + rectangleObj.size.y });
      return corners;
    },

    vectorTo: function(start, end) {
      return {
        x: end.x - start.x,
        y: end.y - start.y
      };
    },

    magnitude: function(vector) {
      return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    },

    dotProduct: function(vector1, vector2) {
      return vector1.x * vector2.x + vector1.y * vector2.y;
    },

    unitVector: function(vector) {
      return {
        x: vector.x / Maths.magnitude(vector),
        y: vector.y / Maths.magnitude(vector)
      };
    },

    closestPointOnSeg: function(linePointA, linePointB, circ_pos) {
      var seg_v = Maths.vectorTo(linePointA, linePointB);
      var pt_v = Maths.vectorTo(linePointA, circ_pos);
      if (Maths.magnitude(seg_v) <= 0) {
        throw "Invalid segment length";
      }

      var seg_v_unit = Maths.unitVector(seg_v);
      var proj = Maths.dotProduct(pt_v, seg_v_unit);
      if (proj <= 0) {
        return linePointA;
      } else if (proj >= Maths.magnitude(seg_v)) {
        return linePointB;
      } else {
        return {
          x: linePointA.x + seg_v_unit.x * proj,
          y: linePointA.y + seg_v_unit.y * proj
        };
      }
    },

    isLineIntersectingCircle: function(circleObj, linePointA, linePointB) {
      var circ_pos = {
        x: circleObj.pos.x + circleObj.size.x / 2,
        y: circleObj.pos.y + circleObj.size.y / 2
      };

      var closest = Maths.closestPointOnSeg(linePointA, linePointB, circ_pos);
      var dist_v = Maths.vectorTo(closest, circ_pos);
      return Maths.magnitude(dist_v) < circleObj.size.x / 2;
    },

    circleAndRectangleIntersecting: function(circleObj, rectangleObj) {
      var corners = Maths.rectangleCorners(rectangleObj);
      return Maths.pointInsideObj(Maths.center(circleObj), rectangleObj) ||
        Maths.isLineIntersectingCircle(circleObj, corners[0], corners[1]) ||
        Maths.isLineIntersectingCircle(circleObj, corners[1], corners[2]) ||
        Maths.isLineIntersectingCircle(circleObj, corners[2], corners[3]) ||
        Maths.isLineIntersectingCircle(circleObj, corners[3], corners[0]);
    },
  };

  exports.Collider = Collider;
  exports.Collider.Maths = Maths;
})(typeof exports === 'undefined' ? this.Coquette : exports);

 ;(function(exports) {
  var Inputter = function(coquette, canvas, autoFocus) {
    this.coquette = coquette;
    if (autoFocus === undefined) {
      autoFocus = true;
    }

    var self = this;
    var inputReceiverElement = window;
    if (!autoFocus) {
      inputReceiverElement = canvas;
      inputReceiverElement.contentEditable = true; // lets canvas get focus and get key events
      this.suppressedKeys = [];
    } else {
      this.supressedKeys = [
        this.SPACE,
        this.LEFT_ARROW,
        this.UP_ARROW,
        this.RIGHT_ARROW,
        this.DOWN_ARROW
      ];

      // suppress scrolling
      window.addEventListener("keydown", function(e) {
        if(self.supressedKeys.indexOf(e.keyCode) > -1) {
          e.preventDefault();
        }
      }, false);
    }

    inputReceiverElement.addEventListener('keydown', this.keydown.bind(this), false);
    inputReceiverElement.addEventListener('keyup', this.keyup.bind(this), false);
  };

  Inputter.prototype = {
    _state: {},
    bindings: {},

    state: function(keyCode, state) {
      if (state !== undefined) {
        this._state[keyCode] = state;
      } else {
        return this._state[keyCode] || false;
      }
    },

    keydown: function(e) {
      this.state(e.keyCode, true);
    },

    keyup: function(e) {
      this.state(e.keyCode, false);
    },

    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    PAUSE: 19,
    CAPS_LOCK: 20,
    ESC: 27,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT_ARROW: 37,
    UP_ARROW: 38,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    INSERT: 45,
    DELETE: 46,
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    SEMI_COLON: 186,
    EQUALS: 187,
    COMMA: 188,
    DASH: 189,
    PERIOD: 190,
    FORWARD_SLASH: 191,
    GRAVE_ACCENT: 192,
    OPEN_SQUARE_BRACKET: 219,
    BACK_SLASH: 220,
    CLOSE_SQUARE_BRACKET: 221,
    SINGLE_QUOTE: 222

  };
  exports.Inputter = Inputter;
})(typeof exports === 'undefined' ? this.Coquette : exports);

;(function(exports) {
  function Runner(coquette) {
    this.coquette = coquette;
    this.runs = [];
  };

  Runner.prototype = {
    update: function() {
      this.run();
    },

    run: function() {
      while(this.runs.length > 0) {
        var run = this.runs.pop();
        run.fn(run.obj);
      }
    },

    add: function(obj, fn) {
      this.runs.push({
        obj: obj,
        fn: fn
      });
    }
  };

  exports.Runner = Runner;
})(typeof exports === 'undefined' ? this.Coquette : exports);

;(function(exports) {
  var interval = 16;

  function Ticker(coquette, gameLoop) {
    setupRequestAnimationFrame();
    var prev = new Date().getTime();

    var self = this;
    var tick = function() {
      var now = new Date().getTime();
      var interval = now - prev;
      prev = now;
      gameLoop(interval);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  // From: https://gist.github.com/paulirish/1579671
  // Thanks Erik, Paul and Tino
  var setupRequestAnimationFrame = function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
        || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, interval - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                                   timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
  };

  exports.Ticker = Ticker;
})(typeof exports === 'undefined' ? this.Coquette : exports);

;(function(exports) {
  var Renderer = function(coquette, game, canvas, width, height, backgroundColor) {
    this.coquette = coquette;
    this.game = game;
    canvas.style.outline = "none"; // stop browser outlining canvas when it has focus
    canvas.style.cursor = "default"; // keep pointer normal when hovering over canvas
    this.ctx = canvas.getContext('2d');
    this.backgroundColor = backgroundColor;
    canvas.width = this.width = width;
    canvas.height = this.height = height;
  };

  Renderer.prototype = {
    getCtx: function() {
      return this.ctx;
    },

    update: function(interval) {
      var ctx = this.getCtx();

      // draw background
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, this.width, this.height);

      // draw game and entities
      var drawables = [this.game].concat(this.coquette.entities.all());
      for (var i = 0, len = drawables.length; i < len; i++) {
        if (drawables[i].draw !== undefined) {
          drawables[i].draw(ctx);
        }
      }
    },

    center: function() {
      return {
        x: this.width / 2,
        y: this.height / 2
      };
    },

    onScreen: function(obj) {
      return obj.pos.x > 0 && obj.pos.x < this.coquette.renderer.width &&
        obj.pos.y > 0 && obj.pos.y < this.coquette.renderer.height;
    }
  };

  exports.Renderer = Renderer;
})(typeof exports === 'undefined' ? this.Coquette : exports);

;(function(exports) {
  function Entities(coquette, game) {
    this.coquette = coquette;
    this.game = game;
    this._entities = [];
  };

  Entities.prototype = {
    update: function(interval) {
      var entities = this.all();
      for (var i = 0, len = entities.length; i < len; i++) {
        if (entities[i].update !== undefined) {
          entities[i].update(interval);
        }
      }
    },

    all: function(Constructor) {
      if (Constructor === undefined) {
        return this._entities;
      } else {
        var entities = [];
        for (var i = 0; i < this._entities.length; i++) {
          if (this._entities[i] instanceof Constructor) {
            entities.push(this._entities[i]);
          }
        }

        return entities;
      }
    },

    create: function(clazz, settings, callback) {
      var self = this;
      this.coquette.runner.add(this, function(entities) {
        var entity = new clazz(self.game, settings || {});
        entities._entities.push(entity);
        zindexSort(self.all());
        if (callback !== undefined) {
          callback(entity);
        }
      });
    },

    destroy: function(entity, callback) {
      var self = this;
      this.coquette.runner.add(this, function(entities) {
        for(var i = 0; i < entities._entities.length; i++) {
          if(entities._entities[i] === entity) {
            entities._entities.splice(i, 1);
            if (callback !== undefined) {
              callback();
            }
            break;
          }
        }
      });
    }
  };

  // sorts passed array by zindex
  // elements with a higher zindex are drawn on top of those with a lower zindex
  var zindexSort = function(arr) {
    arr.sort(function(a, b) {
      var aSort = (a.zindex || 0);
      var bSort = (b.zindex || 0);
      return aSort < bSort ? -1 : 1;
    });
  };

  exports.Entities = Entities;
})(typeof exports === 'undefined' ? this.Coquette : exports);

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

;(function(exports) {
    var Loader = function(coquette) {
        this.coquette = coquette;

        this.imagesLoaded = 0;
        this.audioLoaded = 0;
        this.imageQueue = [];
        this.audioQueue = [];
        this.resources = {};
        this.cache = {};
    };

    Loader.prototype = {

        addImage: function(resource) {
            this.imageQueue.push(resource);
        },

        addAudio: function(resource) {
            this.audioQueue.push(resource);
        },

        addQueue: function(queue) {
            for (var i=0; i<queue.length; i++) {
                if (queue[i].type == 'image')
                    this.addImage(queue[i]);
                else if (queue[i].type == 'audio')
                    this.addAudio(queue[i]);
                else
                    throw 'Invalid datatype';
            }
        },

        get: function(name) {
            var path = this.resources[name].path;
            return this.cache[path];
        },

        total: function() {
            return (this.imageQueue.length + this.audioQueue.length);
        },

        loaded: function() {
            return (this.imagesLoaded + this.audioLoaded);
        },
        
        imagesFinished: function() {
            return (this.imageQueue.length == this.imagesLoaded);
        },

        audioFinished: function() {
            return (this.audioQueue.length == this.audioLoaded);
        },

        complete: function(callback) {
            console.log('All resources has been downloaded');
            callback();
        },

        downloadAll: function(callback) {
            var noImages = this.downloadImages(callback);
            var noAudio = this.downloadAudio(callback);

            if (noImages && noAudio)
                this.complete(callback);
        },

        downloadImages: function(callback) {
            if (this.imageQueue.length == 0) return true;

            for (var i=0; i<this.imageQueue.length; i++) {
                var resource = this.imageQueue[i],
                    res = new Image(),
                    self = this;

                res.addEventListener('load', function() {
                    self.imagesLoaded++;
                    console.log('Image loaded: ' + this.src);
                    if (self.imagesFinished() && self.audioFinished())
                        self.complete(callback);
                }, false);
                res.addEventListener('error', function() {
                    throw 'Image '+ this.src +' could not be loaded';
                }, false);

                res.src = resource.path;
                this.cache[resource.path] = res;
                this.resources[resource.name] = {path: resource.path};
            }
        },

        downloadAudio: function(callback) {
            if (this.audioQueue.length == 0) return true;

            for (var i=0; i<this.audioQueue.length; i++) {
                var resource = this.audioQueue[i],
                    res = new Audio(),
                    self = this;

                res.addEventListener('canplaythrough', function() {
                    self.audioLoaded++;
                    console.log('Audio loaded: ' + this.src);
                    if (self.imagesFinished() && self.audioFinished())
                        self.complete(callback);
                }, false);

                res.src = resource.path;
                this.cache[resource.path] = res;
                this.resources[resource.name] = {path: resource.path};
            }
        }

        // TODO: use this to throw errors when trying to load
        //       in case of unsupported formats
        // supportAudio: function() {
        //     var type = ['audio/mpeg', 'audio/ogg', 'audio/wav'],
        //         supportedAudio = [];
        //     for (var i=0; i<type.length; i++) {
        //         var a = document.createElement('audio'),
        //             support = !!(a.canPlayType && a.canPlayType(type[i]).replace('/no/', ''));
        //         supportedAudio.push({type:type[i], supported:support});
        //     }
        //     return supportedAudio;
        // },

    };

    exports.Loader = Loader;
})(typeof exports === 'undefined' ? this.Coquette : exports);

