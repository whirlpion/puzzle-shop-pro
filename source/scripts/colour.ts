

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
    public static readonly Grey = new Colour(128, 128, 128);
    public static readonly Black = new Colour(0, 0, 0);

    public static readonly Pink = new Colour(245, 169, 184);
    public static readonly LightBlue = new Colour(91, 206, 250);

    public static readonly Red = new Colour(228,3,3);
    public static readonly Orange = new Colour(255, 140, 0);
    public static readonly Yellow = new Colour(255, 237, 0);
    public static readonly Green = new Colour(0, 128, 38);
    public static readonly Blue = new Colour(36, 64, 142);
    public static readonly Violet = new Colour(115, 41, 130);
}
