/*
    
*/
var Pixel = function () {
    "use strict";
    var active = false,
		redraw = true;
    // "����������" �������
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
    // "��������" �������
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
    // �������� ������� � ���������
    this.draw = function () {
        redraw = false;
    }
    // �������� ������� �� �������������� ������
    this.isRedraw = function () {
        return redraw;
    }
    // ���������� �������
    this.isActive = function () {
        return active;
    }
}