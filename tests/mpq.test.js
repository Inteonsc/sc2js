import { expect, test, describe } from 'vitest'
import { MPQArchive } from '../src/reader/mpq.js'

describe('Encryption table generation', () => {
    test('encryption table is generated correctly', () => {
        const mpq = new MPQArchive();
        const table = mpq.prepareEncryptionTable();
        expect(table).toBeDefined();
        expect(table[0]).toBe(0x55c636e2);
        expect(table[0x100]).toBe(0x76f8c1b1);
        expect(table[0x200]).toBe(0x3df6965d);
        expect(table[0x300]).toBe(0x15f261d3);
        expect(table[0x400]).toBe(0x193aa698);
        expect(table[1279]).toBe(0x7303286c);
    })
    test('encryption table has 1280 entries', () => {
        const mpq = new MPQArchive();
        const table = mpq.prepareEncryptionTable();
        expect(Object.keys(table).length).toBe(1280);
    })
})
