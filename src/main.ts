// Copyright (c) 2020-2021 eContriver LLC

// import Alea from 'alea';
// import { seedrandom } from 'seedrandom';
import { AssetMgr } from './AssetMgr';

var visibleCanvas = null;
var context = null;

const ScriptAssets = Object.freeze({
    // 'seedrandom': 'seedrandom.js',
});
const ImageAssets = Object.freeze({
    'dot': '../resources/dot.png',
});

// TODO: Switch to TypeScript so we can use types and have interfaces
// TODO: Add tests
// TODO: Add Multi-layer support and separate draw from move logic
// TODO: Add a GraphicalUserInterface which draws on a layer and accepts inputs
// TODO: Add Box2D integration for physics
// TODO: Add Server / Client setup
// TODO: Create Asset class the uses Promise - https://web.dev/promises/
class EntityMgr {
    entities: any[];
    constructor() {
        this.entities = [];
    }
    create(type: any) {
        let entity = new (type)();
        this.entities.push(entity);
        return entity;
    }
}

function sleep(durationMs: number){
    var now = new Date().getTime();
    while(new Date().getTime() < now + durationMs){ /* noop */ } 
}

class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    midPoint(b: { x: number; y: number; }) {
        return new Point((b.x - this.x) / 2, (b.y - this.y) / 2);
    }
}

// TODO: This is to become an interface and something like Character will implement it
class Entity {
    location: Point;
    image: any;
    constructor() {
        this.location = new Point(0, 0);
        this.image = null;
    }
}

class World {
    max: Point;
    min: Point;
    constructor(max: Point) {
        this.max = max;
        this.min = new Point(0, 0);
    }

    center() {
        return this.min.midPoint(this.max);
    }
}

class Game {
    entityMgr: EntityMgr;
    constructor() {
        // only add member variables if the game owns the object
        this.entityMgr = new EntityMgr();
    }
    run(assetMgr: AssetMgr) {
        let world = new World(new Point(640 * 80, 1040 * 80));
        visibleCanvas = document.getElementById('game');
        visibleCanvas.style.backgroundColor = "lightgray";
        // set character starting location 
        let player = this.entityMgr.create(Entity);
        player.location = world.center(); // middle
        // do we bind and add move to Char or how to add key bindign, that moves char, from hi level
        context = visibleCanvas.getContext('2d');
        assetMgr.onImageLoad(ImageAssets.dot, function(image: any) {
            player.image = image;
            context.drawImage(player.image, player.location.x, player.location.y);
            // must register after the image has been added (or add null check)
            let keyHandler = function(event: any) {
                move(event, world, player);
            };
            document.addEventListener("keydown", keyHandler); // TODO: move needs to get dot, 
        });
    }
}


function move(event: { key: any; }, world: World, player: { location: { y: number; x: number; }; image: { height: number; width: number; }; }) {
    context.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
    var movementAmount = 10;
    switch (event.key) {
        case "w":
            player.location.y -= movementAmount;
            break;
        case "s":
            player.location.y += movementAmount;
            break;
        case "a":
            player.location.x -= movementAmount;
            break;
        case "d":
            player.location.x += movementAmount;
            break;
    }
    player.location.y = (player.location.y + player.image.height > world.max.y) ? world.max.y - player.image.height : player.location.y;
    player.location.y = (player.location.y < world.min.y) ? world.min.y : player.location.y;
    player.location.x = (player.location.x + player.image.width > world.max.x) ? world.max.x - player.image.width : player.location.x;
    player.location.x = (player.location.x < world.min.x) ? world.min.x : player.location.x;
    var canvasYWorld = player.location.y - (visibleCanvas.height / 2);
    var canvasXWorld = player.location.x - (visibleCanvas.width / 2);
    var dotXCanvas = visibleCanvas.width / 2;
    var dotYCanvas = visibleCanvas.height / 2;
    if (canvasYWorld < world.min.y) {
        dotYCanvas += (canvasYWorld - world.min.y);
        canvasYWorld = world.min.y;
    }
    if ((canvasYWorld + visibleCanvas.height) > world.max.y) {
        dotYCanvas += visibleCanvas.height - (world.max.y - canvasYWorld);
        canvasYWorld = world.max.y - visibleCanvas.height;
    }
    if (canvasXWorld < world.min.x) {
        dotXCanvas += (canvasXWorld - world.min.x);
        canvasXWorld = world.min.x;
    }
    if ((canvasXWorld + visibleCanvas.width) > world.max.x) {
        dotXCanvas += visibleCanvas.width - (world.max.x - canvasXWorld);
        canvasXWorld = world.max.x - visibleCanvas.width;
    }
    generateRandom(canvasXWorld, canvasXWorld + visibleCanvas.width, canvasYWorld, canvasYWorld + visibleCanvas.height);
    console.log("Moving to: " + player.location.x + "," + player.location.y);
    context.drawImage(player.image, dotXCanvas, dotYCanvas);
    //event.preventDefault(); // prevents (F5 and) arrows from scrolling (with wasd we don't need this now)
}

