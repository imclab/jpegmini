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
            jpegmini.setOptimisedFlag(options.output, function (err) {
                if (err) {
                    return callback(err);
                }
                fs.rename(options.output, path, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, true);
                });
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
    exec_jpegmini(cli, callback);
};

/**
 * Logout a jpegmini license cache.
 *
 * @param {String} cache_path
 * @param {Function} callback (optional)
 */

jpegmini.logout = function (cache_path, callback) {
    //Jpegmini requires a -f option even if we just want to logout the license
    exec_jpegmini({ lc_logout: cache_path, f: '/tmp/_.jpg' }, function (err) {
        if (err.message.indexOf('7032') !== -1) {
            err = null;
        }
        callback && callback(err);
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
    exec_exiftool({ 'comment': null }, path, function (err, comment) {
        if (err) {
            return callback(err);
        }
        callback(null, (comment || '').toLowerCase().indexOf('jpegmini') !== -1);
    });
};

/**
 * Set the optimisation flag.
 *
 * @param {String} path
 * @param {Function} callback
 */

jpegmini.setOptimisedFlag = function (path, callback) {
    exec_exiftool({ 'comment': 'Optimized by JPEGmini' }, path, callback);
};

/**
 * Execute the jpegmini binary.
 */

function exec_jpegmini(options, callback) {
    exec('jpegmini ' + optionString(options), callback);
}

/**
 * Execute the exiftool binary.
 */

function exec_exiftool(options, path, callback) {
    path = '"' + path.replace(/"/g, '\\"').replace(/`/g, '') + '"';
    exec('exiftool ' + optionString(options) + ' ' + path, callback);
}

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

