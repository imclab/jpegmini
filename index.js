var exec = require('child_process').exec;

exports.MEDIUM = 2;
exports.HIGH = 1;
exports.BEST = 0;

function optionString(options) {
    return Object.keys(options).map(function (key) {
        var value = options[key];
        if (value == null) {
            return '-' + key;
        } else if (typeof value === 'number') {
            value += '';
        } else if (typeof value === 'string') {
            value = '"' + value.replace(/"/g, '\\"') + '"';
        }
        return '-' + key + '=' + value.replace(/`/g, '');
    }).join(' ');
}

function jpegmini(options, callback) {
    exec('jpegmini ' + optionString(options), callback);
}

function exiftool(options, path, callback) {
    path = '"' + path.replace(/"/g, '\\"').replace(/`/g, '') + '"';
    exec('exiftool ' + optionString(options) + ' ' + path, callback);
}

exports.process = function (options, callback) {
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
        case exports.MEDIUM:
            cli.qual = 2;
            break;
        case exports.HIGH:
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
    jpegmini(cli, callback);
};

exports.logout = function (cache, callback) {
    //Jpegmini requires a -f option even if we just want to logout the license
    jpegmini({ lc_logout: cache, f: '/tmp/_.jpg' }, function (err) {
        if (err.message.indexOf('7032') !== -1) {
            err = null;
        }
        callback(err);
    });
};

exports.getOptimisedFlag = function (path, callback) {
    exiftool({ 'comment': null }, path, function (err, comment) {
        if (err) {
            return callback(err);
        }
        callback(null, (comment || '').toLowerCase().indexOf('jpegmini') !== -1);
    });
};

exports.setOptimisedFlag = function (path, callback) {
    exiftool({ 'comment': 'Optimized by JPEGmini' }, path, callback);
};

