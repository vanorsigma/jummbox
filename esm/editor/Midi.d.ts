export declare const defaultMidiExpression: number;
export declare const defaultMidiPitchBend: number;
export declare const enum MidiChunkType {
    header = 1297377380,
    track = 1297379947
}
export declare const enum MidiFileFormat {
    singleTrack = 0,
    simultaneousTracks = 1,
    independentTracks = 2
}
export declare const enum MidiEventType {
    noteOff = 128,
    noteOn = 144,
    keyPressure = 160,
    controlChange = 176,
    programChange = 192,
    channelPressure = 208,
    pitchBend = 224,
    metaAndSysex = 240,
    meta = 255
}
export declare const enum MidiControlEventMessage {
    setParameterMSB = 6,
    volumeMSB = 7,
    panMSB = 10,
    expressionMSB = 11,
    setParameterLSB = 38,
    registeredParameterNumberLSB = 100,
    registeredParameterNumberMSB = 101
}
export declare const enum MidiRegisteredParameterNumberMSB {
    pitchBendRange = 0,
    fineTuning = 0,
    coarseTuning = 0,
    tuningProgramSelect = 0,
    tuningBankSelect = 0,
    reset = 127
}
export declare const enum MidiRegisteredParameterNumberLSB {
    pitchBendRange = 0,
    fineTuning = 1,
    coarseTuning = 2,
    tuningProgramSelect = 3,
    tuningBankSelect = 4,
    reset = 127
}
export declare const enum MidiMetaEventMessage {
    sequenceNumber = 0,
    text = 1,
    copyrightNotice = 2,
    trackName = 3,
    instrumentName = 4,
    lyricText = 5,
    marker = 6,
    cuePoint = 7,
    channelPrefix = 32,
    endOfTrack = 47,
    tempo = 81,
    smpteOffset = 84,
    timeSignature = 88,
    keySignature = 89,
    sequencerSpecificEvent = 127
}
export interface AnalogousDrum {
    frequency: number;
    duration: number;
    volume: number;
}
export declare const analogousDrumMap: {
    [K: number]: AnalogousDrum;
};
export declare function midiVolumeToVolumeMult(volume: number): number;
export declare function volumeMultToMidiVolume(volumeMult: number): number;
export declare function midiExpressionToVolumeMult(expression: number): number;
export declare function volumeMultToMidiExpression(volumeMult: number): number;
