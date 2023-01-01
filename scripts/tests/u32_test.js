"use strict";
function u32_test() {
    try {
        test.println("--- Begin u32 test ---");
        let u = u32.fromNumber(0);
        // let u2: u32 = u32.fromNumber(0);
        let threw = false;
        test.println("can be constructed from bytes");
        u = u32.fromBytes(0x00, 0x01, 0x02, 0x03);
        throwIfNotEqual(u.value, 0x03020100);
        test.println("can be constructed from an positive integer less than 2^32");
        u = u32.fromNumber(0x00010203);
        throwIfNotEqual(u.value, 0x00010203);
        test.println("should throw if constructed from a float");
        threw = false;
        try {
            u = u32.fromNumber(1.5);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("should throw if constructed from negative integer");
        threw = false;
        try {
            u = u32.fromNumber(-1);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("should throw if constructed from integer equal to 2^32");
        threw = false;
        try {
            u = u32.fromNumber(0x100000000);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("should throw if constructed from integer greater than 2^32");
        threw = false;
        try {
            u = u32.fromNumber(0x100000001);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("can be added to another u32");
        u = u32.add(u32.fromNumber(0x00010203), u32.fromNumber(0x04050607));
        throwIfNotEqual(u.value, 0x406080A);
        test.println("can be subtracted from another u32");
        u = u32.sub(u32.fromNumber(0x406080A), u32.fromNumber(0x04050607));
        throwIfNotEqual(u.value, 0x00010203);
        test.println("can be multiplied by another u32");
        u = u32.mul(u32.fromNumber(0x00010203), u32.fromNumber(0x04050607));
        throwIfNotEqual(u.value, 0x1C222015);
        test.println("can be rotated left by a given number of bits");
        u = u32.fromNumber(0x00010203);
        u = u32.rol(u, 8);
        throwIfNotEqual(u.value, 0x01020300);
        u = u32.rol(u, 8);
        throwIfNotEqual(u.value, 0x02030001);
        u = u32.rol(u, 8);
        throwIfNotEqual(u.value, 0x03000102);
        u = u32.rol(u, 8);
        throwIfNotEqual(u.value, 0x00010203);
        test.println("shuld throw if rotated by too many bits");
        threw = false;
        try {
            u = u32.rol(u32.fromNumber(0x01020304), 33);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("should throw if attempting to rotate by negative bits");
        threw = false;
        try {
            u = u32.rol(u32.fromNumber(0x01020304), -1);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("should be unchanged if xor with 0");
        u = u32.xor(u32.fromNumber(0x00010203), u32.fromNumber(0x00000000));
        throwIfNotEqual(u.value, 0x00010203);
        test.println("can be xor'd with another u32");
        u = u32.xor(u32.fromNumber(0x00010203), u32.fromNumber(0x04050607));
        throwIfNotEqual(u.value, 0x4040404);
        test.println("can be shifted right by a given number of bits");
        u = u32.fromNumber(0x01020304);
        u = u32.shr(u, 8);
        throwIfNotEqual(u.value, 0x010203);
        u = u32.shr(u, 8);
        throwIfNotEqual(u.value, 0x0102);
        u = u32.shr(u, 8);
        throwIfNotEqual(u.value, 0x01);
        u = u32.shr(u, 8);
        throwIfNotEqual(u.value, 0x0);
        test.println("should throw if attempting to shift by too many bits");
        threw = false;
        try {
            u = u32.shr(u32.fromNumber(0x01020304), 33);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("should throw if attempting to shift by negative bits");
        threw = false;
        try {
            u = u32.shr(u32.fromNumber(0x01020304), -1);
        }
        catch (ex) {
            threw = true;
        }
        throwIfFalse(threw);
        test.println("should be printable as string");
        throwIfNotEqual(u32.fromNumber(0x0).toString(), "0x00000000");
        throwIfNotEqual(u32.fromNumber(0x87654321).toString(), "0x87654321");
        throwIfNotEqual(u32.fromNumber(0x00110011).toString(), "0x00110011");
    }
    catch (err) {
        test.error(err);
    }
}
