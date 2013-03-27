var exec = require('child_process').exec
  , fs = require('fs')
  , jpegmini = exports;

/**
 * Quality constants.
 */

jpegmini.MEDIUM = 2;
jpegmini.HIGH = 1;
jpegmini.BEST = 0;

/**
 * Manage concurrency.
 */

jpegmini.concurrency = 1;

/**
 * Optimise an image.
 *
 * @param {String} path
 * @param {Object} options (optional) - see `jpegmini.process()`
 * @param {Function} callback
 */

jpegmini.optimise = function (path, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }
    jpegmini.getOptimisedFlag(path, function (err, optimised) {
        if (err) {
            return callback(err);
        } else if (optimised) {
            return callback();
        }
        options.input = path;
        options.tmp_dir = (options.tmp_dir || '/tmp').replace(/\/$/g, '');
        options.output = options.tmp_dir + '/' + randomString() + '.jpg';
        jpegmini.process(options, function (err) {
            if (err) {
                return callback(err);
            }
            fs.rename(options.output, path, function (err) {
                if (err) {
                    if (err.code === 'EXDEV') {
                        return copyFile(options.output, path, function (err) {
                            fs.unlink(options.output, function () {});
                            callback(err);
                        });
                    }
                    return callback(err);
                }
                callback(null, true);
            });
        });
    });
};

/**
 * Process an image.
 *
 * @param {Object} options
 * @param {Function} callback
 */

jpegmini.process = function (options, callback) {
    var cli = {};
    if (options.input) {
        cli.f = options.input;
    }
    if (options.output) {
        cli.o = options.output;
    }
    if (options.recurse !== false) {
        cli.r = 1;
    } else {
        cli.r = 0;
    }
    if (options.license_cache) {
        cli.lc = options.license_cache;
    }
    if (options.resize) {
        cli.rsz = options.resize;
    }
    switch (options.quality) {
        case jpegmini.MEDIUM:
            cli.qual = 2;
            break;
        case jpegmini.HIGH:
            cli.qual = 1;
            break;
        default:
            cli.qual = 0;
            break;
    }
    if (options.skip_compressed) {
        cli.shc = 1;
    }
    if (options.remove_metadata) {
        cli.rmt = 1;
    }
    jpegmini.exec(cli, callback);
};

/**
 * Logout a jpegmini license cache.
 *
 * @param {String} cache_path
 * @param {Function} callback (optional)
 */

jpegmini.logout = function (cache_path, callback) {
    //Jpegmini requires a -f option even if we just want to logout the license
    jpegmini.exec({ lc_logout: cache_path, f: '/tmp/_.jpg' }, function (err) {
        if (err.message.indexOf('7032') !== -1) {
            err = null;
        }
        if (callback) {
            callback(err);
        }
    });
};

/**
 * Check whether the image has been optimised by jpegmini.
 *
 * The jpegmini app (mac) uses the jpeg comment field to check whether
 * the image has been processed already. The jpegmini server binary does
 * not exhibit the same behaviour but may in a future release. Until that
 * time we use exiftool to set the comment
 *
 * @param {String} path
 * @param {Function} callback
 */

jpegmini.getOptimisedFlag = function (path, callback) {
    jpegmini.exiftool({ comment: null }, path, function (err, comment) {
        if (err) {
            return callback(err);
        }
        callback(null, (comment || '').toLowerCase().indexOf('jpegmini') !== -1);
    });
};

/**
 * Execute the jpegmini binary.
 */

jpegmini.exec = function (options, callback) {
    exec('jpegmini ' + optionString(options), callback);
};

/**
 * Execute the exiftool binary.
 */

jpegmini.exiftool = function (options, path, callback) {
    path = '"' + path.replace(/"/g, '\\"').replace(/`/g, '') + '"';
    exec('exiftool ' + optionString(options) + ' ' + path, callback);
};

/**
 * Convert an options object to a string.
 */

function optionString(options) {
    return Object.keys(options).map(function (key) {
        var value = options[key];
        if (value === null) {
            return '-' + key;
        } else if (typeof value === 'number') {
            value += '';
        } else if (typeof value === 'string') {
            value = '"' + value.replace(/"/g, '\\"') + '"';
        }
        return '-' + key + '=' + value.replace(/`/g, '');
    }).join(' ');
}

/**
 * Get a random 32 byte string.
 */

function randomString() {
    var str = '', length = 32;
    while (length--) {
        str += String.fromCharCode(Math.random() * 26 | 97);
    }
    return str;
}

/**
 * Manage concurrency.
 */

var queued = [], pending = 0
  , jpegmini_exec = jpegmini.exec;

jpegmini.exec = function () {
    var args = Array.prototype.slice.call(arguments)
      , scope = this;
    if (pending >= jpegmini.concurrency) {
        return queued.push({ args: args, scope: scope });
    }
    var callback = args.pop();
    args.push(function () {
        var args = Array.prototype.slice.call(arguments);
        process.nextTick(function () {
            callback.apply(this, args);
            pending--;
            while (pending < jpegmini.concurrency && queued.length) {
                var next = queued.shift();
                pending++;
                jpegmini_exec.apply(next.scope, next.args);
            }
        });
    });
    pending++;
    jpegmini_exec.apply(this, args);
};

/**
 * Copy a file.
 */

function copyFile(source, target, callback) {
    var reader = fs.createReadStream(source)
      , writer = fs.createWriteStream(target)
      , done = false;
    reader.on('error', oncomplete);
    writer.on('error', oncomplete);
    writer.on('close', oncomplete);
    reader.pipe(writer);
    function oncomplete(err) {
        if (!done) {
            callback(err);
            done = true;
        }
    }
}

