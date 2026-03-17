import { expect, test, describe, onTestFinished } from "vitest";
import { BitPackedBuffer, BitPackedDecoder, VersionedDecoder } from "../src/reader/decoder.js";
//TODO - Double check these tests are accurate due to ai generated code with minor edits.
describe("BitPackedBuffer", () => {
	describe("done", () => {
		test("returns false when buffer has data", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			expect(buf.finished()).toBe(false);
		});

		test("returns true when buffer is empty", () => {
			const buf = new BitPackedBuffer(Buffer.from([]));
			expect(buf.finished()).toBe(true);
		});

		test("returns true after all bits are read", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			buf.readBits(8);
			expect(buf.finished()).toBe(true);
		});

		test("returns false when partial bits remain", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			buf.readBits(4);
			expect(buf.finished()).toBe(false);
		});
	});

	describe("usedBits", () => {
		test("returns 0 at the start", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			expect(buf.usedBits()).toBe(0);
		});

		test("returns 8 after reading a full byte", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			buf.readBits(8);
			expect(buf.usedBits()).toBe(8);
		});

		test("returns 3 after reading 3 bits", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			buf.readBits(3);
			expect(buf.usedBits()).toBe(3);
		});

		test("returns 16 after reading two full bytes", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff, 0xff]));
			buf.readBits(16);
			expect(buf.usedBits()).toBe(16);
		});
	});

	describe("byteAlign", () => {
		test("discards remaining bits in current byte", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff, 0x0f]));
			buf.readBits(3);
			buf.byteAlign();
			const result = buf.readBits(8);
			expect(result).toBe(0x0f);
		});

		test("is a no-op when already aligned", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff, 0x0f]));
			buf.readBits(8);
			buf.byteAlign();
			const result = buf.readBits(8);
			expect(result).toBe(0x0f);
		});
	});

	describe("readBits", () => {
		test("reads a full byte", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			expect(buf.readBits(8)).toBe(0xff);
		});

		test("reads a single bit", () => {
			const buf = new BitPackedBuffer(Buffer.from([0b00000001]));
			expect(buf.readBits(1)).toBe(1);
		});

		test("reads across byte boundary", () => {
			const buf = new BitPackedBuffer(
				Buffer.from([0b11110000, 0b00001111]),
			);
			buf.readBits(4);
			expect(buf.readBits(8)).toBe(0xff);
		});

		test("reads 16 bits across two bytes", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xab, 0xcd]));
			expect(buf.readBits(16)).toBe(0xabcd);
		});

		test("reads sequential values correctly", () => {
			const buf = new BitPackedBuffer(Buffer.from([0b10110100]));
			expect(buf.readBits(2)).toBe(0b00);
			expect(buf.readBits(2)).toBe(0b01);
			expect(buf.readBits(4)).toBe(0b1011);
		});

		test("throws on read past end", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff]));
			buf.readBits(8);
			expect(() => buf.readBits(1)).toThrow();
		});
	});

	describe("readAlignedBytes", () => {
		test("reads n bytes correctly", () => {
			const buf = new BitPackedBuffer(Buffer.from([0x01, 0x02, 0x04]));
			const result = buf.readAlignedBytes(3);
			expect(result).toEqual(Buffer.from([0x01, 0x02, 0x04]));
		});

		test("aligns before reading", () => {
			const buf = new BitPackedBuffer(Buffer.from([0xff, 0x01, 0x02]));
			buf.readBits(3);
			const result = buf.readAlignedBytes(2);
			expect(result).toEqual(Buffer.from([0x01, 0x02]));
		});

		test("throws on read past end", () => {
			const buf = new BitPackedBuffer(Buffer.from([0x01]));
			expect(() => buf.readAlignedBytes(2)).toThrow();
		});
	});

	describe("endianness", () => {
		test("big and little endian give different results for same input", () => {
			const data = Buffer.from([0b11110000, 0b10101010]);
			const big = new BitPackedBuffer(data, "big");
			const little = new BitPackedBuffer(data, "little");
			expect(big.readBits(12)).not.toBe(little.readBits(12));
		});
	});

	describe("readUnalignedBytes", () => {
		test("reads n bytes correctly", () => {
			const buf = new BitPackedBuffer(Buffer.from([0x01, 0x02, 0x03]));
			const result = buf.readUnalignedBytes(3);
			expect(result).toEqual(Buffer.from([0x01, 0x02, 0x03]));
		});

		test("reads from current bit position without aligning", () => {
			const buf = new BitPackedBuffer(
				Buffer.from([0b11110001, 0b00001111]),
			);
			buf.readBits(4); // consume low 4 bits
			const result = buf.readUnalignedBytes(1);
			// remaining 4 bits of first byte + low 4 bits of second byte
			expect(result).toEqual(Buffer.from([0xff]));
		});

		test("throws on read past end", () => {
			const buf = new BitPackedBuffer(Buffer.from([0x01]));
			expect(() => buf.readUnalignedBytes(2)).toThrow();
		});
	});
	describe("readBits 64-bit", () => {
		test("reads a 64-bit value", () => {
			const buf = new BitPackedBuffer(
				Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
			);
			expect(buf.readBits(64)).toBe(0xffffffffffffffffn);
		});

		test("returns a BigInt for reads over 32 bits", () => {
			const buf = new BitPackedBuffer(
				Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff]),
			);
			expect(typeof buf.readBits(40)).toBe("bigint");
		});

		test("returns a number for reads of 32 bits or less", () => {
			const buf = new BitPackedBuffer(
				Buffer.from([0xff, 0xff, 0xff, 0xff]),
			);
			expect(typeof buf.readBits(32)).toBe("number");
		});

		test("reads a 33-bit value correctly", () => {
			const buf = new BitPackedBuffer(
				Buffer.from([0xff, 0xff, 0xff, 0xff, 0x01]),
			);
			expect(buf.readBits(33)).toBe(0x1ffffffffn);
		});

		test("reads sequential 64-bit values", () => {
			const buf = new BitPackedBuffer(
				Buffer.from([
					0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
					0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
				]),
			);
			const first = buf.readBits(64);
			const second = buf.readBits(64);
			expect(first).toBe(1n);
			expect(second).toBe(2n);
		});
	});
});

