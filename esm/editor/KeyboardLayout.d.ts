import { SongDocument } from "./SongDocument";
export declare class KeyboardLayout {
    private _doc;
    private static _pianoAtC;
    private static _pianoAtA;
    static keyPosToPitch(doc: SongDocument, x: number, y: number, keyboardLayout: string): number | null;
    private _possiblyPlayingPitchesFromKeyboard;
    constructor(_doc: SongDocument);
    private _onWindowBlur;
    handleKeyEvent(event: KeyboardEvent, pressed: boolean): void;
    handleKey(x: number, y: number, pressed: boolean): void;
}
