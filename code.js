// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
let LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-=][;/.,";
let coordMap = JSON.parse(`{"0":{"x":724,"y":77},"1":{"x":95,"y":77},"2":{"x":164,"y":77},"3":{"x":234,"y":77},"4":{"x":304,"y":77},"5":{"x":375,"y":77},"6":{"x":444,"y":77},"7":{"x":514,"y":77},"8":{"x":584,"y":77},"9":{"x":654,"y":77},"A":{"x":127,"y":211},"B":{"x":460,"y":279},"C":{"x":319,"y":279},"D":{"x":285,"y":211},"E":{"x":267,"y":143},"F":{"x":357,"y":211},"G":{"x":425,"y":211},"H":{"x":495,"y":211},"I":{"x":621,"y":143},"J":{"x":567,"y":211},"K":{"x":634,"y":211},"L":{"x":705,"y":211},"M":{"x":597,"y":279},"N":{"x":530,"y":279},"O":{"x":686,"y":143},"P":{"x":757,"y":143},"Q":{"x":127,"y":143},"R":{"x":337,"y":143},"S":{"x":215,"y":211},"T":{"x":407,"y":143},"U":{"x":546,"y":143},"V":{"x":390,"y":279},"W":{"x":194,"y":143},"X":{"x":250,"y":279},"Y":{"x":477,"y":143},"Z":{"x":180,"y":279},"-":{"x":795,"y":77},"=":{"x":863,"y":77},"]":{"x":901,"y":143},"[":{"x":831,"y":143},";":{"x":779,"y":214},"/":{"x":814,"y":282},".":{"x":745,"y":282},",":{"x":674,"y":282}}`);
// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
    width: 300,
    height: 300,
});
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
let currentFrame, frameNum, keyboardFrame, smallestX, smallestY, previousFrame;
frameNum = 1;
let vectData = null;
let vectNode = null;
figma.loadFontAsync({ family: "Roboto", style: "Regular" }).then(() => {
    if (figma.currentPage.findOne(n => n.name === "Keyboard" && n.type === "FRAME") == null) {
        keyboardFrame = figma.createFrame();
        keyboardFrame.name = "Keyboard";
        keyboardFrame.resize(1002, 374);
        keyboardFrame.x = 0;
        keyboardFrame.y = 0;
        for (let i = 0; i < LETTERS.length; i++) {
            const letter = LETTERS[i];
            const coord = coordMap[letter];
            const textNode = figma.createText();
            textNode.characters = letter;
            textNode.x = coord.x;
            textNode.y = coord.y;
            textNode.fontName = { family: 'Roboto', style: 'Regular' };
            textNode.fontSize = 22;
            keyboardFrame.appendChild(textNode);
        }
    }
    currentFrame = figma.createFrame();
    frameNum = 1;
    currentFrame.name = "Canvas " + frameNum;
    keyboardFrame = figma.currentPage.findOne(n => n.name === "Keyboard" && n.type === "FRAME");
    currentFrame.x = keyboardFrame.x + keyboardFrame.width + 100;
    currentFrame.y = keyboardFrame.y;
    currentFrame.resize(keyboardFrame.width, keyboardFrame.height);
    smallestX = keyboardFrame.width;
    smallestY = keyboardFrame.height;
});
figma.ui.onmessage = msg => {
    for (let i = 0; i < LETTERS.length; i++) {
        for (let node of figma.currentPage.findAll((n) => n.name == LETTERS[i])) {
            console.log(node.x);
            coordMap[LETTERS[i]] = { x: node.x, y: node.y };
        }
    }
    //make a new canvas
    if (msg.type === 'new-canvas') {
        if (figma.currentPage.findOne(n => n.name === "Canvas " + frameNum && n.type === "FRAME") != null) {
            previousFrame = figma.currentPage.findOne(n => n.name === "Canvas " + frameNum && n.type === "FRAME");
        }
        else {
            previousFrame = figma.currentPage.findOne(n => n.name === "Keyboard" && n.type === "FRAME");
        }
        keyboardFrame = figma.currentPage.findOne(n => n.name === "Keyboard" && n.type === "FRAME");
        currentFrame = figma.createFrame();
        frameNum++;
        currentFrame.name = "Canvas " + frameNum;
        currentFrame.resize(keyboardFrame.width, keyboardFrame.height);
        currentFrame.x = previousFrame.x + previousFrame.width + 100;
        currentFrame.y = previousFrame.y;
        resetVector();
    }
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'handle-key') {
        if (figma.currentPage.findOne(n => n.name === "Canvas " + frameNum && n.type === "FRAME") == null) {
        }
        else {
            if (msg.keyCode == 13) {
                resetVector();
            }
            let pressedLetter = String.fromCharCode(msg.keyCode).toUpperCase();
            if (LETTERS.includes(pressedLetter)) {
                const nodes = [];
                let pressedCoord = coordMap[pressedLetter];
                //set x and y of vector to smallest x and y coordinates of nodes
                if (pressedCoord.x < smallestX) {
                    smallestX = pressedCoord.x;
                }
                if (pressedCoord.y < smallestY) {
                    smallestY = pressedCoord.y;
                }
                //reset vector node is current one is deleted
                //initiate vector
                if (vectData == null) {
                    // vectNode is null, so this is our first keypress
                    vectNode = figma.createVector();
                    vectNode.name = "keyboard";
                    vectNode.x = smallestX;
                    vectNode.y = smallestY;
                    vectData = `M ${pressedCoord.x} ${pressedCoord.y} Z`;
                    vectNode.vectorPaths = [{
                            windingRule: 'EVENODD',
                            data: vectData,
                        }];
                    currentFrame.appendChild(vectNode);
                }
                else {
                    let vectorPathsData = vectData;
                    // Remove the Z from the end of the paths data
                    vectorPathsData = vectorPathsData.slice(0, vectorPathsData.length - 1);
                    // Add a line to the new coordinate
                    vectorPathsData = vectorPathsData + `L ${pressedCoord.x} ${pressedCoord.y} Z`;
                    if (vectNode == null) {
                        vectNode = figma.createVector();
                    }
                    vectNode.vectorPaths = [{
                            windingRule: 'EVENODD',
                            data: vectorPathsData,
                        }];
                    vectNode.x = smallestX;
                    vectNode.y = smallestY;
                    vectData = vectorPathsData;
                }
                figma.currentPage.selection = nodes;
                figma.viewport.scrollAndZoomIntoView(nodes);
                if (figma.currentPage.findOne(n => n.type === "VECTOR" && n.name == "keyboard") == null) {
                    resetVector();
                }
            }
        }
    }
    function resetVector() {
        vectData = null;
        vectNode = null;
        smallestX = keyboardFrame.width;
        smallestY = keyboardFrame.height;
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    // figma.closePlugin();
};
