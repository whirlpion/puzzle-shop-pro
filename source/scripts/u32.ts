
class u32 implements IEquals, IOrdered {
    private static readonly MAX = 0xFFFFFFFF;
    private static readonly MIN = 0x00000000;
    private static readonly MODULUS = 0x100000000;

    static readonly ZERO = new u32(0);

    private _value: number;

    get value() {
        return this._value;
    }

    private constructor(value: number) {
        this._value = value;
    }

    toString(): string {
        return `0x${this._value.toString(16).padStart(8, '0')}`;
    }

    // byte0: least significant
    // ...
    // byte3: most significant
    static fromBytes(byte0: number, byte1: number, byte2: number, byte3: number): u32 {
        let uint = (byte3 << 24) + (byte2 << 16) + (byte1 << 8) + (byte0);
        return new u32(uint);
    }

    static fromNumber(value: number) {
        throwIfFalse(Number.isInteger(value) && value >= u32.MIN && value <= u32.MAX);
        return new u32(value);
    }

    compare(that: u32): Ordering {
        return Math.sign(this._value - that._value);
    }

    equals(that: u32): boolean {
        return this.value == that.value;
    }

    static add(a: u32, b: u32): u32 {
        const sum = (a.value + b.value) % u32.MODULUS;
        return new u32(sum);
    }

    static sub(a: u32, b: u32): u32 {
        const diff = (u32.MODULUS + a.value - b.value) % u32.MODULUS;
        return new u32(diff);
    }

    static mul(a: u32, b: u32): u32 {
        const u16_MODULUS = 0x10000;
        // long multiplication with 16bit digits
        // get the digits
        const a_lo = (a.value % u16_MODULUS);
        const a_hi = (a.value >>> 16);
        const b_lo = (b.value % u16_MODULUS);
        const b_hi = (b.value >>> 16);

        // multiply
        const c_lo = a_lo * b_lo;
        const c_hi = (a_lo * b_hi + a_hi * b_lo) * 0x10000;

        const prod = (c_hi + c_lo) % u32.MODULUS;
        return new u32(prod);
    }

    static rol(a: u32, bits: number): u32 {
        throwIfFalse(Number.isInteger(bits) && bits >= 0 && bits <= 32);

        // hi part
        let rol = u32.mul(a, new u32(1 << bits));
        // lo part
        rol._value += (a.value >>> (32 - bits));
        return rol;
    }

    static xor(a: u32, b: u32): u32 {
        let xored = ((a.value ^ b.value) + u32.MODULUS) % u32.MODULUS;
        return new u32(xored);
    }

    static shr(a: u32, bits: number): u32 {
        throwIfFalse(Number.isInteger(bits) && bits >= 0 && bits <= 32);

        let shifted = (a.value >>> bits);
        return new u32(shifted);
    }
}