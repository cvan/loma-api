var fs = require('fs');
var path = require('path');


module.exports._id = function() {
    return (Math.random() * 1e17) + '';
};


module.exports.now = function() {
    // Returns a UNIX timestamp.
    return Math.floor((new Date()).getTime() / 1000);
};


var mkdirRecursive = module.exports.mkdirRecursive = function(dir) {
    var parent = path.resolve(dir, '../');
    if (!fs.existsSync(parent)) {
        mkdirRecursive(parent);
    }
    fs.mkdirSync(dir);
}


var slugify = module.exports.slugify = function(text) {
    if (typeof text !== 'string') {
        return text;
    }
    return text.toString().toLowerCase()
               .replace(/\s+/g, '-')           // Replace spaces with -
               .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
               .replace(/\-\-+/g, '-')         // Replace multiple - with single -
               .replace(/^-+/, '')             // Trim - from start of text
               .replace(/-+$/, '');            // Trim - from end of text
}


var globEach = module.exports.globEach = function(path_, ext, callback, doneCallback) {
    var wildcard = ext === '*';
    if (!doneCallback) {
        doneCallback = function() {};
    }

    fs.readdir(path_, function(err, list) {
        if (err) return doneCallback(err);
        var pending = list.length;
        if (!pending) return doneCallback(null);
        list.forEach(function(file) {
            file = path_ + '/' + file;
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    module.exports.globEach(file, ext, callback, function(err) {
                        if (!--pending) doneCallback(err);
                    });
                } else {
                    // If it's got the right extension, add it to the list.
                    if (wildcard || file.substr(file.length - ext.length) == ext)
                        callback(path.normalize(file));
                    if (!--pending) doneCallback(null);
                }
            });
        });
    });
};


module.exports.glob = function(path_, ext, done) {
    var results = [];
    globEach(path_, ext, function(data) {
        results.push(data);
    }, function(err) {
        if (done) {
            if (err) {
                done(err);
            } else {
                done(null, results);
            }
        }
    });
};


module.exports.globSync = function(path_, ext, done) {
    var results = [];
    var list = fs.readdirSync(path_);
    var pending = list.length;
    var wildcard = ext === '*';

    if (!pending) return done(null, results);
    list.forEach(function(file) {
        file = path_ + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            module.exports.globSync(file, ext, function(err, res) {
                results = results.concat(res);
                if (!--pending) done(null, results);
            });
        } else {
            // If it's got the right extension, add it to the list.
            if (wildcard || file.substr(file.length - ext.length) == ext)
                results.push(path.normalize(file));
            if (!--pending) done(null, results);
        }
    });
};


module.exports.removeFile = function(path, callback, silent) {
    fs.exists(path, function(exists) {
        if (!exists) {
            if (!silent) {
                console.warn('Cannot remove non-existing file: ' + path);
            }
            return;
        }

        fs.unlink(path, function(err) {
            if (!silent) {
                if (err) {
                    console.warn('Unable to delete file: ' + path, err);
                }
            }
            if (callback) callback(err);
        });
    });
};
