import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
export declare class SustainPrompt implements Prompt {
    private _doc;
    private readonly _typeSelect;
    private readonly _cancelButton;
    private readonly _okayButton;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
    private _whenKeyPressed;
    private _saveChanges;
}
