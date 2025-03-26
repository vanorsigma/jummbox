import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
export declare class BeatsPerBarPrompt implements Prompt {
    private _doc;
    private readonly _beatsStepper;
    private readonly _conversionStrategySelect;
    private readonly _cancelButton;
    private readonly _okayButton;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
    private _whenKeyPressed;
    private static _validateKey;
    private static _validateNumber;
    private static _validate;
    private _saveChanges;
}
