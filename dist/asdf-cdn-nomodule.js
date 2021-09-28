(() => {
  // src/qwer.js
  var Add = (a, b) => a + b;
  var Sub = (a, b) => a - b;

  // src/asdf.js
  var __export = {
    Add,
    Sub
  };
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = __export;
  } else if (typeof define === "function" && define.amd) {
    define("RayBurst", [], __export);
  } else {
    let global = typeof globalThis !== "undefined" ? globalThis : self;
    global["RayBurst"] == __export;
  }
  var asdf_default = __export;
})();
