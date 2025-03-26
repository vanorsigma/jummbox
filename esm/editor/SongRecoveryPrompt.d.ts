import { SongDocument } from "./SongDocument";
import { Prompt } from "./Prompt";
export declare class SongRecoveryPrompt implements Prompt {
    private _doc;
    private readonly _songContainer;
    private readonly _cancelButton;
    readonly container: HTMLDivElement;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
}