const makeBuf = (bytes) => new BitPackedBuffer(Buffer.from(bytes));

describe('BitPackedDecoder', () => {

    describe('instance', () => {
        test('dispatches to correct method', () => {
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0xFF]), typeInfos);
            expect(decoder.instance(0)).toBe(255);
        });

        test('throws on out of bounds typeid', () => {
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0xFF]), typeInfos);
            expect(() => decoder.instance(1)).toThrow();
        });
    });

    describe('_int', () => {
        test('reads bits with zero offset', () => {
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0xFF]), typeInfos);
            expect(decoder.instance(0)).toBe(255);
        });

        test('reads bits with positive offset', () => {
            const typeInfos = [['_int', [[1, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0x00]), typeInfos);
            expect(decoder.instance(0)).toBe(1);
        });

        test('reads bits with negative offset', () => {
            const typeInfos = [['_int', [[-1, 2]]]];
            const decoder = new BitPackedDecoder(makeBuf([0b00000001]), typeInfos);
            expect(decoder.instance(0)).toBe(0); // reads 1, adds -1
        });

        test('reads fewer than 8 bits', () => {
            const typeInfos = [['_int', [[0, 4]]]];
            const decoder = new BitPackedDecoder(makeBuf([0b00001111]), typeInfos);
            expect(decoder.instance(0)).toBe(15);
        });
    });

    describe('_bool', () => {
        test('returns true for 1 bit', () => {
            const typeInfos = [['_bool', []]];
            const decoder = new BitPackedDecoder(makeBuf([0b00000001]), typeInfos);
            expect(decoder.instance(0)).toBe(true);
        });

        test('returns false for 0 bit', () => {
            const typeInfos = [['_bool', []]];
            const decoder = new BitPackedDecoder(makeBuf([0b00000000]), typeInfos);
            expect(decoder.instance(0)).toBe(false);
        });
    });

    describe('_null', () => {
        test('returns null', () => {
            const typeInfos = [['_null', []]];
            const decoder = new BitPackedDecoder(makeBuf([]), typeInfos);
            expect(decoder.instance(0)).toBe(null);
        });
    });

    describe('_blob', () => {
        test('reads blob with correct length', () => {
            // bounds [0, 8] means length is encoded in 8 bits
            // first byte = length (3), next 3 bytes = data
            const typeInfos = [['_blob', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([3, 0x01, 0x02, 0x03]), typeInfos);
            expect(decoder.instance(0)).toEqual(Buffer.from([0x01, 0x02, 0x03]));
        });

        test('reads empty blob', () => {
            const typeInfos = [['_blob', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0]), typeInfos);
            expect(decoder.instance(0)).toEqual(Buffer.from([]));
        });
    });

    describe('_optional', () => {
        test('returns null when flag is 0', () => {
            // typeid 0 = _optional pointing to typeid 1
            // typeid 1 = _int [0, 8]
            const typeInfos = [
                ['_optional', [1]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new BitPackedDecoder(makeBuf([0b00000000, 0xFF]), typeInfos);
            expect(decoder.instance(0)).toBe(null);
        });

        test('returns decoded value when flag is 1', () => {
            const typeInfos = [
                ['_optional', [1]],
                ['_int', [[0, 8]]]
            ];
            // first bit = 1 (exists), remaining bits = value
            const decoder = new BitPackedDecoder(makeBuf([0b11111111, 0b00000001]), typeInfos);
            expect(decoder.instance(0)).toBe(255);
        });
    });

    describe('_array', () => {
        test('reads array of ints', () => {
            // bounds [0, 8] = length encoded in 8 bits, typeid 1 = _int [0, 8]
            const typeInfos = [
                ['_array', [[0, 8], 1]],
                ['_int', [[0, 8]]]
            ];
            // length=3, then 3 bytes
            const decoder = new BitPackedDecoder(makeBuf([3, 0x01, 0x02, 0x03]), typeInfos);
            expect(decoder.instance(0)).toEqual([1, 2, 3]);
        });

        test('reads empty array', () => {
            const typeInfos = [
                ['_array', [[0, 8], 1]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new BitPackedDecoder(makeBuf([0]), typeInfos);
            expect(decoder.instance(0)).toEqual([]);
        });
    });

    describe('_bitarray', () => {
        test('returns length and bits', () => {
            // bounds [0, 8] = length in 8 bits, then read that many bits
            const typeInfos = [['_bitarray', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([4, 0b00001111]), typeInfos);
            const result = decoder.instance(0);
            expect(result[0]).toBe(4);       // length
            expect(result[1]).toBe(0b1111);  // bits
        });
    });

    describe('_choice', () => {
        test('decodes correct variant', () => {
            const typeInfos = [
                ['_choice', [[0, 2], { 0: ['m_uint8', 1], 1: ['m_uint4', 2] }]],
                ['_int', [[0, 8]]],
                ['_int', [[0, 4]]]
            ];
            // tag = 0 (2 bits), then 8 bit value
            // tag = 0 needs 2 bits, then 8 bit value
            // byte 0: low 2 bits = tag (0b00), remaining 6 bits = start of value
            // byte 1: remaining 2 bits of value
            const decoder = new BitPackedDecoder(makeBuf([0b11111100, 0b00000011]), typeInfos);
            expect(decoder.instance(0)).toEqual({ m_uint8: 255 });
        });

        test('throws on unknown tag', () => {
            const typeInfos = [
                ['_choice', [[0, 2], { 0: ['m_uint8', 1] }]],
                ['_int', [[0, 8]]]
            ];
            // tag = 3 (not in fields)
            const decoder = new BitPackedDecoder(makeBuf([0b00000011]), typeInfos);
            expect(() => decoder.instance(0)).toThrow();
        });
    });

    describe('_struct', () => {
        test('decodes struct with multiple fields', () => {
            const typeInfos = [
                ['_struct', [[['m_a', 1, 0], ['m_b', 1, 1]]]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new BitPackedDecoder(makeBuf([0x01, 0x02]), typeInfos);
            expect(decoder.instance(0)).toEqual({ m_a: 1, m_b: 2 });
        });

        test('merges __parent fields into result', () => {
            const typeInfos = [
                ['_struct', [[['__parent', 2, -1], ['m_own', 1, 0]]]],
                ['_int', [[0, 8]]],
                ['_struct', [[['m_x', 1, 0]]]]
            ];
            const decoder = new BitPackedDecoder(makeBuf([0x0A, 0x0B]), typeInfos);
            expect(decoder.instance(0)).toEqual({ m_x: 10, m_own: 11 });
        });

        test('decodes empty struct', () => {
            const typeInfos = [['_struct', [[]]]];
            const decoder = new BitPackedDecoder(makeBuf([]), typeInfos);
            expect(decoder.instance(0)).toEqual({});
        });
    });

    describe('done and usedBits', () => {
        test('done returns false when buffer has data', () => {
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0xFF]), typeInfos);
            expect(decoder.done()).toBe(false);
        });

        test('done returns true after all data read', () => {
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0xFF]), typeInfos);
            decoder.instance(0);
            expect(decoder.done()).toBe(true);
        });

        test('usedBits increments after reads', () => {
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new BitPackedDecoder(makeBuf([0xFF]), typeInfos);
            expect(decoder.used_bits()).toBe(0);
            decoder.instance(0);
            expect(decoder.used_bits()).toBe(8);
        });
    });

});


