import { expect, test, describe } from 'vitest'
import { MPQArchive } from '../src/reader/mpq.js'

describe('Encryption table generation', () => {
    test('encryption table is generated correctly', () => {
        const mpq = new MPQArchive("tests/fixtures/testreplay.SC2Replay",  false);
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
        const mpq = new MPQArchive("tests/fixtures/testreplay.SC2Replay",  false);
        const table = mpq.prepareEncryptionTable();
        expect(Object.keys(table).length).toBe(1280);
    })
})
describe('MPQArchive class', () => {
    test('Reads User Data header correctly', () => {
        const mpq = new MPQArchive('tests/fixtures/testreplay.SC2Replay', false);
        expect(mpq.UserDataHeader).toBeDefined();
        expect(mpq.UserDataHeader.mpq_header_offset).toBe(1024);
        expect(mpq.UserDataHeader.user_data_size).toBe(512);
        expect(mpq.UserDataHeader.user_data_header_size).toBe(114);
    })
    test('Reads MPQ header correctly', () => {
        const mpq = new MPQArchive('tests/fixtures/testreplay.SC2Replay', false);
        expect(mpq.header).toBeDefined();
        expect(mpq.header.header_size).toBe(208);
        expect(mpq.header.archive_size).toBe(38360);
        expect(mpq.header.format_version).toBe(3);
        expect(mpq.header.sector_size_shift).toBe(5);
        expect(mpq.header.hash_table_offset).toBe(37576);
        expect(mpq.header.block_table_offset).toBe(38088);
        expect(mpq.header.hash_table_entries).toBe(32);
        expect(mpq.header.block_table_entries).toBe(17);
    })
    test('Reads hash table correctly', () => {
        const mpq = new MPQArchive('tests/fixtures/testreplay.SC2Replay', false);
        expect(mpq.hashTable).toBeDefined();
        expect(mpq.hashTable.length).toBe(32);
        expect(mpq.hashTable[0].hash_a).toBe(3590964654);
        expect(mpq.hashTable[0].hash_b).toBe(3400061273);
        expect(mpq.hashTable[0].locale).toBe(0);
        expect(mpq.hashTable[0].platform).toBe(0);
        expect(mpq.hashTable[0].block_table_index).toBe(1);
        expect(mpq.hashTable[10].hash_a).toBe(3548627612);
        expect(mpq.hashTable[10].hash_b).toBe(4013960850);
        expect(mpq.hashTable[10].locale).toBe(0);
        expect(mpq.hashTable[10].platform).toBe(0);
        expect(mpq.hashTable[10].block_table_index).toBe(0);
    })
    test('Reads block table correctly', () => {
        const mpq = new MPQArchive('tests/fixtures/testreplay.SC2Replay', false);
        expect(mpq.blockTable).toBeDefined();
        expect(mpq.blockTable.length).toBe(17);
        expect(mpq.blockTable[0].offset).toBe(1232);
        expect(mpq.blockTable[0].compressed_size).toBe(585);
        expect(mpq.blockTable[0].real_size).toBe(585);
        expect(mpq.blockTable[0].flags).toBe(2164261376);
        expect(mpq.blockTable[5].offset).toBe(6049);
        expect(mpq.blockTable[5].compressed_size).toBe(17624);
        expect(mpq.blockTable[5].real_size).toBe(33413);
        expect(mpq.blockTable[5].flags).toBe(2164261376);
    })
})
