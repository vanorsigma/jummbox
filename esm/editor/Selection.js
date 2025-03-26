import { Config } from "../synth/SynthConfig";
import { ChangeGroup } from "./Change";
import { ColorConfig } from "./ColorConfig";
import { ChangeTrackSelection, ChangeChannelBar, ChangeAddChannel, ChangeRemoveChannel, ChangeChannelOrder, ChangeDuplicateSelectedReusedPatterns, ChangeNoteAdded, ChangeNoteTruncate, ChangePatternNumbers, ChangePatternSelection, ChangeInsertBars, ChangeDeleteBars, ChangeEnsurePatternExists, ChangeNoteLength, ChangePaste, ChangeSetPatternInstruments, ChangeViewInstrument, ChangeModChannel, ChangeModInstrument, ChangeModSetting, ChangeModFilter, ChangePatternsPerChannel, ChangePatternRhythm, ChangePatternScale, ChangeTranspose, ChangeRhythm, comparePatternNotes, unionOfUsedNotes, generateScaleMap, discardInvalidPatternInstruments, patternsContainSameInstruments } from "./changes";
export class Selection {
    constructor(_doc) {
        this._doc = _doc;
        this.boxSelectionX0 = 0;
        this.boxSelectionY0 = 0;
        this.boxSelectionX1 = 0;
        this.boxSelectionY1 = 0;
        this.digits = "";
        this.instrumentDigits = "";
        this.patternSelectionStart = 0;
        this.patternSelectionEnd = 0;
        this.patternSelectionActive = false;
        this._changeTranspose = null;
        this._changeTrack = null;
        this._changeInstrument = null;
        this._changeReorder = null;
    }
    toJSON() {
        return {
            "x0": this.boxSelectionX0,
            "x1": this.boxSelectionX1,
            "y0": this.boxSelectionY0,
            "y1": this.boxSelectionY1,
            "start": this.patternSelectionStart,
            "end": this.patternSelectionEnd,
        };
    }
    fromJSON(json) {
        if (json == null)
            return;
        this.boxSelectionX0 = +json["x0"];
        this.boxSelectionX1 = +json["x1"];
        this.boxSelectionY0 = +json["y0"];
        this.boxSelectionY1 = +json["y1"];
        this.patternSelectionStart = +json["start"];
        this.patternSelectionEnd = +json["end"];
        this.digits = "";
        this.instrumentDigits = "";
        this.patternSelectionActive = this.patternSelectionStart < this.patternSelectionEnd;
    }
    selectionUpdated() {
        this._doc.notifier.changed();
        this.digits = "";
        this.instrumentDigits = "";
    }
    get boxSelectionBar() {
        return Math.min(this.boxSelectionX0, this.boxSelectionX1);
    }
    get boxSelectionChannel() {
        return Math.min(this.boxSelectionY0, this.boxSelectionY1);
    }
    get boxSelectionWidth() {
        return Math.abs(this.boxSelectionX0 - this.boxSelectionX1) + 1;
    }
    get boxSelectionHeight() {
        return Math.abs(this.boxSelectionY0 - this.boxSelectionY1) + 1;
    }
    get boxSelectionActive() {
        return this.boxSelectionWidth > 1 || this.boxSelectionHeight > 1;
    }
    scrollToSelectedPattern() {
        this._doc.barScrollPos = Math.min(this._doc.bar, Math.max(this._doc.bar - (this._doc.trackVisibleBars - 1), this._doc.barScrollPos));
        this._doc.channelScrollPos = Math.min(this._doc.channel, Math.max(this._doc.channel - (this._doc.trackVisibleChannels - 1), this._doc.channelScrollPos));
    }
    scrollToEndOfSelection() {
        this._doc.barScrollPos = Math.min(this.boxSelectionX1, Math.max(this.boxSelectionX1 - (this._doc.trackVisibleBars - 1), this._doc.barScrollPos));
        this._doc.channelScrollPos = Math.min(this.boxSelectionY1, Math.max(this.boxSelectionY1 - (this._doc.trackVisibleChannels - 1), this._doc.channelScrollPos));
    }
    setChannelBar(channelIndex, bar) {
        if (channelIndex == this._doc.channel && bar == this._doc.bar)
            return;
        const canReplaceLastChange = this._doc.lastChangeWas(this._changeTrack);
        this._changeTrack = new ChangeGroup();
        this._changeTrack.append(new ChangeChannelBar(this._doc, channelIndex, bar));
        const pattern = this._doc.getCurrentPattern(0);
        if (pattern != null) {
            if (pattern.instruments.indexOf(this._doc.viewedInstrument[this._doc.channel]) < 0) {
                this._doc.viewedInstrument[this._doc.channel] = pattern.instruments[0];
            }
        }
        if (!this._doc.hasRedoHistory()) {
            this._doc.record(this._changeTrack, canReplaceLastChange);
        }
        this.selectionUpdated();
    }
    setPattern(pattern) {
        this._doc.record(new ChangePatternNumbers(this._doc, pattern, this.boxSelectionBar, this.boxSelectionChannel, this.boxSelectionWidth, this.boxSelectionHeight));
    }
    nextDigit(digit, forInstrument, forRhythms) {
        if (forRhythms) {
            if (digit == "3") {
                this._doc.record(new ChangeRhythm(this._doc, 0));
            }
            else if (digit == "4") {
                this._doc.record(new ChangeRhythm(this._doc, 1));
            }
            else if (digit == "6") {
                this._doc.record(new ChangeRhythm(this._doc, 2));
            }
            else if (digit == "8") {
                this._doc.record(new ChangeRhythm(this._doc, 3));
            }
            else if (digit == "0" || digit == "1") {
                this._doc.record(new ChangeRhythm(this._doc, 4));
            }
        }
        else if (forInstrument) {
            if (digit == "0")
                digit = "10";
            this.instrumentDigits += digit;
            var parsed = parseInt(this.instrumentDigits);
            if (parsed != 0 && parsed <= this._doc.song.channels[this._doc.channel].instruments.length) {
                this.selectInstrument(parsed - 1);
                return;
            }
            this.instrumentDigits = digit;
            parsed = parseInt(this.instrumentDigits);
            if (parsed != 0 && parsed <= this._doc.song.channels[this._doc.channel].instruments.length) {
                this.selectInstrument(parsed - 1);
                return;
            }
            this.instrumentDigits = "";
        }
        else {
            this.digits += digit;
            let parsed = parseInt(this.digits);
            if (parsed <= this._doc.song.patternsPerChannel) {
                this.setPattern(parsed);
                return;
            }
            this.digits = digit;
            parsed = parseInt(this.digits);
            if (parsed <= this._doc.song.patternsPerChannel) {
                this.setPattern(parsed);
                return;
            }
            this.digits = "";
        }
    }
    setModChannel(mod, index) {
        this._doc.record(new ChangeModChannel(this._doc, mod, index));
    }
    setModInstrument(mod, instrument) {
        this._doc.record(new ChangeModInstrument(this._doc, mod, instrument));
    }
    setModSetting(mod, text) {
        this._doc.record(new ChangeModSetting(this._doc, mod, text));
    }
    setModFilter(mod, type) {
        this._doc.record(new ChangeModFilter(this._doc, mod, type));
    }
    insertBars() {
        this._doc.record(new ChangeInsertBars(this._doc, this.boxSelectionBar + this.boxSelectionWidth, this.boxSelectionWidth));
        const width = this.boxSelectionWidth;
        this.boxSelectionX0 += width;
        this.boxSelectionX1 += width;
    }
    insertChannel() {
        const group = new ChangeGroup();
        const insertIndex = this.boxSelectionChannel + this.boxSelectionHeight;
        const isNoise = this._doc.song.getChannelIsNoise(insertIndex - 1);
        const isMod = this._doc.song.getChannelIsMod(insertIndex - 1);
        group.append(new ChangeAddChannel(this._doc, insertIndex, isNoise, isMod));
        if (!group.isNoop()) {
            this.boxSelectionY0 = this.boxSelectionY1 = insertIndex;
            group.append(new ChangeChannelBar(this._doc, insertIndex, this._doc.bar));
            this._doc.record(group);
        }
    }
    deleteBars() {
        const group = new ChangeGroup();
        if (this._doc.selection.patternSelectionActive) {
            if (this.boxSelectionActive) {
                group.append(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, this.boxSelectionWidth, this.boxSelectionChannel, this.boxSelectionHeight));
            }
            for (const channelIndex of this._eachSelectedChannel()) {
                for (const pattern of this._eachSelectedPattern(channelIndex)) {
                    group.append(new ChangeNoteTruncate(this._doc, pattern, this._doc.selection.patternSelectionStart, this._doc.selection.patternSelectionEnd));
                }
            }
            group.append(new ChangePatternSelection(this._doc, 0, 0));
        }
        else {
            group.append(new ChangeDeleteBars(this._doc, this.boxSelectionBar, this.boxSelectionWidth));
            const width = this.boxSelectionWidth;
            this.boxSelectionX0 = Math.max(0, this.boxSelectionX0 - width);
            this.boxSelectionX1 = Math.max(0, this.boxSelectionX1 - width);
        }
        this._doc.record(group);
    }
    deleteChannel() {
        this._doc.record(new ChangeRemoveChannel(this._doc, this.boxSelectionChannel, this.boxSelectionChannel + this.boxSelectionHeight - 1));
        this.boxSelectionY0 = this.boxSelectionY1 = this._doc.channel;
        ColorConfig.resetColors();
    }
    *_eachSelectedChannel() {
        for (let channelIndex = this.boxSelectionChannel; channelIndex < this.boxSelectionChannel + this.boxSelectionHeight; channelIndex++) {
            yield channelIndex;
        }
    }
    *_eachSelectedBar() {
        for (let bar = this.boxSelectionBar; bar < this.boxSelectionBar + this.boxSelectionWidth; bar++) {
            yield bar;
        }
    }
    *_eachSelectedPattern(channelIndex) {
        const handledPatterns = {};
        for (const bar of this._eachSelectedBar()) {
            const currentPatternIndex = this._doc.song.channels[channelIndex].bars[bar];
            if (currentPatternIndex == 0)
                continue;
            if (handledPatterns[String(currentPatternIndex)])
                continue;
            handledPatterns[String(currentPatternIndex)] = true;
            const pattern = this._doc.song.getPattern(channelIndex, bar);
            if (pattern == null)
                throw new Error();
            yield pattern;
        }
    }
    _parseCopiedInstrumentArray(patternCopy, channelIndex) {
        const instruments = Array.from(patternCopy["instruments"]).map(i => i >>> 0);
        discardInvalidPatternInstruments(instruments, this._doc.song, channelIndex);
        return instruments;
    }
    _patternIndexIsUnused(channelIndex, patternIndex) {
        for (let i = 0; i < this._doc.song.barCount; i++) {
            if (this._doc.song.channels[channelIndex].bars[i] == patternIndex) {
                return false;
            }
        }
        return true;
    }
    copy() {
        const channels = [];
        for (const channelIndex of this._eachSelectedChannel()) {
            const patterns = {};
            const bars = [];
            for (const bar of this._eachSelectedBar()) {
                const patternNumber = this._doc.song.channels[channelIndex].bars[bar];
                bars.push(patternNumber);
                if (patterns[String(patternNumber)] == undefined) {
                    const pattern = this._doc.song.getPattern(channelIndex, bar);
                    let instruments = this._doc.recentPatternInstruments[channelIndex];
                    let notes = [];
                    if (pattern != null) {
                        instruments = pattern.instruments.concat();
                        if (this.patternSelectionActive) {
                            for (const note of pattern.cloneNotes()) {
                                if (note.end <= this.patternSelectionStart)
                                    continue;
                                if (note.start >= this.patternSelectionEnd)
                                    continue;
                                note.start -= this.patternSelectionStart;
                                note.end -= this.patternSelectionStart;
                                if (note.start < 0 || note.end > this.patternSelectionEnd - this.patternSelectionStart) {
                                    new ChangeNoteLength(null, note, Math.max(note.start, 0), Math.min(this.patternSelectionEnd - this.patternSelectionStart, note.end));
                                }
                                notes.push(note);
                            }
                        }
                        else {
                            notes = pattern.notes;
                        }
                    }
                    patterns[String(patternNumber)] = { "instruments": instruments, "notes": notes };
                }
            }
            const channelCopy = {
                "isNoise": this._doc.song.getChannelIsNoise(channelIndex),
                "isMod": this._doc.song.getChannelIsMod(channelIndex),
                "patterns": patterns,
                "bars": bars,
            };
            channels.push(channelCopy);
        }
        const selectionCopy = {
            "partDuration": this.patternSelectionActive ? this.patternSelectionEnd - this.patternSelectionStart : this._doc.song.beatsPerBar * Config.partsPerBeat,
            "channels": channels,
        };
        window.localStorage.setItem("selectionCopy", JSON.stringify(selectionCopy));
        new ChangePatternSelection(this._doc, 0, 0);
    }
    pasteNotes() {
        const selectionCopy = JSON.parse(String(window.localStorage.getItem("selectionCopy")));
        if (selectionCopy == null)
            return;
        const channelCopies = selectionCopy["channels"] || [];
        const copiedPartDuration = selectionCopy["partDuration"] >>> 0;
        const group = new ChangeGroup();
        const fillSelection = (this.boxSelectionWidth > 1 || this.boxSelectionHeight > 1);
        const pasteHeight = fillSelection ? this.boxSelectionHeight : Math.min(channelCopies.length, this._doc.song.getChannelCount() - this.boxSelectionChannel);
        for (let pasteChannel = 0; pasteChannel < pasteHeight; pasteChannel++) {
            const channelCopy = channelCopies[pasteChannel % channelCopies.length];
            const channelIndex = this.boxSelectionChannel + pasteChannel;
            const isNoise = !!channelCopy["isNoise"];
            const isMod = !!channelCopy["isMod"];
            const patternCopies = channelCopy["patterns"] || {};
            const copiedBars = channelCopy["bars"] || [];
            if (copiedBars.length == 0)
                continue;
            if (isNoise != this._doc.song.getChannelIsNoise(channelIndex))
                continue;
            if (isMod != this._doc.song.getChannelIsMod(channelIndex))
                continue;
            const pasteWidth = fillSelection ? this.boxSelectionWidth : Math.min(copiedBars.length, this._doc.song.barCount - this.boxSelectionBar);
            if (!fillSelection && copiedBars.length == 1 && channelCopies.length == 1) {
                const copiedPatternIndex = copiedBars[0] >>> 0;
                const bar = this.boxSelectionBar;
                const currentPatternIndex = this._doc.song.channels[channelIndex].bars[bar];
                if (copiedPatternIndex == 0 && currentPatternIndex == 0)
                    continue;
                const patternCopy = patternCopies[String(copiedPatternIndex)];
                const instrumentsCopy = this._parseCopiedInstrumentArray(patternCopy, channelIndex);
                if (currentPatternIndex == 0) {
                    const existingPattern = this._doc.song.channels[channelIndex].patterns[copiedPatternIndex - 1];
                    if (existingPattern != undefined &&
                        !this.patternSelectionActive &&
                        ((comparePatternNotes(patternCopy["notes"], existingPattern.notes) && patternsContainSameInstruments(instrumentsCopy, existingPattern.instruments)) ||
                            this._patternIndexIsUnused(channelIndex, copiedPatternIndex))) {
                        group.append(new ChangePatternNumbers(this._doc, copiedPatternIndex, bar, channelIndex, 1, 1));
                    }
                    else {
                        group.append(new ChangeEnsurePatternExists(this._doc, channelIndex, bar));
                    }
                }
                const pattern = this._doc.song.getPattern(channelIndex, bar);
                if (pattern == null)
                    throw new Error();
                group.append(new ChangePaste(this._doc, pattern, patternCopy["notes"], this.patternSelectionActive ? this.patternSelectionStart : 0, this.patternSelectionActive ? this.patternSelectionEnd : Config.partsPerBeat * this._doc.song.beatsPerBar, copiedPartDuration));
                if (currentPatternIndex == 0 || patternCopy.notes.length == 0 || channelIndex >= this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount) {
                    this.selectInstrument(instrumentsCopy[0]);
                    group.append(new ChangeSetPatternInstruments(this._doc, channelIndex, instrumentsCopy, pattern));
                }
            }
            else if (this.patternSelectionActive) {
                const reusablePatterns = {};
                const usedPatterns = {};
                group.append(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, pasteWidth, this.boxSelectionChannel, pasteHeight));
                for (let pasteBar = 0; pasteBar < pasteWidth; pasteBar++) {
                    const bar = this.boxSelectionBar + pasteBar;
                    const copiedPatternIndex = copiedBars[pasteBar % copiedBars.length] >>> 0;
                    const currentPatternIndex = this._doc.song.channels[channelIndex].bars[bar];
                    const reusedIndex = [copiedPatternIndex, currentPatternIndex].join(",");
                    if (copiedPatternIndex == 0 && currentPatternIndex == 0)
                        continue;
                    if (reusablePatterns[reusedIndex] != undefined) {
                        group.append(new ChangePatternNumbers(this._doc, reusablePatterns[reusedIndex], bar, channelIndex, 1, 1));
                        continue;
                    }
                    if (currentPatternIndex == 0) {
                        group.append(new ChangeEnsurePatternExists(this._doc, channelIndex, bar));
                        const patternCopy = patternCopies[String(copiedPatternIndex)];
                        const instrumentsCopy = this._parseCopiedInstrumentArray(patternCopy, channelIndex);
                        const pattern = this._doc.song.getPattern(channelIndex, bar);
                        group.append(new ChangeSetPatternInstruments(this._doc, channelIndex, instrumentsCopy, pattern));
                    }
                    else {
                        const pattern = this._doc.song.getPattern(channelIndex, bar);
                        if (pattern == null)
                            throw new Error();
                        if (!usedPatterns[String(currentPatternIndex)]) {
                            usedPatterns[String(currentPatternIndex)] = true;
                        }
                        else {
                            group.append(new ChangePatternNumbers(this._doc, 0, bar, channelIndex, 1, 1));
                            group.append(new ChangeEnsurePatternExists(this._doc, channelIndex, bar));
                            const newPattern = this._doc.song.getPattern(channelIndex, bar);
                            if (newPattern == null)
                                throw new Error();
                            for (const note of pattern.cloneNotes()) {
                                group.append(new ChangeNoteAdded(this._doc, newPattern, note, newPattern.notes.length, false));
                            }
                        }
                    }
                    const pattern = this._doc.song.getPattern(channelIndex, bar);
                    if (pattern == null)
                        throw new Error();
                    if (copiedPatternIndex == 0) {
                        group.append(new ChangeNoteTruncate(this._doc, pattern, this.patternSelectionStart, this.patternSelectionEnd));
                    }
                    else {
                        const patternCopy = patternCopies[String(copiedPatternIndex)];
                        group.append(new ChangePaste(this._doc, pattern, patternCopy["notes"], this.patternSelectionStart, this.patternSelectionEnd, copiedPartDuration));
                    }
                    reusablePatterns[reusedIndex] = this._doc.song.channels[channelIndex].bars[bar];
                }
            }
            else {
                for (let pasteBar = 0; pasteBar < pasteWidth; pasteBar++) {
                    this.erasePatternInBar(group, channelIndex, this.boxSelectionBar + pasteBar);
                }
                const reusablePatterns = {};
                for (let pasteBar = 0; pasteBar < pasteWidth; pasteBar++) {
                    const bar = this.boxSelectionBar + pasteBar;
                    const copiedPatternIndex = copiedBars[pasteBar % copiedBars.length] >>> 0;
                    const reusedIndex = String(copiedPatternIndex);
                    if (copiedPatternIndex == 0)
                        continue;
                    if (reusablePatterns[reusedIndex] != undefined) {
                        group.append(new ChangePatternNumbers(this._doc, reusablePatterns[reusedIndex], bar, channelIndex, 1, 1));
                        continue;
                    }
                    const patternCopy = patternCopies[String(copiedPatternIndex)];
                    const instrumentsCopy = this._parseCopiedInstrumentArray(patternCopy, channelIndex);
                    const existingPattern = this._doc.song.channels[channelIndex].patterns[copiedPatternIndex - 1];
                    if (existingPattern != undefined &&
                        copiedPartDuration == Config.partsPerBeat * this._doc.song.beatsPerBar &&
                        comparePatternNotes(patternCopy["notes"], existingPattern.notes) &&
                        patternsContainSameInstruments(instrumentsCopy, existingPattern.instruments)) {
                        group.append(new ChangePatternNumbers(this._doc, copiedPatternIndex, bar, channelIndex, 1, 1));
                    }
                    else {
                        if (existingPattern != undefined && this._patternIndexIsUnused(channelIndex, copiedPatternIndex)) {
                            group.append(new ChangePatternNumbers(this._doc, copiedPatternIndex, bar, channelIndex, 1, 1));
                        }
                        else {
                            group.append(new ChangeEnsurePatternExists(this._doc, channelIndex, bar));
                        }
                        const pattern = this._doc.song.getPattern(channelIndex, bar);
                        if (pattern == null)
                            throw new Error();
                        group.append(new ChangePaste(this._doc, pattern, patternCopy["notes"], this.patternSelectionActive ? this.patternSelectionStart : 0, this.patternSelectionActive ? this.patternSelectionEnd : Config.partsPerBeat * this._doc.song.beatsPerBar, copiedPartDuration));
                        group.append(new ChangeSetPatternInstruments(this._doc, channelIndex, instrumentsCopy, pattern));
                    }
                    reusablePatterns[reusedIndex] = this._doc.song.channels[channelIndex].bars[bar];
                }
            }
        }
        this._doc.record(group);
    }
    erasePatternInBar(group, channelIndex, bar) {
        const removedPattern = this._doc.song.channels[channelIndex].bars[bar];
        if (removedPattern != 0) {
            group.append(new ChangePatternNumbers(this._doc, 0, bar, channelIndex, 1, 1));
            if (this._patternIndexIsUnused(channelIndex, removedPattern)) {
                this._doc.song.channels[channelIndex].patterns[removedPattern - 1].notes.length = 0;
            }
        }
    }
    pasteNumbers() {
        const selectionCopy = JSON.parse(String(window.localStorage.getItem("selectionCopy")));
        if (selectionCopy == null)
            return;
        const channelCopies = selectionCopy["channels"] || [];
        const group = new ChangeGroup();
        const fillSelection = this.boxSelectionActive;
        const pasteHeight = fillSelection ? this.boxSelectionHeight : Math.min(channelCopies.length, this._doc.song.getChannelCount() - this.boxSelectionChannel);
        for (let pasteChannel = 0; pasteChannel < pasteHeight; pasteChannel++) {
            const channelCopy = channelCopies[pasteChannel % channelCopies.length];
            const channelIndex = this.boxSelectionChannel + pasteChannel;
            const copiedBars = channelCopy["bars"] || [];
            if (copiedBars.length == 0)
                continue;
            const pasteWidth = fillSelection ? this.boxSelectionWidth : Math.min(copiedBars.length, this._doc.song.barCount - this.boxSelectionBar);
            for (let pasteBar = 0; pasteBar < pasteWidth; pasteBar++) {
                const copiedPatternIndex = copiedBars[pasteBar % copiedBars.length] >>> 0;
                const bar = this.boxSelectionBar + pasteBar;
                if (copiedPatternIndex > this._doc.song.patternsPerChannel) {
                    group.append(new ChangePatternsPerChannel(this._doc, copiedPatternIndex));
                }
                group.append(new ChangePatternNumbers(this._doc, copiedPatternIndex, bar, channelIndex, 1, 1));
            }
        }
        this._doc.record(group);
    }
    selectAll() {
        new ChangePatternSelection(this._doc, 0, 0);
        if (this.boxSelectionBar == 0 &&
            this.boxSelectionChannel == 0 &&
            this.boxSelectionWidth == this._doc.song.barCount &&
            this.boxSelectionHeight == this._doc.song.getChannelCount()) {
            this.setTrackSelection(this._doc.bar, this._doc.bar, this._doc.channel, this._doc.channel);
        }
        else {
            this.setTrackSelection(0, this._doc.song.barCount - 1, 0, this._doc.song.getChannelCount() - 1);
        }
        this.selectionUpdated();
    }
    selectChannel() {
        new ChangePatternSelection(this._doc, 0, 0);
        if (this.boxSelectionBar == 0 && this.boxSelectionWidth == this._doc.song.barCount) {
            this.setTrackSelection(this._doc.bar, this._doc.bar, this.boxSelectionY0, this.boxSelectionY1);
        }
        else {
            this.setTrackSelection(0, this._doc.song.barCount - 1, this.boxSelectionY0, this.boxSelectionY1);
        }
        this.selectionUpdated();
    }
    duplicatePatterns() {
        this._doc.record(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, this.boxSelectionWidth, this.boxSelectionChannel, this.boxSelectionHeight));
    }
    muteChannels(allChannels) {
        if (allChannels) {
            let anyMuted = false;
            for (let channelIndex = 0; channelIndex < this._doc.song.channels.length; channelIndex++) {
                if (this._doc.song.channels[channelIndex].muted) {
                    anyMuted = true;
                    break;
                }
            }
            for (let channelIndex = 0; channelIndex < this._doc.song.channels.length; channelIndex++) {
                this._doc.song.channels[channelIndex].muted = !anyMuted;
            }
        }
        else {
            let anyUnmuted = false;
            for (const channelIndex of this._eachSelectedChannel()) {
                if (!this._doc.song.channels[channelIndex].muted) {
                    anyUnmuted = true;
                    break;
                }
            }
            for (const channelIndex of this._eachSelectedChannel()) {
                this._doc.song.channels[channelIndex].muted = anyUnmuted;
            }
        }
        this._doc.notifier.changed();
    }
    soloChannels(invert) {
        let alreadySoloed = true;
        if (this.boxSelectionChannel >= this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount) {
            const currentChannel = this._doc.song.channels[this.boxSelectionChannel];
            const bar = currentChannel.bars[this._doc.bar] - 1;
            const modInstrument = (bar >= 0) ? currentChannel.instruments[currentChannel.patterns[bar].instruments[0]] : currentChannel.instruments[this._doc.viewedInstrument[this.boxSelectionChannel]];
            const soloPattern = [];
            let matchesSoloPattern = !invert;
            for (let channelIndex = 0; channelIndex < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; channelIndex++) {
                soloPattern[channelIndex] = false;
                for (let mod = 0; mod < Config.modCount; mod++) {
                    if (modInstrument.modChannels[mod] == channelIndex) {
                        soloPattern[channelIndex] = true;
                    }
                }
            }
            for (let channelIndex = 0; channelIndex < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; channelIndex++) {
                if (this._doc.song.channels[channelIndex].muted == soloPattern[channelIndex]) {
                    matchesSoloPattern = invert;
                    break;
                }
            }
            for (let channelIndex = 0; channelIndex < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; channelIndex++) {
                if (matchesSoloPattern) {
                    this._doc.song.channels[channelIndex].muted = false;
                }
                else {
                    this._doc.song.channels[channelIndex].muted = !soloPattern[channelIndex];
                }
            }
        }
        else {
            for (let channelIndex = 0; channelIndex < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; channelIndex++) {
                const shouldBeMuted = (channelIndex < this.boxSelectionChannel || channelIndex >= this.boxSelectionChannel + this.boxSelectionHeight) ? !invert : invert;
                if (this._doc.song.channels[channelIndex].muted != shouldBeMuted) {
                    alreadySoloed = false;
                    break;
                }
            }
            if (alreadySoloed) {
                for (let channelIndex = 0; channelIndex < this._doc.song.channels.length; channelIndex++) {
                    this._doc.song.channels[channelIndex].muted = false;
                }
            }
            else {
                for (let channelIndex = 0; channelIndex < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; channelIndex++) {
                    this._doc.song.channels[channelIndex].muted = (channelIndex < this.boxSelectionChannel || channelIndex >= this.boxSelectionChannel + this.boxSelectionHeight) ? !invert : invert;
                }
            }
        }
        this._doc.notifier.changed();
    }
    forceRhythm() {
        const group = new ChangeGroup();
        if (this.boxSelectionActive) {
            group.append(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, this.boxSelectionWidth, this.boxSelectionChannel, this.boxSelectionHeight));
        }
        for (const channelIndex of this._eachSelectedChannel()) {
            for (const pattern of this._eachSelectedPattern(channelIndex)) {
                group.append(new ChangePatternRhythm(this._doc, pattern));
            }
        }
        this._doc.record(group);
    }
    forceScale() {
        const group = new ChangeGroup();
        if (this.boxSelectionActive) {
            group.append(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, this.boxSelectionWidth, this.boxSelectionChannel, this.boxSelectionHeight));
        }
        const scaleFlags = [true, false, false, false, false, false, false, false, false, false, false, false];
        for (const channelIndex of this._eachSelectedChannel()) {
            if (this._doc.song.getChannelIsNoise(channelIndex) || this._doc.song.getChannelIsMod(channelIndex))
                continue;
            for (const pattern of this._eachSelectedPattern(channelIndex)) {
                unionOfUsedNotes(pattern, scaleFlags);
            }
        }
        const scaleMap = generateScaleMap(scaleFlags, this._doc.song.scale);
        for (const channelIndex of this._eachSelectedChannel()) {
            if (this._doc.song.getChannelIsNoise(channelIndex) || this._doc.song.getChannelIsMod(channelIndex))
                continue;
            for (const pattern of this._eachSelectedPattern(channelIndex)) {
                group.append(new ChangePatternScale(this._doc, pattern, scaleMap));
            }
        }
        this._doc.record(group);
    }
    setTrackSelection(newX0, newX1, newY0, newY1) {
        const canReplaceLastChange = true;
        this._changeTrack = new ChangeGroup();
        this._changeTrack.append(new ChangeTrackSelection(this._doc, newX0, newX1, newY0, newY1));
        this._doc.record(this._changeTrack, canReplaceLastChange);
    }
    transpose(upward, octave) {
        const canReplaceLastChange = this._doc.lastChangeWas(this._changeTranspose);
        this._changeTranspose = new ChangeGroup();
        if (this.boxSelectionActive) {
            this._changeTranspose.append(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, this.boxSelectionWidth, this.boxSelectionChannel, this.boxSelectionHeight));
        }
        for (const channelIndex of this._eachSelectedChannel()) {
            if (channelIndex >= this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount)
                continue;
            for (const pattern of this._eachSelectedPattern(channelIndex)) {
                this._changeTranspose.append(new ChangeTranspose(this._doc, channelIndex, pattern, upward, this._doc.prefs.notesOutsideScale, octave));
            }
        }
        this._doc.record(this._changeTranspose, canReplaceLastChange);
    }
    swapChannels(offset) {
        const possibleSectionBoundaries = [
            this._doc.song.pitchChannelCount,
            this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount,
            this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount + this._doc.song.modChannelCount,
            this._doc.song.getChannelCount(),
        ];
        let channelSectionMin = 0;
        let channelSectionMax = 0;
        for (const nextBoundary of possibleSectionBoundaries) {
            if ((this.boxSelectionChannel < nextBoundary && offset < 0) || (this.boxSelectionChannel + this.boxSelectionHeight <= nextBoundary)) {
                channelSectionMax = nextBoundary - 1;
                break;
            }
            channelSectionMin = nextBoundary;
        }
        const newSelectionMin = Math.max(this.boxSelectionChannel, channelSectionMin);
        const newSelectionMax = Math.min(this.boxSelectionChannel + this.boxSelectionHeight - 1, channelSectionMax);
        offset = Math.max(offset, channelSectionMin - newSelectionMin);
        offset = Math.min(offset, channelSectionMax - newSelectionMax);
        if (offset != 0) {
            const canReplaceLastChange = this._doc.lastChangeWas(this._changeReorder);
            this._changeReorder = new ChangeGroup();
            this.boxSelectionY0 = newSelectionMin + offset;
            this.boxSelectionY1 = newSelectionMax + offset;
            this._changeReorder.append(new ChangeChannelOrder(this._doc, newSelectionMin, newSelectionMax, offset));
            this._changeReorder.append(new ChangeChannelBar(this._doc, Math.max(this.boxSelectionY0, Math.min(this.boxSelectionY1, this._doc.channel + offset)), this._doc.bar));
            this.selectionUpdated();
            this._doc.record(this._changeReorder, canReplaceLastChange);
        }
    }
    selectInstrument(instrument) {
        if (this._doc.viewedInstrument[this._doc.channel] == instrument) {
            if (this._doc.song.layeredInstruments && this._doc.song.patternInstruments && this._doc.channel < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount) {
                const canReplaceLastChange = this._doc.lastChangeWas(this._changeInstrument);
                this._changeInstrument = new ChangeGroup();
                const instruments = this._doc.recentPatternInstruments[this._doc.channel];
                this._doc.notifier.changed();
                if (instruments.indexOf(instrument) == -1) {
                    instruments.push(instrument);
                    const maxLayers = this._doc.song.getMaxInstrumentsPerPattern(this._doc.channel);
                    if (instruments.length > maxLayers) {
                        instruments.splice(0, instruments.length - maxLayers);
                    }
                }
                else {
                    instruments.splice(instruments.indexOf(instrument), 1);
                    if (instruments.length == 0)
                        instruments[0] = 0;
                }
                if (this.boxSelectionActive) {
                    this._changeInstrument.append(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, this.boxSelectionWidth, this.boxSelectionChannel, this.boxSelectionHeight));
                }
                for (const channelIndex of this._eachSelectedChannel()) {
                    for (const pattern of this._eachSelectedPattern(channelIndex)) {
                        this._changeInstrument.append(new ChangeSetPatternInstruments(this._doc, channelIndex, instruments, pattern));
                    }
                }
                if (!this._changeInstrument.isNoop())
                    this._doc.record(this._changeInstrument, canReplaceLastChange);
            }
        }
        else {
            const canReplaceLastChange = this._doc.lastChangeWas(this._changeInstrument);
            this._changeInstrument = new ChangeGroup();
            this._changeInstrument.append(new ChangeViewInstrument(this._doc, instrument));
            if (!(this._doc.song.layeredInstruments && this._doc.channel < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount) && this._doc.song.patternInstruments) {
                if (this.boxSelectionActive) {
                    this._changeInstrument.append(new ChangeDuplicateSelectedReusedPatterns(this._doc, this.boxSelectionBar, this.boxSelectionWidth, this.boxSelectionChannel, this.boxSelectionHeight));
                }
                const instruments = [instrument];
                for (const channelIndex of this._eachSelectedChannel()) {
                    for (const pattern of this._eachSelectedPattern(channelIndex)) {
                        this._changeInstrument.append(new ChangeSetPatternInstruments(this._doc, channelIndex, instruments, pattern));
                    }
                }
                this._doc.record(this._changeInstrument, canReplaceLastChange);
            }
            else if (!this._doc.hasRedoHistory()) {
                this._doc.record(this._changeInstrument, canReplaceLastChange);
            }
        }
    }
    resetBoxSelection() {
        this.boxSelectionX0 = this.boxSelectionX1 = this._doc.bar;
        this.boxSelectionY0 = this.boxSelectionY1 = this._doc.channel;
    }
}
//# sourceMappingURL=Selection.js.map