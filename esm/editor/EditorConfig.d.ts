import { DictionaryArray, BeepBoxOption, InstrumentType } from "../synth/SynthConfig";
export interface PresetCategory extends BeepBoxOption {
    readonly presets: DictionaryArray<Preset>;
}
export interface Preset extends BeepBoxOption {
    readonly isNoise?: boolean;
    readonly isMod?: boolean;
    readonly generalMidi?: boolean;
    readonly midiProgram?: number;
    readonly midiSubharmonicOctaves?: number;
    readonly customType?: InstrumentType;
    readonly settings?: any;
}
export declare const isMobile: boolean;
export declare function prettyNumber(value: number): string;
export declare class EditorConfig {
    static readonly version: string;
    static readonly versionDisplayName: string;
    static readonly releaseNotesURL: string;
    static readonly isOnMac: boolean;
    static readonly ctrlSymbol: string;
    static readonly ctrlName: string;
    static readonly presetCategories: DictionaryArray<PresetCategory>;
    static valueToPreset(presetValue: number): Preset | null;
    static midiProgramToPresetValue(program: number): number | null;
    static nameToPresetValue(presetName: string): number | null;
}
