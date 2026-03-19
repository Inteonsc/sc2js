export class BitPackedBuffer {
	constructor(contents, Endian = "big") {
		this.data = contents ?? Buffer.alloc(0);
		this.bytesRead = 0;
		this.nextByte = null;
		this.nextBitsLeft = 0;
		this.bigEndian = Endian === "big";
	}

	finished() { return this.bytesRead >= this.data.length && this.nextBitsLeft === 0; }

	usedBits() { return this.bytesRead * 8 - this.nextBitsLeft; }

	byteAlign() { this.nextBitsLeft = 0; }

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

	//Will return either a number or a bigint depending on if its above 32 bits or not.
	readBits(numBits) {
		if (numBits > 32) {
			return this.#readBigBits(numBits);
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
	#readBigBits(numBits) {
		
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
			const bitsToRead = BigInt(
				Math.min(Number(totalBits - bitsRead), this.nextBitsLeft),
			);
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
//In the original s2protocol there is alot of python tuples which we represent with arrays instead.
export class BitPackedDecoder {
	constructor(bitPackedBuffer, typeInfos) {
		this.buffer = checkBuffer(bitPackedBuffer);
		this.typeInfos = typeInfos;
	}

	instance(typeid) {
		if (typeid >= this.typeInfos.length) {
			throw new Error(
				`Typeid ${typeid} out of bounds for typeInfos of length ${this.typeInfos.length}`,
			);
		}
		const typeinfo = this.typeInfos[typeid];
		return this[typeinfo[0]](...typeinfo[1]);
	}

	byteAlign() { this.buffer.byteAlign(); }
	finished() { return this.buffer.finished(); }
	usedBits() { return this.buffer.usedBits(); }

	_array(bounds, typeid) {
		const length = this._int(bounds);
		let result = [];
		for (let i = 0; i < length; i++) {
			result.push(this.instance(typeid));
		}
		return result;
	}

	_bitarray(bounds) {
		const length = this._int(bounds);
		return [length, this.buffer.readBits(length)];
	}

	_blob(bounds) {
		const length = this._int(bounds);
		const result = this.buffer.readAlignedBytes(length);
		return result;
	}

	_bool() {
		return this._int([0, 1]) !== 0;
	}

	_choice(bounds, fields) {
		const tag = this._int(bounds);
		if (!(tag in fields)) {
			throw new Error(`Tag ${tag} not found in fields ${fields}`);
		}
		const field = fields[tag];
		return { [field[0]]: this.instance(field[1]) };
	}

	_fourcc() {
		return this.buffer.readUnalignedBytes(4);
	}

	_int(bounds) {  console.log("bounds: ", bounds);
        const value = this.buffer.readBits(bounds[1]);
      
        if (typeof value === "bigint"){
            return BigInt(bounds[0]) + value;
        }
		return bounds[0] + value;
	}

	_null() {
		return null;
	}

	_optional(typeid) {
		const exists = this._bool();
		return exists ? this.instance(typeid) : null;
	}

	_real32() {
		const bytes = this.buffer.readUnalignedBytes(4);
		return bytes.readFloatBE(0);
	}

	_real64() {
		const bytes = this.buffer.readUnalignedBytes(8);
		return bytes.readDoubleBE(0);
	}
	_struct(fields) {
		let result = {};
		for (const field of fields) {
			if (field[0] === "__parent") {
				const parent = this.instance(field[1]);
				if (
					typeof parent === "object" &&
					!Array.isArray(parent) &&
					parent !== null
				) {
					Object.assign(result, parent);
				} else if (fields.length === 1) {
					return parent;
				} else {
					result[field[0]] = parent;
				}
			} else {
				result[field[0]] = this.instance(field[1]);
			}
		}
		return result;
	}
}

export class VersionedDecoder {
	constructor(bitPackedBuffer, typeInfos) {
		this.buffer = checkBuffer(bitPackedBuffer);
		this.typeInfos = typeInfos;
	}

	instance(typeid) {
		if (typeid >= this.typeInfos.length) {
			throw new Error(
				`Typeid ${typeid} out of bounds for typeInfos of length ${this.typeInfos.length}`,
			);
		}
		const typeinfo = this.typeInfos[typeid];
		return this[typeinfo[0]](...typeinfo[1]);
	}

	byteAlign() { this.buffer.byteAlign(); }
	finished() { return this.buffer.finished(); }
	usedBits() { return this.buffer.usedBits(); }

	_expectSkip(expected) {
		if (this.buffer.readBits(8) != expected) {
			throw new Error("Corrupted Data");
		}
	}

	_vint() {
		let b = this.buffer.readBits(8);
		const negative = b & 1;
		let result = (b >> 1) & 0x3f;
		let bits = 6;
		while ((b & 0x80) != 0) {
			b = this.buffer.readBits(8);
			result |= (b & 0x7f) << bits;
			bits += 7;
		}
		return negative ? -result : result;
	}

	_array(bounds, typeid) {
		this._expectSkip(0);
		const length = this._vint();
		let result = [];
		for (let i = 0; i < length; i++) {
			result.push(this.instance(typeid));
		}
		return result;
	}

	_bitarray(bounds) {
		this._expectSkip(1);
		const length = this._vint();
		return [
			length,
			this.buffer.readAlignedBytes(Math.floor((length + 7) / 8)),
		];
	}

	_blob(bounds) {
		this._expectSkip(2);
		const length = this._vint();
		return this.buffer.readAlignedBytes(length);
	}

	_bool() {
		this._expectSkip(6);
		return this.buffer.readBits(8) != 0;
	}

	_choice(bounds, fields) {
		this._expectSkip(3);
		const tag = this._vint();
		if (!(tag in fields)) {
			this._skipInstance();
			return {};
		}
		const field = fields[tag];
		return { [field[0]]: this.instance(field[1]) };
	}

	_fourcc() {
		this._expectSkip(7);
		return this.buffer.readAlignedBytes(4);
	}

	_int(bounds) {
		this._expectSkip(9);
		return this._vint();
	}

	_null() {
		return null;
	}

	_optional(typeid) {
		this._expectSkip(4);
		const exists = this.buffer.readBits(8) != 0;
		return exists ? this.instance(typeid) : null;
	}

	_real32() {
		this._expectSkip(7);
		const bytes = this.buffer.readUnalignedBytes(4);
		return bytes.readFloatBE(0);
	}

	_real64() {
		this._expectSkip(8);
		const bytes = this.buffer.readUnalignedBytes(8);
		return bytes.readDoubleBE(0);
	}

	_struct(fields) {
		this._expectSkip(5);
		let result = {};
		const length = this._vint();
		for (let i = 0; i < length; i++) {
			const tag = this._vint();
			const field = fields.find((f) => f[2] === tag);
			if (field) {
				if (field[0] === "__parent") {
					const parent = this.instance(field[1]);
					if (
						typeof parent === "object" &&
						!Array.isArray(parent) &&
						parent !== null
					) {
						Object.assign(result, parent);
					} else if (fields.length === 1) {
						return parent;
					} else {
						result[field[0]] = parent;
					}
				} else {
					result[field[0]] = this.instance(field[1]);
				}
			} else {
				this._skipInstance();
			}
		}
		return result;
	}

	_skipInstance() {
		const skip = this.buffer.readBits(8);
		switch (skip) {
			case 0: { //array
				const length = this._vint();
				for (let i = 0; i < length; i++) {
					this._skipInstance();
				}
				break;
			}
			case 1: { //bitblob
				const length = this._vint();
				this.buffer.readAlignedBytes(Math.floor((length + 7) / 8));
				break;
			}
			case 2: { // blob
				const length = this._vint();
				this.buffer.readAlignedBytes(length);
				break;
			}
			case 3: { // choice
				this._vint();
				this._skipInstance();
				break;
			}
			case 4: { // optional
				const exists = this.buffer.readBits(8) !== 0;
				if (exists) this._skipInstance();
				break;
			}
			case 5: { // struct
				const length = this._vint();
				for (let i = 0; i < length; i++) {
					this._vint();
					this._skipInstance();
				}
				break;
			}
			case 6: // u8
				this.buffer.readAlignedBytes(1);
				break;
			case 7: // u32
				this.buffer.readAlignedBytes(4);
				break;
			case 8: // u64
				this.buffer.readAlignedBytes(8);
				break;
			case 9: // vint
				this._vint();
				break;
		}
	}
}

// checks if something is a bitpacked buffer and converts it if not
function checkBuffer(contents){
    return contents instanceof BitPackedBuffer ? contents : new BitPackedBuffer(contents);
}