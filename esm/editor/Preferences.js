import { Config } from "../synth/SynthConfig";
export class Preferences {
    constructor() {
        this.volume = 75;
        this.visibleOctaves = Preferences.defaultVisibleOctaves;
        this.reload();
    }
    reload() {
        this.autoPlay = window.localStorage.getItem("autoPlay") == "true";
        this.autoFollow = window.localStorage.getItem("autoFollow") != "false";
        this.enableNotePreview = window.localStorage.getItem("enableNotePreview") != "false";
        this.showFifth = window.localStorage.getItem("showFifth") == "true";
        this.notesOutsideScale = window.localStorage.getItem("notesOutsideScale") == "true";
        this.showLetters = window.localStorage.getItem("showLetters") == "true";
        this.showChannels = window.localStorage.getItem("showChannels") == "true";
        this.showScrollBar = window.localStorage.getItem("showScrollBar") == "true";
        this.alwaysFineNoteVol = window.localStorage.getItem("alwaysFineNoteVol") == "true";
        this.displayVolumeBar = window.localStorage.getItem("displayVolumeBar") == "true";
        this.instrumentCopyPaste = window.localStorage.getItem("instrumentCopyPaste") == "true";
        this.enableChannelMuting = window.localStorage.getItem("enableChannelMuting") == "true";
        this.displayBrowserUrl = window.localStorage.getItem("displayBrowserUrl") != "false";
        this.pressControlForShortcuts = window.localStorage.getItem("pressControlForShortcuts") == "true";
        this.enableMidi = window.localStorage.getItem("enableMidi") != "false";
        this.showRecordButton = window.localStorage.getItem("showRecordButton") == "true";
        this.snapRecordedNotesToRhythm = window.localStorage.getItem("snapRecordedNotesToRhythm") == "true";
        this.ignorePerformedNotesNotInScale = window.localStorage.getItem("ignorePerformedNotesNotInScale") == "true";
        this.metronomeCountIn = window.localStorage.getItem("metronomeCountIn") != "false";
        this.metronomeWhileRecording = window.localStorage.getItem("metronomeWhileRecording") != "false";
        this.keyboardLayout = window.localStorage.getItem("keyboardLayout") || "wickiHayden";
        this.bassOffset = (+window.localStorage.getItem("bassOffset")) || 0;
        this.layout = window.localStorage.getItem("layout") || "small";
        this.colorTheme = window.localStorage.getItem("colorTheme") || "jummbox classic";
        this.visibleOctaves = (window.localStorage.getItem("visibleOctaves") >>> 0) || Preferences.defaultVisibleOctaves;
        const defaultScale = Config.scales.dictionary[window.localStorage.getItem("defaultScale")];
        this.defaultScale = (defaultScale != undefined) ? defaultScale.index : 0;
        if (window.localStorage.getItem("volume") != null) {
            this.volume = Math.min(window.localStorage.getItem("volume") >>> 0, 75);
        }
        if (window.localStorage.getItem("fullScreen") != null) {
            if (window.localStorage.getItem("fullScreen") == "true")
                this.layout = "long";
            window.localStorage.removeItem("fullScreen");
        }
    }
    save() {
        window.localStorage.setItem("autoPlay", this.autoPlay ? "true" : "false");
        window.localStorage.setItem("autoFollow", this.autoFollow ? "true" : "false");
        window.localStorage.setItem("enableNotePreview", this.enableNotePreview ? "true" : "false");
        window.localStorage.setItem("showFifth", this.showFifth ? "true" : "false");
        window.localStorage.setItem("notesOutsideScale", this.notesOutsideScale ? "true" : "false");
        window.localStorage.setItem("defaultScale", Config.scales[this.defaultScale].name);
        window.localStorage.setItem("showLetters", this.showLetters ? "true" : "false");
        window.localStorage.setItem("showChannels", this.showChannels ? "true" : "false");
        window.localStorage.setItem("showScrollBar", this.showScrollBar ? "true" : "false");
        window.localStorage.setItem("alwaysFineNoteVol", this.alwaysFineNoteVol ? "true" : "false");
        window.localStorage.setItem("displayVolumeBar", this.displayVolumeBar ? "true" : "false");
        window.localStorage.setItem("enableChannelMuting", this.enableChannelMuting ? "true" : "false");
        window.localStorage.setItem("instrumentCopyPaste", this.instrumentCopyPaste ? "true" : "false");
        window.localStorage.setItem("displayBrowserUrl", this.displayBrowserUrl ? "true" : "false");
        window.localStorage.setItem("pressControlForShortcuts", this.pressControlForShortcuts ? "true" : "false");
        window.localStorage.setItem("enableMidi", this.enableMidi ? "true" : "false");
        window.localStorage.setItem("showRecordButton", this.showRecordButton ? "true" : "false");
        window.localStorage.setItem("snapRecordedNotesToRhythm", this.snapRecordedNotesToRhythm ? "true" : "false");
        window.localStorage.setItem("ignorePerformedNotesNotInScale", this.ignorePerformedNotesNotInScale ? "true" : "false");
        window.localStorage.setItem("metronomeCountIn", this.metronomeCountIn ? "true" : "false");
        window.localStorage.setItem("metronomeWhileRecording", this.metronomeWhileRecording ? "true" : "false");
        window.localStorage.setItem("keyboardLayout", this.keyboardLayout);
        window.localStorage.setItem("bassOffset", String(this.bassOffset));
        window.localStorage.setItem("layout", this.layout);
        window.localStorage.setItem("colorTheme", this.colorTheme);
        window.localStorage.setItem("volume", String(this.volume));
        window.localStorage.setItem("visibleOctaves", String(this.visibleOctaves));
    }
}
Preferences.defaultVisibleOctaves = 3;
//# sourceMappingURL=Preferences.js.map