export const fillRing = function(ctx, x, y, r1, r2) {
    const strokeStyle = ctx.strokeStyle,
    lineWidth = ctx.lineWidth;
    ctx.beginPath();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = r2 - r1;
    ctx.arc(x, y, r1 + (r2 - r1) / 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
}

export const strokeRing = function(ctx, x, y, r1, r2) {
    ctx.beginPath();
    ctx.arc(x, y, r1, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r2, 0, 2 * Math.PI);
    ctx.stroke();
}

export const polygon = function(ctx, ...points) {
    for(let i = 0; i <= points.length; ++i) {
        const v = points[i % points.length];
        if(i == 0) {
            const len = v.length;
            ctx.moveTo(v[len - 2], v[len - 1]);
        } else {
            if(v.length == 6) {
                ctx.bezierCurveTo(...v);
            } else if(v.length == 4) {
                ctx.quadraticCurveTo(...v);
            } else {
                ctx.lineTo(...v);
            }
        }
    }
}

export const roundedRect = function(ctx, x, y, w, h, r) {
    polygon(ctx, [x, y + r],
    [x, y, x + r, y],
    [w + x-r, y],
    [w + x, y, w + x, y + r],
    [w + x, h + y-r],
    [w + x, h + y, w + x-r, h + y],
    [x + r, h + y],
    [x, h + y, x, h + y-r]);
}

export const regularPolygon = function(ctx, x, y, r, c) {
    const points = [];
    for(let i = 0; i < c; ++i) {
        const angle = 2 * Math.PI * (i / c - 0.25);
        points.push([x + Math.cos(angle) * r, y + Math.sin(angle) * r]);
    }
    polygon(ctx, ...points);
}

export const star = function(ctx, x, y, r1, r2, c) {
    const count = c * 2;
    const points = [];
    for(let i = 0; i < count; ++i) {
        const angle = 2 * Math.PI * (i / count - 0.25);
        const d = i % 2 ? r1 : r2;
        points.push([x + Math.cos(angle) * d, y + Math.sin(angle) * d]);
    }
    polygon(ctx, ...points);
}