"use strict";

// Brush glass
// Keeps a record of brushes and handy functions for them
function ParupaintBrushglass() {
    this.current = 0;
    this.brushes = [
        new ParupaintBrush("brush", "#000000ff", 2),
        new ParupaintBrush("eraser", "#00000000", 16)
    ];

    this.UpdateCursor = function(cursor) {
        if(cursor) {
            cursor.Size(this.Size());
            cursor.Color(this.Color());
            cursor.cursor.toggleClass("eraser", (this.current === 1));
        }
    }

    this.UpdateLocal = function(main) {

        this.UpdateCursor(main.Cursor());
        main.ui.UpdateBrushinfo(this.Brush());

        var hsl = new ParupaintColor(this.Color()).ToHsl();
        main.color.Hsl(hsl.h, hsl.s, hsl.l, hsl.a);

        ParupaintStorage.SetStorageKey({
            'default_brush': this.brushes
        });
    }

    // Functions to reflect the important brush variables
    // do not store X,Y or whatever.


    // set/get the brush id.
    this.Brush = function(b) {
        if(b != null) {
            this.current = b;
            return this;
        }
        return this.brushes[this.current];
    }
    this.OppositeBrush = function() {
        return(this.current == 0 ? 1 : 0)
    }
    this.Name = function() {
        return this.brushes[this.current].name;
    }
    this.Size = function(size, cursor) {
        if(typeof size == "undefined") return this.Brush().size;

        this.brushes[this.current].size = size;
        if(cursor) cursor.Size(size);

        return this;
    }
    this.Color = function(color, cursor) {
        if(typeof color == "undefined") return this.Brush().color;

        this.brushes[this.current].color = color;
        if(cursor) cursor.Color(color);

        return this;
    }

    return this;
}


