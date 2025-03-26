import { SongDocument } from "./SongDocument";
declare global {
    interface Navigator {
        requestMIDIAccess?(): Promise<any>;
    }
}
export declare class MidiInputHandler {
    private _doc;
    constructor(_doc: SongDocument);
    private registerMidiAccessHandler;
    private _takeMidiHandlerFocus;
    private _handleStateChange;
    private _registerMidiInput;
    private _unregisterMidiInput;
    private _onMidiMessage;
}
