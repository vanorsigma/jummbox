export declare class ArrayBufferWriter {
    private _writeIndex;
    private _fileSize;
    private _arrayBuffer;
    private _data;
    constructor(initialCapacity: number);
    private _addBytes;
    getWriteIndex(): number;
    rewriteUint32(index: number, value: number): void;
    writeUint32(value: number): void;
    writeUint24(value: number): void;
    writeUint16(value: number): void;
    writeUint8(value: number): void;
    writeInt8(value: number): void;
    writeMidi7Bits(value: number): void;
    writeMidiVariableLength(value: number): void;
    writeMidiAscii(string: string): void;
    toCompactArrayBuffer(): ArrayBuffer;
}
