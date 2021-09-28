import { Add, Sub } from "./qwer.js";

let __export = {
  Add,
  Sub
};

if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = __export;
} else if (typeof define === 'function' && define.amd) {
    define('RayBurst', [], __export);
} else {
    let global = typeof globalThis !== 'undefined' ? globalThis : self;
    global['RayBurst'] == __export;
}

export default __export;
