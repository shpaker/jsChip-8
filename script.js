function draw(canvas, pixels) {
    'use strict';
    var i,
		len,
		context = canvas.context;

    for (i = 0, len = pixels.length; i < len; i++) {
        if (pixels[i].isRedraw()) {
            var x = i / 64 | 0,
				y = i - x * 64;
            context.fillStyle = pixels[i].isActive() ? canvas.color[0] : canvas.color[1];
            context.fillRect(y * 8, x * 8, 8, 8);
            pixels[i].draw();
        }
    }
}


