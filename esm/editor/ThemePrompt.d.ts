import { Prompt } from "./Prompt";
import { SongDocument } from "./SongDocument";
export declare class ThemePrompt implements Prompt {
    private _doc;
    private readonly _themeSelect;
    private readonly _cancelButton;
    private readonly _okayButton;
    readonly container: HTMLDivElement;
    private readonly lastTheme;
    constructor(_doc: SongDocument);
    private _close;
    cleanUp: () => void;
    private _whenKeyPressed;
    private _saveChanges;
    private _previewTheme;
}
