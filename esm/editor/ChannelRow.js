import { ColorConfig } from "./ColorConfig";
import { HTML } from "imperative-html/dist/esm/elements-strict";
export class Box {
    constructor(channel, color) {
        this._text = document.createTextNode("");
        this._label = HTML.div({ class: "channelBoxLabel" }, this._text);
        this.container = HTML.div({ class: "channelBox", style: `margin: 1px; height: ${ChannelRow.patternHeight - 2}px;` }, this._label);
        this._renderedIndex = -1;
        this._renderedLabelColor = "?";
        this._renderedBackgroundColor = "?";
        this.container.style.background = ColorConfig.uiWidgetBackground;
        this._label.style.color = color;
    }
    setWidth(width) {
        this.container.style.width = (width - 2) + "px";
    }
    setHeight(height) {
        this.container.style.height = (height - 2) + "px";
    }
    setIndex(index, selected, dim, color, isNoise, isMod) {
        if (this._renderedIndex != index) {
            if (index >= 100) {
                this._label.setAttribute("font-size", "16");
                this._label.style.setProperty("transform", "translate(0px, -1.5px)");
            }
            else {
                this._label.setAttribute("font-size", "20");
                this._label.style.setProperty("transform", "translate(0px, 0px)");
            }
            this._renderedIndex = index;
            this._text.data = String(index);
        }
        let useColor = selected ? ColorConfig.c_invertedText : color;
        if (this._renderedLabelColor != useColor) {
            this._label.style.color = useColor;
            this._renderedLabelColor = useColor;
        }
        if (!selected) {
            if (isNoise)
                color = dim ? ColorConfig.c_trackEditorBgNoiseDim : ColorConfig.c_trackEditorBgNoise;
            else if (isMod)
                color = dim ? ColorConfig.c_trackEditorBgModDim : ColorConfig.c_trackEditorBgMod;
            else
                color = dim ? ColorConfig.c_trackEditorBgPitchDim : ColorConfig.c_trackEditorBgPitch;
        }
        color = selected ? color : (index == 0) ? "none" : color;
        if (this._renderedBackgroundColor != color) {
            this.container.style.background = color;
            this._renderedBackgroundColor = color;
        }
    }
}
export class ChannelRow {
    constructor(_doc, index) {
        this._doc = _doc;
        this.index = index;
        this._renderedBarWidth = -1;
        this._renderedBarHeight = -1;
        this._boxes = [];
        this.container = HTML.div({ class: "channelRow" });
    }
    render() {
        ChannelRow.patternHeight = this._doc.getChannelHeight();
        const barWidth = this._doc.getBarWidth();
        if (this._boxes.length != this._doc.song.barCount) {
            for (let x = this._boxes.length; x < this._doc.song.barCount; x++) {
                const box = new Box(this.index, ColorConfig.getChannelColor(this._doc.song, this.index).secondaryChannel);
                box.setWidth(barWidth);
                this.container.appendChild(box.container);
                this._boxes[x] = box;
            }
            for (let x = this._doc.song.barCount; x < this._boxes.length; x++) {
                this.container.removeChild(this._boxes[x].container);
            }
            this._boxes.length = this._doc.song.barCount;
        }
        if (this._renderedBarWidth != barWidth) {
            this._renderedBarWidth = barWidth;
            for (let x = 0; x < this._boxes.length; x++) {
                this._boxes[x].setWidth(barWidth);
            }
        }
        if (this._renderedBarHeight != ChannelRow.patternHeight) {
            this._renderedBarHeight = ChannelRow.patternHeight;
            for (let x = 0; x < this._boxes.length; x++) {
                this._boxes[x].setHeight(ChannelRow.patternHeight);
            }
        }
        for (let i = 0; i < this._boxes.length; i++) {
            const pattern = this._doc.song.getPattern(this.index, i);
            const selected = (i == this._doc.bar && this.index == this._doc.channel);
            const dim = (pattern == null || pattern.notes.length == 0);
            const box = this._boxes[i];
            if (i < this._doc.song.barCount) {
                const colors = ColorConfig.getChannelColor(this._doc.song, this.index);
                box.setIndex(this._doc.song.channels[this.index].bars[i], selected, dim, dim && !selected ? colors.secondaryChannel : colors.primaryChannel, this.index >= this._doc.song.pitchChannelCount && this.index < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount, this.index >= this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount);
                box.container.style.visibility = "visible";
            }
            else {
                box.container.style.visibility = "hidden";
            }
            if (i == this._doc.synth.loopBarStart) {
                box.container.style.setProperty("border-left", `1px dashed ${ColorConfig.uiWidgetFocus}`);
            }
            else {
                box.container.style.setProperty("border-left", "none");
            }
            if (i == this._doc.synth.loopBarEnd) {
                box.container.style.setProperty("border-right", `1px dashed ${ColorConfig.uiWidgetFocus}`);
            }
            else {
                box.container.style.setProperty("border-right", "none");
            }
        }
    }
}
ChannelRow.patternHeight = 28;
//# sourceMappingURL=ChannelRow.js.map