function generateRandom(xStart: number, xEnd: number, yStart: number, yEnd: number) {
    // console.time(generateRandom.name)
    for (var x = xStart; x < xEnd; x += 1) {
        for (var y = yStart; y < yEnd; y += 1) {
            var scaleFactor = 80; 
            if ((x % scaleFactor) != 0) continue;
            if ((y % scaleFactor) != 0) continue;
            // Implementation 1: using ANSI C rand (42ms for 600,000 and not very random)
            // var rand = PRNG(x << 16 + y) % 256; // we use modulo 256 because 255 would produe a 0 for 255 (i.e. 0-254), we want 0-255

            // Implementation 2: using seedrandom.js (3100ms for 600,000 and very random)
            // let rng = Math.seedrandom(x + ',' + y);
            // var rand = (Math.random() * Number.MAX_SAFE_INTEGER) >>> 0; // shift by 0 truncates decimal
            // beyond v3.+ https://www.npmjs.com/package/seedrandom#cjs--nodejs-usage
            var seedrandom = require('seedrandom');
            let rng = seedrandom(x + ',' + y);
            var rand = (rng() * Number.MAX_SAFE_INTEGER) >>> 0; // shift by 0 truncates decimal

            // Implementation 3: using alea.js (?ms for 600,000 and very random)
            // let rng = Alea(x + ',' + y);
            // let rand: number = Math.round(rng() * Number.MAX_SAFE_INTEGER);

            if ((rand % 10) > 1) continue;
            var r = ((rand >>> 0) % 2) * 255;
            var g = ((rand >>> 1) % 2) * 255;
            var b = ((rand >>> 2) % 2) * 255;
            var size = (scaleFactor * (((rand >>> 3) % 4) + 1)) / 4;
            var a = 255;
            colorPixel(x-xStart, y-yStart, size, r, g, b, a);
        }
    }
    // console.timeEnd(generateRandom.name)
}

// function PRNG(seed) { 
//     //console.log("Seed: '" + seed + "'");
//     var a = 1103515245;
//     var c = 12345;
//     var m = 2**31;
//     var random = (a * seed + c) % m;
//     // console.log("Random: '" + random + "'");
//     return random;
// }

// Took over 300 ms to generate for 1040-40 x 640-40
function colorPixel(x: number, y: number, size: number, r: string | number, g: string | number, b: string | number, a: number) {
    context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
    context.fillRect(x, y, size, size);
}

/* Took over 2 seconds to generate for 1040-40 x 640-40
function colorPixel2(x, y) {
    var id = context.createImageData(1,1);
    var d = id.data;
    d[0]   = 255; // r
    d[1]   = 0; // g
    d[2]   = 0; // b
    d[3]   = 255; // a
    context.putImageData( id, x, y );  
}//*/

function main() {
    let assetMgr = new AssetMgr();
    assetMgr.addScripts(Object.values(ScriptAssets));
    assetMgr.addImages(Object.values(ImageAssets));
    // document.addEventListener("DOMContentLoaded" - the whole document (HTML) has been loaded.
    // window.addEventListener("load" - the whole document and its resources (e.g. images, iframes, scripts) have been loaded.
    //   i.e. window.onload
    document.addEventListener("DOMContentLoaded", function(event) {
        let game = new Game();
        game.run(assetMgr);
    });
}

main();