
async function xxhash32_test() {
    await test.begin("XXHash32");
    try {
        let hash: XXHash32 = new XXHash32();
        let input: Uint8Array = new Uint8Array(0);

        await test.println("should handle input less than the block size");
        input = new Uint8Array([1,2,3,4]);
        hash.writeBytes(input);
        throwIfNotEqual(hash.finish().value, 4271296924 /*0xfe96d19c*/);

        await test.println("should handle input less than the block size that has been split up");
        hash = new XXHash32();
        input = new Uint8Array([1,2,3,4]);
        for (let byte of input) {
            hash.writeBytes(new Uint8Array([byte]));
        }
        throwIfNotEqual(hash.finish().value, 4271296924 /*0xfe96d19c*/);

        await test.println("should handle input the same size as the block size");
        hash = new XXHash32();
        input = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
        hash.writeBytes(input);
        throwIfNotEqual(input.length, 16);
        throwIfNotEqual(hash.finish().value, 4113429260 /*0xf52df30c*/);

        await test.println("should handle input the same size as the block size that has been split up");
        hash = new XXHash32();
        input = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
        throwIfNotEqual(input.length, 16);
        for (let byte of input) {
            hash.writeBytes(new Uint8Array([byte]));
        }
        throwIfNotEqual(hash.finish().value, 4113429260 /*0xf52df30c*/);

        await test.println("should handle input that is multiples of the block size");
        hash = new XXHash32();
        input = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]);
        throwIfNotEqual(input.length, 32);
        hash.writeBytes(input);
        throwIfNotEqual(hash.finish().value, 2122502976 /*0x7e82d3400*/);

        await test.println("should handle input that is multiples of the block size that has been split up");
        hash = new XXHash32();
        input = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]);
        throwIfNotEqual(input.length, 32);
        for (let byte of input) {
           hash.writeBytes(new Uint8Array([byte]));
        }
        throwIfNotEqual(hash.finish().value, 2122502976 /*0x7e82d3400*/);

        await test.println("should handle input greater than but not a multiple of the block size");
        hash = new XXHash32();
        input = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]);
        throwIfNotEqual(input.length, 19);
        hash.writeBytes(input);
        throwIfNotEqual(hash.finish().value, 3738999843, /*0xdedc9c23*/);

        await test.println("should handle input greater than but not a multiple of the block size that has been split up");
        hash = new XXHash32();
        input = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]);
        throwIfNotEqual(input.length, 19);
        for (let byte of input) {
            hash.writeBytes(new Uint8Array([byte]));
        }
        throwIfNotEqual(hash.finish().value, 3738999843, /*0xdedc9c23*/);

    } catch (err) {
        test.error(err);
    }
}

async function hasher_test() {
    await test.begin("Hasher");
    try {
        let hasher: Hasher<XXHash32> = new Hasher(new XXHash32(u32.ZERO));
        await test.println("should hash array of bytes");
        hasher = new Hasher(new XXHash32(u32.ZERO));
        hasher.writeBytes(new Uint8Array([1,2,3,4]));
        throwIfNotEqual(hasher.finish().value, 4271296924 /*0xfe96d19c*/);

        await test.println("should hash a number");
        hasher = new Hasher(new XXHash32(u32.ZERO));
        hasher.writeNumbers(1.0);
        throwIfNotEqual(hasher.finish().value, 2307980487 /*0x8990fcc7*/);

        await test.println("should hash an ascii string");
        hasher = new Hasher(new XXHash32(u32.ZERO));
        hasher.writeStrings("Nobody inspects the spammish repetition");
        throwIfNotEqual(hasher.finish().value, 3794352943 /*0xe2293b2f*/);

        await test.println("should hash an array of strings same as individual strings");
        hasher = new Hasher(new XXHash32(u32.ZERO));
        hasher.writeArray(["Nobody inspects the ", "spammish repetition"]);
        throwIfNotEqual(hasher.finish().value, 3794352943 /*0xe2293b2f*/);

        await test.println("should hash a set of numbers");
        hasher = new Hasher(new XXHash32(u32.ZERO));
        hasher.writeSet(new Set<number>([1.0, 2.0, 3.0]));
        throwIfNotEqual(hasher.finish().value, 2405521566 /*0x8f61589e*/);

        await test.println("should hash a map of strings to numbers");
        hasher = new Hasher(new XXHash32(u32.ZERO));
        hasher.writeMap(new Map<string,number>([["one", 1], ["two", 2], ["three", 3]]));
        throwIfNotEqual(hasher.finish().value, 3047668973 /*0xb5a7bced*/);

    } catch (err) {
        test.error(err);
    }
}