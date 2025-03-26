import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
export declare class ChannelSettingsPrompt implements Prompt {
    private _doc;
    private readonly _patternsStepper;
    private readonly _pitchChannelStepper;
    private readonly _drumChannelStepper;
    private readonly _modChannelStepper;
    private readonly _layeredInstrumentsBox;
    private readonly _patternInstrumentsBox;
    private readonly _cancelButton;
    private readonly _okayButton;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
    private _whenKeyPressed;
    private static _validateKey;
    private _validateNumber;
    private static _validate;
    private _saveChanges;
}
