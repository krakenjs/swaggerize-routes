/* eslint-disable no-param-reassign */
const pkg = require('../package.json');

module.exports = {
  // eslint-disable-next-line global-require
  debuglog: require('debuglog')(pkg.name),

  verbs: [
    'get',
    'post',
    'put',
    'delete',
    'head',
    'options',
    'trace',
    'connect',
    'patch',
  ],

  endsWith(haystack, needle) {
    if (!haystack || !needle) {
      return false;
    }

    if (needle.length === 1) {
      return haystack[haystack.length - 1] === needle;
    }

    return haystack.slice(haystack.length - needle.length) === needle;
  },

  prefix(str, pre) {
    str = str || '';
    if (str.indexOf(pre) === 0) {
      return str;
    }

    str = pre + str;
    return str;
  },

  unprefix(str, pre) {
    str = str || '';
    if (str.indexOf(pre) === 0) {
      str = str.substr(pre.length);
      return str;
    }

    return str;
  },

  suffix(str, suff) {
    str = str || '';
    if (this.endsWith(str, suff)) {
      return str;
    }

    str += suff;
    return str;
  },

  unsuffix(str, suff) {
    str = str || '';
    if (this.endsWith(str, suff)) {
      str = str.substr(0, str.length - suff.length);
      return str;
    }

    return str;
  },
};
