export const math = (function () {
    return {
        rand(min, max) {
            return Math.random() * (max - min) + min;
        },
        randint(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },
        lerp(x, a, b) {
            return a + (b - a) * x;
        },
        clamp(x, a, b) {
            return Math.min(Math.max(x, a), b);
        },
        isBetween(x, a, b) {
            return x >= a && x <= b;
        },
        sat(x) {
            return this.clamp(x, 0, 1);
        },
        choice(arr) {
            const len = arr.length;
            return arr[this.randint(0, len - 1)];
        },
        shuffle(arr) {
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const j = this.randint(0, len - 1);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        },
        easeIn(x) {
            return Math.cos(Math.PI * (1 + 0.5 * x)) + 1;
        },
        easeOut(x) {
            return Math.sin(Math.PI * 0.5 * x);
        },
        easeInOut(x) {
            return Math.cos(Math.PI * (1 + x)) / 2 + 0.5;
        }
    };
})();