describe('VersionedDecoder', () => {

    const makeBuf = (bytes) => new BitPackedBuffer(Buffer.from(bytes));

    describe('_vint', () => {
        test('decodes a small positive integer', () => {
            // value 1: first byte = (1 << 1) | 0 = 0x02, no continuation
            const decoder = new VersionedDecoder(makeBuf([0x02]), []);
            expect(decoder._vint()).toBe(1);
        });

        test('decodes zero', () => {
            const decoder = new VersionedDecoder(makeBuf([0x00]), []);
            expect(decoder._vint()).toBe(0);
        });

        test('decodes a negative integer', () => {
            // value -1: first byte = (1 << 1) | 1 = 0x03, no continuation
            const decoder = new VersionedDecoder(makeBuf([0x03]), []);
            expect(decoder._vint()).toBe(-1);
        });

        test('decodes a multi-byte vint', () => {
            // value 64: needs continuation
            // first byte = ((64 & 0x3f) << 1) | 0x80 = 0x80 | continuation
            // verify against python
            const decoder = new VersionedDecoder(makeBuf([0x80, 0x01]), []);
            expect(decoder._vint()).toBe(64);
        });
    });

    describe('_int', () => {
        test('reads int with skip byte', () => {
            // skip byte 9, then vint value 1 = 0x02
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new VersionedDecoder(makeBuf([9, 0x02]), typeInfos);
            expect(decoder.instance(0)).toBe(1);
        });

        test('throws on wrong skip byte', () => {
            const typeInfos = [['_int', [[0, 8]]]];
            const decoder = new VersionedDecoder(makeBuf([5, 0x02]), typeInfos);
            expect(() => decoder.instance(0)).toThrow();
        });
    });

    describe('_bool', () => {
        test('returns true', () => {
            // skip byte 6, then 1 byte non-zero
            const typeInfos = [['_bool', []]];
            const decoder = new VersionedDecoder(makeBuf([6, 0x01]), typeInfos);
            expect(decoder.instance(0)).toBe(true);
        });

        test('returns false', () => {
            const typeInfos = [['_bool', []]];
            const decoder = new VersionedDecoder(makeBuf([6, 0x00]), typeInfos);
            expect(decoder.instance(0)).toBe(false);
        });
    });

    describe('_blob', () => {
        test('reads blob correctly', () => {
            // skip byte 2, vint length 3 = 0x06, then 3 bytes
            const typeInfos = [['_blob', [[0, 8]]]];
            const decoder = new VersionedDecoder(makeBuf([2, 0x06, 0x01, 0x02, 0x03]), typeInfos);
            expect(decoder.instance(0)).toEqual(Buffer.from([0x01, 0x02, 0x03]));
        });

        test('reads empty blob', () => {
            const typeInfos = [['_blob', [[0, 8]]]];
            const decoder = new VersionedDecoder(makeBuf([2, 0x00]), typeInfos);
            expect(decoder.instance(0)).toEqual(Buffer.from([]));
        });
    });

    describe('_optional', () => {
        test('returns null when flag is 0', () => {
            // skip byte 4, then 1 byte = 0 (not exists)
            const typeInfos = [
                ['_optional', [1]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([4, 0x00]), typeInfos);
            expect(decoder.instance(0)).toBe(null);
        });

        test('returns decoded value when flag is 1', () => {
            // skip byte 4, exists byte 1, then _int: skip 9, vint value
            const typeInfos = [
                ['_optional', [1]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([4, 0x01, 9, 0x02]), typeInfos);
            expect(decoder.instance(0)).toBe(1);
        });
    });

    describe('_array', () => {
        test('reads array of ints', () => {
            // skip byte 0, vint length 3, then 3 ints each with skip 9 + vint
            const typeInfos = [
                ['_array', [[0, 8], 1]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([0, 0x06, 9, 0x02, 9, 0x04, 9, 0x06]), typeInfos);
            expect(decoder.instance(0)).toEqual([1, 2, 3]);
        });

        test('reads empty array', () => {
            const typeInfos = [
                ['_array', [[0, 8], 1]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([0, 0x00]), typeInfos);
            expect(decoder.instance(0)).toEqual([]);
        });
    });

    describe('_struct', () => {
        test('decodes struct with multiple fields', () => {
            // skip byte 5, vint field count 2
            // field 1: tag vint 0, then _int skip 9 + vint
            // field 2: tag vint 1, then _int skip 9 + vint
            const typeInfos = [
                ['_struct', [[['m_a', 1, 0], ['m_b', 1, 1]]]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([5, 0x04, 0x00, 9, 0x02, 0x02, 9, 0x04]), typeInfos);
            expect(decoder.instance(0)).toEqual({ m_a: 1, m_b: 2 });
        });

        test('skips unknown fields', () => {
            // skip byte 5, vint field count 1, unknown tag 99, then a vint (skip type 9)
            const typeInfos = [
                ['_struct', [[['m_a', 1, 0]]]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([5, 0x02, 0xc6, 0x01, 9, 0x02]), typeInfos);
            expect(decoder.instance(0)).toEqual({});
        });

        test('decodes empty struct', () => {
            const typeInfos = [['_struct', [[]]]];
            const decoder = new VersionedDecoder(makeBuf([5, 0x00]), typeInfos);
            expect(decoder.instance(0)).toEqual({});
        });
    });

    describe('_choice', () => {
        test('decodes correct variant', () => {
            // skip byte 3, tag vint 0, then _int skip 9 + vint
            const typeInfos = [
                ['_choice', [[0, 2], { 0: ['m_value', 1] }]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([3, 0x00, 9, 0x02]), typeInfos);
            expect(decoder.instance(0)).toEqual({ m_value: 1 });
        });

        test('skips unknown choice tag', () => {
            // skip byte 3, unknown tag vint, then a skippable vint value
            const typeInfos = [
                ['_choice', [[0, 2], { 0: ['m_value', 1] }]],
                ['_int', [[0, 8]]]
            ];
            const decoder = new VersionedDecoder(makeBuf([3, 0x06, 9, 0x02]), typeInfos);
            expect(decoder.instance(0)).toEqual({});
        });
    });

    describe('done and usedBits', () => {
        test('done returns false when buffer has data', () => {
            const decoder = new VersionedDecoder(makeBuf([0x00]), []);
            expect(decoder.done()).toBe(false);
        });

        test('done returns true when buffer exhausted', () => {
            const decoder = new VersionedDecoder(makeBuf([0x00]), []);
            decoder._vint();
            expect(decoder.done()).toBe(true);
        });
    });

});
