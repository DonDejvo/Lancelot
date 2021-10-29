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
        in_range(x, a, b) {
            return x >= a && x <= b;
        },
        sat(x) {
            return this.clamp(x, 0, 1);
        },
        ease_out(x) {
            return this.sat(x ** 0.5);
        },
        ease_in(x) {
            return this.sat(x ** 3);
        },
        choice(arr) {
            const len = arr.length;
            return arr[this.randint(0, len - 1)];
        },
        shuffle(arr) {
            const len = arr.length;
            for(let i = 0; i < len; ++i) {
                const j = this.randint(0, len - 1);
                [ arr[i], arr[j] ] = [ arr[j], arr[i] ];
            }
        }
    };
})();