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
    adjustAlpha(alpha) {
        return new Colour(this.red, this.green, this.blue, Math.clamp(0.0, alpha, 1.0));
    }
    toString() {
        return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
    }
}
Colour.Invisible = new Colour(255, 255, 255, 0.0);
Colour.White = new Colour(255, 255, 255);
Colour.LightGrey = new Colour(196, 196, 196);
Colour.Grey = new Colour(128, 128, 128);
Colour.DarkGrey = new Colour(64, 64, 64);
Colour.Black = new Colour(0, 0, 0);
Colour.HotPink = new Colour(255, 105, 180);
Colour.Red = new Colour(255, 0, 0);
Colour.Orange = new Colour(255, 142, 0);
Colour.Yellow = new Colour(255, 255, 0);
Colour.Green = new Colour(0, 142, 0);
Colour.Turquoise = new Colour(0, 192, 192);
Colour.Blue = new Colour(36, 64, 142);
Colour.Indigo = new Colour(64, 0, 152);
Colour.Purple = new Colour(119, 0, 136);
Colour.LightHotPink = new Colour(255, 179, 217);
Colour.LightRed = new Colour(255, 128, 128);
Colour.LightOrange = new Colour(255, 199, 128);
Colour.LightYellow = new Colour(255, 255, 128);
Colour.LightGreen = new Colour(128, 255, 128);
Colour.LightTurquoise = new Colour(92, 255, 255);
Colour.LightBlue = new Colour(140, 151, 240);
Colour.LightIndigo = new Colour(177, 110, 255);
Colour.LightPurple = new Colour(216, 110, 231);
Colour.DarkHotPink = new Colour(159, 0, 80);
Colour.DarkRed = new Colour(159, 0, 0);
Colour.DarkOrange = new Colour(159, 89, 0);
Colour.DarkYellow = new Colour(191, 191, 0);
Colour.DarkGreen = new Colour(0, 96, 0);
Colour.DarkTurquoise = new Colour(0, 128, 128);
Colour.DarkBlue = new Colour(0, 34, 128);
Colour.DarkIndigo = new Colour(40, 0, 96);
Colour.DarkPurple = new Colour(84, 0, 96);
