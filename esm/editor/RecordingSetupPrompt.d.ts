import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
export declare class RecordingSetupPrompt implements Prompt {
    private _doc;
    private readonly _keyboardMode;
    private readonly _keyboardLayout;
    private readonly _bassOffset;
    private readonly _keyboardLayoutPreview;
    private readonly _enableMidi;
    private readonly _showRecordButton;
    private readonly _snapRecordedNotesToRhythm;
    private readonly _ignorePerformedNotesNotInScale;
    private readonly _metronomeCountIn;
    private readonly _metronomeWhileRecording;
    private readonly _okayButton;
    private readonly _cancelButton;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
    private _whenKeyPressed;
    private _confirm;
    private _renderKeyboardLayoutPreview;
}
