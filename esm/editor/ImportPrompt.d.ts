import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
export declare class ImportPrompt implements Prompt {
    private _doc;
    private readonly _fileInput;
    private readonly _cancelButton;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
    private _whenFileSelected;
    private _parseMidiFile;
}
