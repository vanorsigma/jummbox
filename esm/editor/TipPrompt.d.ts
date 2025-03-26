import { Prompt } from "./Prompt";
import { SongDocument } from "./SongDocument";
export declare class TipPrompt implements Prompt {
    private _doc;
    private readonly _closeButton;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument, type: string);
    private _close;
    cleanUp: () => void;
}
