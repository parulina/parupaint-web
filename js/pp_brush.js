"use strict";

function ParupaintBrush(n, c, s){

    // building the brush thing, then make canvas drawable
    // then sync that to server
    this.x = 0;
    this.y = 0;
    this.size = s;
    this.name = n;
    this.color = "#00000000";
    if(typeof c == "string") {
        this.color = c;
    }

};
