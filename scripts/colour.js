"use strict";
class Colour {
    constructor(red, green, blue, alpha) {
        this.red = Math.clamp(0, red, 255);
        this.green = Math.clamp(0, green, 255);
        this.blue = Math.clamp(0, blue, 255);
        if (typeof alpha !== 'undefined') {
            this.alpha = Math.clamp(0.0, alpha, 1.0);
        }
        else {
            this.alpha = 1.0;
        }
    }
    toString() {
        return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
    }
}
Colour.White = new Colour(255, 255, 255);
Colour.Grey = new Colour(128, 128, 128);
Colour.Black = new Colour(0, 0, 0);
Colour.Pink = new Colour(245, 169, 184);
Colour.LightBlue = new Colour(91, 206, 250);
Colour.Red = new Colour(228, 3, 3);
Colour.Orange = new Colour(255, 140, 0);
Colour.Yellow = new Colour(255, 237, 0);
Colour.Green = new Colour(0, 128, 38);
Colour.Blue = new Colour(36, 64, 142);
Colour.Violet = new Colour(115, 41, 130);
