interface IHash {
    hash<T extends IHashImplementation>(state: Hasher<T>): void;
}

interface String {
    hash<T extends IHashImplementation>(state: Hasher<T>): void;
}

String.prototype.hash = function<T extends IHashImplementation>(state: Hasher<T>): void {
    state.writeStrings(this.valueOf());
}

interface Number {
    hash<T extends IHashImplementation>(state: Hasher<T>): void;
}

Number.prototype.hash = function<T extends IHashImplementation>(state: Hasher<T>): void {
    state.writeNumbers(this.valueOf());
}

interface IHashImplementation {
    reset(seed: u32): void;
    writeBytes(data: Uint8Array): void;
    finish(): u32;
}

class Hasher<T extends IHashImplementation> implements IHashImplementation {
    hash: T;
    // buffers/views for writeBytes
    doubleRaw: ArrayBuffer = new ArrayBuffer(8);
    doubleView: Float64Array = new Float64Array(this.doubleRaw);
    byteView: Uint8Array = new Uint8Array(this.doubleRaw);
    // text encoder for writeStrings
    textEcoder: TextEncoder = new TextEncoder();
    constructor(hash: T) {
        this.hash = hash;
    }

    reset(seed: u32): void {
        this.hash.reset(seed);
    }

    writeBytes(data: Uint8Array): void {
        this.hash.writeBytes(data);
    }

    writeBooleans(...values: boolean[]): void {
        for(let value of values) {
            this.hash.writeBytes(new Uint8Array([value ? 1 : 0]))
        }
    }

    writeNumbers(...values: number[]): void {
        for (let value of values) {
            this.doubleView[0] = value;
            this.hash.writeBytes(this.byteView);
        }
    }

    writeStrings(...values: string[]): void {
        for (let value of values) {
            let utf8 = this.textEcoder.encode(value);
            this.writeBytes(utf8);
        }
    }

    writeArray<T extends IHash>(values: Array<T>): void {
        for (let value of values) {
            value.hash(this);
        }
    }
    writeSet<T extends IHash>(values: Set<T>): void {
        for (let value of values) {
            value.hash(this);
        }
    }
    writeMap<K extends IHash, V extends IHash>(keyValues: Map<K,V>): void {
        for (let [key,value] of keyValues) {
            key.hash(this);
            value.hash(this);
        }
    }

    finish(): u32 {
        return this.hash.finish();
    }
}

class XXHash32 implements IHashImplementation {
    private static readonly PRIME1: u32 = u32.fromNumber(2654435761);
    private static readonly PRIME2: u32 = u32.fromNumber(2246822519);
    private static readonly PRIME3: u32 = u32.fromNumber(3266489917);
    private static readonly PRIME4: u32 = u32.fromNumber(668265263);
    private static readonly PRIME5: u32 = u32.fromNumber(374761393);
    private static readonly BLOCK_SIZE: number = 16;

    private state: [u32, u32, u32, u32] = [u32.ZERO, u32.ZERO, u32.ZERO, u32.ZERO];
    private block: Uint8Array = new Uint8Array(XXHash32.BLOCK_SIZE);
    private blockOffset: number = 0;
    private bytesWritten: u32 = u32.ZERO;

    constructor(seed: u32=u32.fromNumber(0)) {
        this.reset(seed);
    }

    reset(seed: u32): void {
        this.state = [
            u32.add(u32.add(seed, XXHash32.PRIME1), XXHash32.PRIME2),
            u32.add(seed, XXHash32.PRIME2),
            seed,
            u32.sub(seed, XXHash32.PRIME1)];
        this.blockOffset = 0;
        for (let k = 0; k < XXHash32.BLOCK_SIZE; k++) {
            this.block[k] = 0;
        }
        this.bytesWritten = u32.ZERO;
    }

    // input: an array of bytes
    writeBytes(data: Uint8Array): void {
        // no bytes no writes
        if (data.length === 0) {
            return;
        }

        this.bytesWritten = u32.add(this.bytesWritten, u32.fromNumber(data.length));

        // not enough data to process yet
        if (this.blockOffset + data.length < XXHash32.BLOCK_SIZE) {
            for (let k = 0; k < data.length; k++) {
                this.block[this.blockOffset++] = data[k];
            }
            return;
        }

        // read index head of data
        let dataOffset: number = 0;
        if (this.blockOffset > 0) {
            const count = XXHash32.BLOCK_SIZE - this.blockOffset;
            for (let k = 0; k < count; k++) {
                this.block[this.blockOffset++] = data[k];
            }
            XXHash32.processBlock(this.block, 0, this.state);
            this.blockOffset = 0;
            dataOffset = count;
        }

        // process remainder of 16 byte blocks
        while (dataOffset + 16 <= data.length) {
            XXHash32.processBlock(data, dataOffset, this.state);
            dataOffset += 16;
        }

        // copy left-overs to block
        for (let k = 0; dataOffset + k < data.length; k++) {
            this.block[this.blockOffset++] = data[dataOffset + k];
        }
    }

    private static processBlock(data: Uint8Array, dataOffset: number, state: [u32,u32,u32,u32]) {
        for (let k = 0; k < 4; k++) {
            let state_k = state[k];
            const val = u32.fromBytes(
                data[dataOffset + k*4 + 0],
                data[dataOffset + k*4 + 1],
                data[dataOffset + k*4 + 2],
                data[dataOffset + k*4 + 3]);

            state_k = u32.add(state_k, u32.mul(val, XXHash32.PRIME2));
            state_k = u32.rol(state_k, 13);
            state_k = u32.mul(state_k, XXHash32.PRIME1);

            state[k] = state_k;
        }
    }

    finish(): u32 {
        let result = this.bytesWritten;

        // squash state into result
        if (this.bytesWritten.value >= XXHash32.BLOCK_SIZE) {
            result = u32.add(result, u32.rol(this.state[0], 1));
            result = u32.add(result, u32.rol(this.state[1], 7));
            result = u32.add(result, u32.rol(this.state[2], 12));
            result = u32.add(result, u32.rol(this.state[3], 18));
        } else {
            result = u32.add(result, this.state[2]);
            result = u32.add(result, XXHash32.PRIME5);
        }

        // handle any remaining data in 4 byte chunks
        let k = 0;
        for (; 4 + k <= this.blockOffset; k += 4) {
            const val = u32.fromBytes(
                this.block[k + 0],
                this.block[k + 1],
                this.block[k + 2],
                this.block[k + 3]);
            result = u32.add(result, u32.mul(val, XXHash32.PRIME3));
            result = u32.rol(result, 17);
            result = u32.mul(result, XXHash32.PRIME4);
        }
        // and handle remaining individual straggler bytes
        for (; k < this.blockOffset; k++) {
            result = u32.add(result, u32.mul(u32.fromNumber(this.block[k]), XXHash32.PRIME5));
            result = u32.rol(result, 11);
            result = u32.mul(result, XXHash32.PRIME1);
        }

        result = u32.xor(result, u32.shr(result, 15));
        result = u32.mul(result, XXHash32.PRIME2);
        result = u32.xor(result, u32.shr(result, 13));
        result = u32.mul(result, XXHash32.PRIME3);
        result = u32.xor(result, u32.shr(result, 16));

        return result;
    }
}
