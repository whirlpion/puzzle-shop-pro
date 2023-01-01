"use strict";
class u32 {
    get value() {
        return this._value;
    }
    constructor(value) {
        this._value = value;
    }
    toString() {
        return `0x${this._value.toString(16).padStart(8, '0')}`;
    }
    // byte0: least significant
    // ...
    // byte3: most significant
    static fromBytes(byte0, byte1, byte2, byte3) {
        let uint = (byte3 << 24) + (byte2 << 16) + (byte1 << 8) + (byte0);
        return new u32(uint);
    }
    static fromNumber(value) {
        throwIfFalse(Number.isInteger(value) && value >= u32.MIN && value <= u32.MAX);
        return new u32(value);
    }
    compare(that) {
        return Math.sign(this._value - that._value);
    }
    equals(that) {
        return this.value == that.value;
    }
    static add(a, b) {
        const sum = (a.value + b.value) % u32.MODULUS;
        return new u32(sum);
    }
    static sub(a, b) {
        const diff = (u32.MODULUS + a.value - b.value) % u32.MODULUS;
        return new u32(diff);
    }
    static mul(a, b) {
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
    static rol(a, bits) {
        throwIfFalse(Number.isInteger(bits) && bits >= 0 && bits <= 32);
        // hi part
        let rol = u32.mul(a, new u32(1 << bits));
        // lo part
        rol._value += (a.value >>> (32 - bits));
        return rol;
    }
    static xor(a, b) {
        let xored = ((a.value ^ b.value) + u32.MODULUS) % u32.MODULUS;
        return new u32(xored);
    }
    static shr(a, bits) {
        throwIfFalse(Number.isInteger(bits) && bits >= 0 && bits <= 32);
        let shifted = (a.value >>> bits);
        return new u32(shifted);
    }
}
u32.MAX = 0xFFFFFFFF;
u32.MIN = 0x00000000;
u32.MODULUS = 0x100000000;
u32.ZERO = new u32(0);
