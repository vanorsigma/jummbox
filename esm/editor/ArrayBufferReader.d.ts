export declare class ArrayBufferReader {
    private _readIndex;
    private _data;
    constructor(data: DataView);
    getReadIndex(): number;
    readUint32(): number;
    readUint24(): number;
    readUint16(): number;
    readUint8(): number;
    readInt8(): number;
    peakUint8(): number;
    readMidi7Bits(): number;
    readMidiVariableLength(): number;
    skipBytes(length: number): void;
    hasMore(): boolean;
    getReaderForNextBytes(length: number): ArrayBufferReader;
}
