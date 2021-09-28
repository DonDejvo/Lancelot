import { Add, Sub } from "./qwer.js";

let __export = {
  Add,
  Sub
};

if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = __export;
} else if (typeof define === 'function' && define.amd) {
    define('asdf', [], __export);
} else {
    let global = typeof globalThis !== 'undefined' ? globalThis : self;
    global['asdf'] = __export;
}

export default __export;
