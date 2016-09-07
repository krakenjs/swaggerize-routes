const Thing = require('core-util-is');
const Path = require('path');
const pkg = require('../package.json');

const debuglog = require('debuglog')(pkg.name);

module.exports = {
    debuglog: debuglog,

    verbs: [
        'get',
        'post',
        'put',
        'delete',
        'head',
        'options',
        'trace',
        'connect',
        'patch'
    ],

    /**
     * Resolve the given path into a function.
     * @param basedir to search from.
     * @param pathname to resolve.
     * @param method
     * @returns {*}
     */
    resolve: function(basedir, pathname, method) {
        var handler;
        try {
            //If the pathname is already a resolved function, return it.
            //In the case of x-handler and x-authorize, users can define
            //external handler/authorize modules and functions OR override
            //existing x-authorize functions.
            if (Thing.isFunction(pathname)) {
                return pathname;
            }

            pathname = Path.resolve(basedir, pathname);
            handler = require(pathname);

            if (Thing.isFunction(handler)) {
                return handler;
            }

            return method && handler[method];
        }
        catch (error) {
            debuglog('Could not find %s.', pathname);
            return;
        }
    },

    endsWith: function (haystack, needle) {
        if (!haystack || !needle) {
            return false;
        }

        if (needle.length === 1) {
            return haystack[haystack.length - 1] === needle;
        }

        return haystack.slice(haystack.length - needle.length) === needle;
    },

    prefix: function (str, pre) {
        str = str || '';
        if (str.indexOf(pre) === 0) {
            return str;
        }

        str = pre + str;
        return str;
    },

    unprefix: function (str, pre) {
        str = str || '';
        if (str.indexOf(pre) === 0) {
            str = str.substr(pre.length);
            return str;
        }

        return str;
    },

    suffix: function (str, suff) {
        str = str || '';
        if (this.endsWith(str, suff)) {
            return str;
        }

        str = str + suff;
        return str;
    },

    unsuffix: function (str, suff) {
        str = str || '';
        if (this.endsWith(str, suff)) {
            str = str.substr(0, str.length - suff.length);
            return str;
        }

        return str;
    }
};
