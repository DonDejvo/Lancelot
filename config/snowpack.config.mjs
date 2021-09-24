// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
    mount: {
        '../web-tests': '/',
        '../src': '/src'
    }
};
