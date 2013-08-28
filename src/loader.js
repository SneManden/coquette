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
