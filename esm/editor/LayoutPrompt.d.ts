import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
export declare class LayoutPrompt implements Prompt {
    private _doc;
    private readonly _fileInput;
    private readonly _okayButton;
    private readonly _cancelButton;
    private readonly _form;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
    private _whenKeyPressed;
    private _confirm;
}
