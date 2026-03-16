import { expect, test, describe } from 'vitest'
import { BitPackedBuffer } from '../src/reader/decoder.js'
//TODO - Double check these tests are accurate due to ai
describe('BitPackedBuffer', () => {

    describe('done', () => {
        test('returns false when buffer has data', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            expect(buf.finished()).toBe(false);
        });

        test('returns true when buffer is empty', () => {
            const buf = new BitPackedBuffer(Buffer.from([]));
            expect(buf.finished()).toBe(true);
        });

        test('returns true after all bits are read', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            buf.readBits(8);
            expect(buf.finished()).toBe(true);
        });

        test('returns false when partial bits remain', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            buf.readBits(4);
            expect(buf.finished()).toBe(false);
        });
    });

    describe('usedBits', () => {
        test('returns 0 at the start', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            expect(buf.usedBits()).toBe(0);
        });

        test('returns 8 after reading a full byte', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            buf.readBits(8);
            expect(buf.usedBits()).toBe(8);
        });

        test('returns 3 after reading 3 bits', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            buf.readBits(3);
            expect(buf.usedBits()).toBe(3);
        });

        test('returns 16 after reading two full bytes', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF, 0xFF]));
            buf.readBits(16);
            expect(buf.usedBits()).toBe(16);
        });
    });

    describe('byteAlign', () => {
        test('discards remaining bits in current byte', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF, 0x0F]));
            buf.readBits(3);
            buf.byteAlign();
            const result = buf.readBits(8);
            expect(result).toBe(0x0F);
        });

        test('is a no-op when already aligned', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF, 0x0F]));
            buf.readBits(8);
            buf.byteAlign();
            const result = buf.readBits(8);
            expect(result).toBe(0x0F);
        });
    });

    describe('readBits', () => {
        test('reads a full byte', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            expect(buf.readBits(8)).toBe(0xFF);
        });

        test('reads a single bit', () => {
            const buf = new BitPackedBuffer(Buffer.from([0b00000001]));
            expect(buf.readBits(1)).toBe(1);
        });

        test('reads across byte boundary', () => {
            const buf = new BitPackedBuffer(Buffer.from([0b11110000, 0b00001111]));
            buf.readBits(4);
            expect(buf.readBits(8)).toBe(0xFF);
        });

        test('reads 16 bits across two bytes', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xAB, 0xCD]));
            expect(buf.readBits(16)).toBe(0xABCD);
        });

        test('reads sequential values correctly', () => {
            const buf = new BitPackedBuffer(Buffer.from([0b10110100]));
            expect(buf.readBits(2)).toBe(0b00);
            expect(buf.readBits(2)).toBe(0b01);
            expect(buf.readBits(4)).toBe(0b1011);
        });

        test('throws on read past end', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF]));
            buf.readBits(8);
            expect(() => buf.readBits(1)).toThrow();
        });
    });

    describe('readAlignedBytes', () => {
        test('reads n bytes correctly', () => {
            const buf = new BitPackedBuffer(Buffer.from([0x01, 0x02, 0x04]));
            const result = buf.readAlignedBytes(3);
            expect(result).toEqual(Buffer.from([0x01, 0x02, 0x04]));
        });

        test('aligns before reading', () => {
            const buf = new BitPackedBuffer(Buffer.from([0xFF, 0x01, 0x02]));
            buf.readBits(3);
            const result = buf.readAlignedBytes(2);
            expect(result).toEqual(Buffer.from([0x01, 0x02]));
        });

        test('throws on read past end', () => {
            const buf = new BitPackedBuffer(Buffer.from([0x01]));
            expect(() => buf.readAlignedBytes(2)).toThrow();
        });
    });

    describe('endianness', () => {
        test('big and little endian give different results for same input', () => {
            const data = Buffer.from([0b11110000, 0b10101010]);
            const big = new BitPackedBuffer(data, 'big');
            const little = new BitPackedBuffer(data, 'little');
            expect(big.readBits(12)).not.toBe(little.readBits(12));
        });
    });

    describe('readUnalignedBytes', () => {
        test('reads n bytes correctly', () => {
            const buf = new BitPackedBuffer(Buffer.from([0x01, 0x02, 0x03]));
            const result = buf.readUnalignedBytes(3);
            expect(result).toEqual(Buffer.from([0x01, 0x02, 0x03]));
        });

        test('reads from current bit position without aligning', () => {
            const buf = new BitPackedBuffer(Buffer.from([0b11110001, 0b00001111]));
            buf.readBits(4); // consume low 4 bits
            const result = buf.readUnalignedBytes(1);
            // remaining 4 bits of first byte + low 4 bits of second byte
            expect(result).toEqual(Buffer.from([0xFF]));
        });

        test('throws on read past end', () => {
            const buf = new BitPackedBuffer(Buffer.from([0x01]));
            expect(() => buf.readUnalignedBytes(2)).toThrow();
        });
    });


});