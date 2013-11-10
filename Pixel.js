var Pixel = function () {
    "use strict";
    var active = false,
		redraw = true;
    // "Добавление" пиксела
    this.add = function () {
        if (!active) {
            active = true;
            redraw = true;
            return true;
        }
        else {
            return false;
        }
    }
    // "Удаление" пиксела
    this.rem = function () {
        if (active) {
            active = false;
            redraw = true;
            return true;
        }
        else {
            return false;
        }
    }
    // Пометить пиксель к отрисовке
    this.draw = function () {
        redraw = false;
    }
    // Проверка следует ли перерисовывать пиксел
    this.isRedraw = function () {
        return redraw;
    }
    // Активность пикселя
    this.isActive = function () {
        return active;
    }
}