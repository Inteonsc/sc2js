export class BitPackedBuffer {
	constructor(contents, Endian = "big") {
		this.data = contents ?? Buffer.alloc(0);
		this.bytesRead = 0;
		this.nextByte = null;
		this.nextBitsLeft = 0;
		this.bigEndian = Endian === "big";
	}

	finished() {
		return this.bytesRead >= this.data.length && this.nextBitsLeft === 0;
	}

	usedBits() {
		return this.bytesRead * 8 - this.nextBitsLeft;
	}

	byteAlign() {
		this.nextBitsLeft = 0;
	}

	readAlignedBytes(numBytes) {
		this.byteAlign();
		const result = Buffer.from(
			this.data.subarray(this.bytesRead, this.bytesRead + numBytes),
		);
		this.bytesRead += numBytes;
		if (result.length < numBytes) {
			throw new Error("Attempted to read past end of buffer");
		}
		return result;
	}
	//TODO add support for 64 bit reads if needed. only supports 32 bit integers at the moment

    //Will return either a number or a bigint depending on if its above 32 bits or not.
	readBits(numBits) {
		if (numBits > 32) {
            return this.#read64Bits(numBits);
		}
		let result = 0;
		let bitsRead = 0;
		while (bitsRead < numBits) {
			if (this.nextBitsLeft === 0) {
				if (this.finished()) {
					throw new Error("Attempted to read past end of buffer");
				}
				this.nextByte = this.data[this.bytesRead];
				this.bytesRead++;
				this.nextBitsLeft = 8;
			}
			const bitsToRead = Math.min(numBits - bitsRead, this.nextBitsLeft);
			const copy = this.nextByte & ((1 << bitsToRead) - 1);
			if (this.bigEndian) {
				result |= copy << (numBits - bitsRead - bitsToRead);
			} else {
				result |= copy << bitsRead;
			}
			this.nextByte >>= bitsToRead;
			this.nextBitsLeft -= bitsToRead;
			bitsRead += bitsToRead;
		}
		return result;
	}
    #read64Bits(numBits) {
        if (numBits > 64) {
            throw new Error("Cannot read more than 64 bits at a time");
        }
        let result = 0n;
        let bitsRead = 0n;
        let totalBits = BigInt(numBits);
        while (bitsRead < totalBits) {
			if (this.nextBitsLeft === 0) {
				if (this.finished()) {
					throw new Error("Attempted to read past end of buffer");
				}
				this.nextByte = this.data[this.bytesRead];
				this.bytesRead++;
				this.nextBitsLeft = 8;
			}
			const bitsToRead = BigInt(Math.min(Number(totalBits - bitsRead), this.nextBitsLeft));
			const copy = BigInt(this.nextByte) & ((1n << bitsToRead) - 1n);
			if (this.bigEndian) {
				result |= copy << (totalBits - bitsRead - bitsToRead);
			} else {
				result |= copy << bitsRead;
			}
			this.nextByte >>= Number(bitsToRead);
			this.nextBitsLeft -= Number(bitsToRead);
			bitsRead += bitsToRead; 
		}
		return result; 

    }

	readUnalignedBytes(numBytes) {
		const result = Buffer.allocUnsafe(numBytes);
		for (let i = 0; i < numBytes; i++) {
			result[i] = this.readBits(8);
		}
		return result;
	}
}

export class BitPackedDecoder {}

export class VersionedDecoder {}
