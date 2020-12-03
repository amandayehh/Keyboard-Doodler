// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (see documentation).
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
if (figma.currentPage.findOne(n => n.name === "Keyboard" && n.type === "FRAME") == null) {
    figma.ui.postMessage("no keyboard");
}
else {
    currentFrame = figma.createFrame();
    frameNum = 1;
    currentFrame.name = "Canvas " + frameNum;
    keyboardFrame = figma.currentPage.findOne(n => n.name === "Keyboard" && n.type === "FRAME");
    currentFrame.x = keyboardFrame.x + keyboardFrame.width + 100;
    currentFrame.y = keyboardFrame.y;
    currentFrame.resize(keyboardFrame.width, keyboardFrame.height);
    smallestX = keyboardFrame.width;
    smallestY = keyboardFrame.height;
}
figma.ui.onmessage = msg => {
    let LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-=][;/.,";
    let coordMap = {};
    for (let i = 0; i < LETTERS.length; i++) {
        for (let node of figma.currentPage.findAll((n) => n.name == LETTERS[i])) {
            coordMap[LETTERS[i]] = { x: node.x, y: node.y };
        }
    }
    if (msg.type === 'new-canvas') {
        currentFrame = figma.createFrame();
        keyboardFrame = figma.currentPage.findOne(n => n.name === "Keyboard" && n.type === "FRAME");
        frameNum++;

        if(figma.currentPage.findOne(n => n.name === "Canvas " + frameNum && n.type === "FRAME") != null){
            previousFrame = figma.currentPage.findOne(n => n.name === "Canvas " + frameNum && n.type === "FRAME");
            currentFrame.x = previousFrame.x + previousFrame.width + 100;
            currentFrame.y = previousFrame.y;
        }else{
            currentFrame.x = keyboardFrame.x + keyboardFrame.width + 100;
            currentFrame.y = keyboardFrame.y;
        }
        currentFrame.name = "Canvas " + frameNum;
        currentFrame.resize(keyboardFrame.width, keyboardFrame.height);
 
        resetVector();
    }
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'handle-key') {
        if (msg.keyCode == 13) {
            resetVector();
        }
        let pressedLetter = String.fromCharCode(msg.keyCode).toUpperCase();
        if (LETTERS.includes(pressedLetter) && figma.currentPage.findOne(n => n.name === "Canvas " + frameNum && n.type === "FRAME")!=null ) {
            const nodes = [];
            let pressedCoord = coordMap[pressedLetter];
            //set x and y of vector to smallest x and y coordinates of nodes
            if (pressedCoord.x < smallestX) {
                console.log("inside");
                console.log("pressed coord x: " + pressedCoord.x);
                console.log("smallest x: " + smallestX);
                smallestX = pressedCoord.x;
            }
            if (pressedCoord.y < smallestY) {
                smallestY = pressedCoord.y;
            }
            console.log("outside");
            console.log("pressed coord x: " + pressedCoord.x);
            console.log("smallest x: " + smallestX);
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
                console.log(currentFrame.name);
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
                console.log("rest");
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
