

class Colour {
    public readonly red: number;
    public readonly green: number;
    public readonly blue: number;
    public readonly alpha: number;

    constructor(red: number, green: number, blue:number, alpha?: number) {
        this.red = Math.clamp(0, red, 255);
        this.green = Math.clamp(0, green, 255);
        this.blue = Math.clamp(0, blue, 255);
        if (typeof alpha !== 'undefined') {
            this.alpha = Math.clamp(0.0, alpha, 1.0);
        } else {
            this.alpha = 1.0;
        }
    }

    toString(): string {
        return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
    }

    public static readonly White = new Colour(255, 255, 255);
    public static readonly LightGrey = new Colour(196, 196, 196);
    public static readonly Grey = new Colour(128, 128, 128);
    public static readonly DarkGrey = new Colour(64, 64, 64);
    public static readonly Black = new Colour(0, 0, 0);

    public static readonly HotPink = new Colour(255, 105, 180);
    public static readonly Red = new Colour(255,0,0);
    public static readonly Orange = new Colour(255, 142, 0);
    public static readonly Yellow = new Colour(255, 255, 0);
    public static readonly Green = new Colour(0, 142, 0);
    public static readonly Turquoise = new Colour(0, 192, 192);
    public static readonly Blue = new Colour(36, 64, 142);
    public static readonly Indigo = new Colour(64, 0, 152);
    public static readonly Purple = new Colour(119, 0, 136);

    public static readonly LightHotPink = new Colour(255, 179, 217);
    public static readonly LightRed = new Colour(255,128,128);
    public static readonly LightOrange = new Colour(255, 199, 128);
    public static readonly LightYellow = new Colour(255, 255, 128);
    public static readonly LightGreen = new Colour(128, 255, 128);
    public static readonly LightTurquoise = new Colour(92, 255, 255);
    public static readonly LightBlue = new Colour(140, 151, 240);
    public static readonly LightIndigo = new Colour(177, 110, 255);
    public static readonly LightPurple = new Colour(216, 110, 231);

    public static readonly DarkHotPink = new Colour(159, 0, 80);
    public static readonly DarkRed = new Colour(159, 0, 0);
    public static readonly DarkOrange = new Colour(159, 89, 0);
    public static readonly DarkYellow = new Colour(191, 191, 0);
    public static readonly DarkGreen = new Colour(0, 96, 0);
    public static readonly DarkTurquoise = new Colour(0, 128, 128);
    public static readonly DarkBlue = new Colour(0, 34, 128);
    public static readonly DarkIndigo = new Colour(40, 0, 96);
    public static readonly DarkPurple = new Colour(84, 0, 96);
}
