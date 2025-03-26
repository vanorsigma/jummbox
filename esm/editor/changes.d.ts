import { FilterType, SustainType } from "../synth/SynthConfig";
import { NotePin, Note, Pattern, FilterSettings, FilterControlPoint, SpectrumWave, HarmonicsWave, Instrument, Channel, Song } from "../synth/synth";
import { Change, ChangeGroup, ChangeSequence, UndoableChange } from "./Change";
import { SongDocument } from "./SongDocument";
import { Slider } from "./HTMLWrapper";
export declare function patternsContainSameInstruments(pattern1Instruments: number[], pattern2Instruments: number[]): boolean;
export declare function discardInvalidPatternInstruments(instruments: number[], song: Song, channelIndex: number): void;
export declare function unionOfUsedNotes(pattern: Pattern, flags: boolean[]): void;
export declare function generateScaleMap(oldScaleFlags: ReadonlyArray<boolean>, newScaleValue: number): number[];
export declare class ChangeMoveAndOverflowNotes extends ChangeGroup {
    constructor(doc: SongDocument, newBeatsPerBar: number, partsToMove: number);
}
declare class ChangePins extends UndoableChange {
    protected _doc: SongDocument | null;
    protected _note: Note;
    protected _oldStart: number;
    protected _newStart: number;
    protected _oldEnd: number;
    protected _newEnd: number;
    protected _oldPins: NotePin[];
    protected _newPins: NotePin[];
    protected _oldPitches: number[];
    protected _newPitches: number[];
    protected _oldContinuesLastPattern: boolean;
    protected _newContinuesLastPattern: boolean;
    constructor(_doc: SongDocument | null, _note: Note);
    protected _finishSetup(continuesLastPattern?: boolean): void;
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeCustomizeInstrument extends Change {
    constructor(doc: SongDocument);
}
export declare class ChangeCustomWave extends Change {
    constructor(doc: SongDocument, newArray: Float32Array);
}
export declare class ChangePreset extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeRandomGeneratedInstrument extends Change {
    constructor(doc: SongDocument);
}
export declare class ChangeTransition extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeToggleEffects extends Change {
    constructor(doc: SongDocument, toggleFlag: number, useInstrument: Instrument | null);
}
export declare class ChangePatternNumbers extends Change {
    constructor(doc: SongDocument, value: number, startBar: number, startChannel: number, width: number, height: number);
}
export declare class ChangeBarCount extends Change {
    constructor(doc: SongDocument, newValue: number, atBeginning: boolean);
}
export declare class ChangeInsertBars extends Change {
    constructor(doc: SongDocument, start: number, count: number);
}
export declare class ChangeDeleteBars extends Change {
    constructor(doc: SongDocument, start: number, count: number);
}
export declare class ChangeLimiterSettings extends Change {
    constructor(doc: SongDocument, limitRatio: number, compressionRatio: number, limitThreshold: number, compressionThreshold: number, limitRise: number, limitDecay: number, masterGain: number);
}
export declare class ChangeChannelOrder extends Change {
    constructor(doc: SongDocument, selectionMin: number, selectionMax: number, offset: number);
}
export declare class ChangeChannelCount extends Change {
    constructor(doc: SongDocument, newPitchChannelCount: number, newNoiseChannelCount: number, newModChannelCount: number);
}
export declare class ChangeAddChannel extends ChangeGroup {
    constructor(doc: SongDocument, index: number, isNoise: boolean, isMod: boolean);
}
export declare class ChangeRemoveChannel extends ChangeGroup {
    constructor(doc: SongDocument, minIndex: number, maxIndex: number);
}
export declare class ChangeChannelBar extends Change {
    constructor(doc: SongDocument, newChannel: number, newBar: number, silently?: boolean);
}
export declare class ChangeUnison extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeChord extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeVibrato extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeVibratoDepth extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeEnvelopeSpeed extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeVibratoSpeed extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeVibratoDelay extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeVibratoType extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeArpeggioSpeed extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeFastTwoNoteArp extends Change {
    constructor(doc: SongDocument, newValue: boolean);
}
export declare class ChangeClicklessTransition extends Change {
    constructor(doc: SongDocument, newValue: boolean);
}
export declare class ChangeAliasing extends Change {
    constructor(doc: SongDocument, newValue: boolean);
}
export declare class ChangeDiscreteEnvelope extends Change {
    constructor(doc: SongDocument, newValue: boolean);
}
export declare class ChangeSpectrum extends Change {
    constructor(doc: SongDocument, instrument: Instrument, spectrumWave: SpectrumWave);
}
export declare class ChangeHarmonics extends Change {
    constructor(doc: SongDocument, instrument: Instrument, harmonicsWave: HarmonicsWave);
}
export declare class ChangeDrumsetEnvelope extends Change {
    constructor(doc: SongDocument, drumIndex: number, newValue: number);
}
declare class ChangeInstrumentSlider extends Change {
    private _doc;
    protected _instrument: Instrument;
    constructor(_doc: SongDocument);
    commit(): void;
}
export declare class ChangePulseWidth extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeSupersawDynamism extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeSupersawSpread extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeSupersawShape extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangePitchShift extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeDetune extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeDistortion extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeBitcrusherFreq extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeBitcrusherQuantization extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeStringSustain extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeStringSustainType extends Change {
    constructor(doc: SongDocument, newValue: SustainType);
}
export declare class ChangeEQFilterType extends Change {
    constructor(doc: SongDocument, instrument: Instrument, newValue: boolean);
}
export declare class ChangeNoteFilterType extends Change {
    constructor(doc: SongDocument, instrument: Instrument, newValue: boolean);
}
export declare class ChangeEQFilterSimpleCut extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeEQFilterSimplePeak extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeNoteFilterSimpleCut extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeNoteFilterSimplePeak extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeFilterAddPoint extends UndoableChange {
    private _doc;
    private _instrument;
    private _instrumentPrevPreset;
    private _instrumentNextPreset;
    private _filterSettings;
    private _point;
    private _index;
    private _envelopeTargetsAdd;
    private _envelopeIndicesAdd;
    private _envelopeTargetsRemove;
    private _envelopeIndicesRemove;
    constructor(doc: SongDocument, filterSettings: FilterSettings, point: FilterControlPoint, index: number, isNoteFilter: boolean, deletion?: boolean);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class FilterMoveData {
    point: FilterControlPoint;
    freq: number;
    gain: number;
    constructor(usePoint: FilterControlPoint, useFreq: number, useGain: number);
}
export declare class ChangeFilterMovePoint extends UndoableChange {
    private _doc;
    private _instrument;
    private _instrumentPrevPreset;
    private _instrumentNextPreset;
    private _point;
    private _oldFreq;
    private _newFreq;
    private _oldGain;
    private _newGain;
    useNoteFilter: boolean;
    pointIndex: number;
    pointType: FilterType;
    constructor(doc: SongDocument, point: FilterControlPoint, oldFreq: number, newFreq: number, oldGain: number, newGain: number, useNoteFilter: boolean, pointIndex: number);
    getMoveData(beforeChange: boolean): FilterMoveData;
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeFilterSettings extends UndoableChange {
    private _doc;
    private _instrument;
    private _instrumentPrevPreset;
    private _instrumentNextPreset;
    private _filterSettings;
    private _subFilters;
    private _oldSubFilters;
    private _oldSettings;
    private _useNoteFilter;
    constructor(doc: SongDocument, settings: FilterSettings, oldSettings: FilterSettings, useNoteFilter: boolean, subFilters?: (FilterSettings | null)[] | null, oldSubFilters?: (FilterSettings | null)[] | null);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeFadeInOut extends UndoableChange {
    private _doc;
    private _instrument;
    private _instrumentPrevPreset;
    private _instrumentNextPreset;
    private _oldFadeIn;
    private _oldFadeOut;
    private _newFadeIn;
    private _newFadeOut;
    constructor(doc: SongDocument, fadeIn: number, fadeOut: number);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeAlgorithm extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeFeedbackType extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeOperatorWaveform extends Change {
    constructor(doc: SongDocument, operatorIndex: number, newValue: number);
}
export declare class ChangeOperatorPulseWidth extends Change {
    constructor(doc: SongDocument, operatorIndex: number, oldValue: number, newValue: number);
}
export declare class ChangeOperatorFrequency extends Change {
    constructor(doc: SongDocument, operatorIndex: number, newValue: number);
}
export declare class ChangeOperatorAmplitude extends ChangeInstrumentSlider {
    operatorIndex: number;
    constructor(doc: SongDocument, operatorIndex: number, oldValue: number, newValue: number);
}
export declare class ChangeFeedbackAmplitude extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeAddChannelInstrument extends Change {
    constructor(doc: SongDocument);
}
export declare class ChangeRemoveChannelInstrument extends Change {
    constructor(doc: SongDocument);
}
export declare class ChangeViewInstrument extends Change {
    constructor(doc: SongDocument, index: number);
}
export declare class ChangeInstrumentsFlags extends Change {
    constructor(doc: SongDocument, newLayeredInstruments: boolean, newPatternInstruments: boolean);
}
export declare class ChangeKey extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeLoop extends Change {
    private _doc;
    oldStart: number;
    oldLength: number;
    newStart: number;
    newLength: number;
    constructor(_doc: SongDocument, oldStart: number, oldLength: number, newStart: number, newLength: number);
}
export declare class ChangePitchAdded extends UndoableChange {
    private _doc;
    private _note;
    private _pitch;
    private _index;
    constructor(doc: SongDocument, note: Note, pitch: number, index: number, deletion?: boolean);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeOctave extends Change {
    oldValue: number;
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeRhythm extends ChangeGroup {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangePaste extends ChangeGroup {
    constructor(doc: SongDocument, pattern: Pattern, notes: any[], selectionStart: number, selectionEnd: number, oldPartDuration: number);
}
export declare class ChangePasteInstrument extends ChangeGroup {
    constructor(doc: SongDocument, instrument: Instrument, instrumentCopy: any);
}
export declare class ChangeSetPatternInstruments extends Change {
    constructor(doc: SongDocument, channelIndex: number, instruments: number[], pattern: Pattern);
}
export declare class ChangeModChannel extends Change {
    constructor(doc: SongDocument, mod: number, index: number, useInstrument?: Instrument);
}
export declare class ChangeModInstrument extends Change {
    constructor(doc: SongDocument, mod: number, tgtInstrument: number);
}
export declare class ChangeModSetting extends Change {
    constructor(doc: SongDocument, mod: number, text: string);
}
export declare class ChangeModFilter extends Change {
    constructor(doc: SongDocument, mod: number, type: number);
}
export declare class ChangePatternsPerChannel extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeEnsurePatternExists extends UndoableChange {
    private _doc;
    private _bar;
    private _channelIndex;
    private _patternIndex;
    private _patternOldNotes;
    private _oldPatternCount;
    private _newPatternCount;
    private _oldPatternInstruments;
    private _newPatternInstruments;
    constructor(doc: SongDocument, channelIndex: number, bar: number);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangePinTime extends ChangePins {
    constructor(doc: SongDocument | null, note: Note, pinIndex: number, shiftedTime: number, continuesLastPattern: boolean);
}
export declare class ChangePitchBend extends ChangePins {
    constructor(doc: SongDocument | null, note: Note, bendStart: number, bendEnd: number, bendTo: number, pitchIndex: number);
}
export declare class ChangePatternRhythm extends ChangeSequence {
    constructor(doc: SongDocument, pattern: Pattern);
}
export declare class ChangeMoveNotesSideways extends ChangeGroup {
    constructor(doc: SongDocument, beatsToMove: number, strategy: string);
}
export declare class ChangeBeatsPerBar extends ChangeGroup {
    constructor(doc: SongDocument, newValue: number, strategy: string);
}
export declare class ChangeScale extends ChangeGroup {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeDetectKey extends ChangeGroup {
    constructor(doc: SongDocument);
}
export declare function pickRandomPresetValue(isNoise: boolean): number;
export declare function setDefaultInstruments(song: Song): void;
export declare class ChangeSong extends ChangeGroup {
    constructor(doc: SongDocument, newHash: string);
}
export declare class ChangeValidateTrackSelection extends Change {
    constructor(doc: SongDocument);
}
export declare class ChangeReplacePatterns extends ChangeGroup {
    constructor(doc: SongDocument, pitchChannels: Channel[], noiseChannels: Channel[], modChannels: Channel[]);
}
export declare function comparePatternNotes(a: Note[], b: Note[]): boolean;
export declare function removeDuplicatePatterns(channels: Channel[]): void;
export declare class ChangeTempo extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeEchoDelay extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeEchoSustain extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeChorus extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeReverb extends ChangeInstrumentSlider {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeSongReverb extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeNoteAdded extends UndoableChange {
    private _doc;
    private _pattern;
    private _note;
    private _index;
    constructor(doc: SongDocument, pattern: Pattern, note: Note, index: number, deletion?: boolean);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeNoteLength extends ChangePins {
    constructor(doc: SongDocument | null, note: Note, truncStart: number, truncEnd: number);
}
export declare class ChangeNoteTruncate extends ChangeSequence {
    constructor(doc: SongDocument, pattern: Pattern, start: number, end: number, skipNote?: Note | null, force?: boolean);
}
export declare class ChangeTranspose extends ChangeSequence {
    constructor(doc: SongDocument, channelIndex: number, pattern: Pattern, upward: boolean, ignoreScale?: boolean, octave?: boolean);
}
export declare class ChangeTrackSelection extends Change {
    constructor(doc: SongDocument, newX0: number, newX1: number, newY0: number, newY1: number);
}
export declare class ChangePatternSelection extends UndoableChange {
    private _doc;
    private _oldStart;
    private _oldEnd;
    private _oldActive;
    private _newStart;
    private _newEnd;
    private _newActive;
    constructor(doc: SongDocument, newStart: number, newEnd: number);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeDragSelectedNotes extends ChangeSequence {
    constructor(doc: SongDocument, channelIndex: number, pattern: Pattern, parts: number, transpose: number);
}
export declare class ChangeHoldingModRecording extends Change {
    storedChange: Change | null;
    storedValues: number[] | null;
    storedSlider: Slider | null;
    constructor(doc: SongDocument, storedChange: Change | null, storedValues: number[] | null, slider: Slider | null);
}
export declare class ChangeDuplicateSelectedReusedPatterns extends ChangeGroup {
    constructor(doc: SongDocument, barStart: number, barWidth: number, channelStart: number, channelHeight: number);
}
export declare class ChangePatternScale extends Change {
    constructor(doc: SongDocument, pattern: Pattern, scaleMap: number[]);
}
export declare class ChangeVolume extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeSongTitle extends Change {
    constructor(doc: SongDocument, oldValue: string, newValue: string);
}
export declare class ChangeChannelName extends Change {
    constructor(doc: SongDocument, oldValue: string, newValue: string);
}
export declare class ChangePan extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangePanDelay extends Change {
    constructor(doc: SongDocument, oldValue: number, newValue: number);
}
export declare class ChangeSizeBend extends UndoableChange {
    private _doc;
    private _note;
    private _oldPins;
    private _newPins;
    constructor(doc: SongDocument, note: Note, bendPart: number, bendSize: number, bendInterval: number, uniformSize: boolean);
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeChipWave extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeNoiseWave extends Change {
    constructor(doc: SongDocument, newValue: number);
}
export declare class ChangeAddEnvelope extends Change {
    constructor(doc: SongDocument);
}
export declare class ChangeRemoveEnvelope extends Change {
    constructor(doc: SongDocument, index: number);
}
export declare class ChangeSetEnvelopeTarget extends Change {
    constructor(doc: SongDocument, envelopeIndex: number, target: number, targetIndex: number);
}
export declare class ChangeSetEnvelopeType extends Change {
    constructor(doc: SongDocument, envelopeIndex: number, newValue: number);
}
export {};
