/* global tiled */

// Tiled Extension: Map Movement in World
// Adds actions to move the selected map by major grid increments within a World

// Configure these to match your Major Grid preferences (Interface tab)
var MAJOR_GRID_WIDTH = 40;  // tiles
var MAJOR_GRID_HEIGHT = 30; // tiles
var TILE_SIZE = 8;

function findMapInWorld(map) {
    
    // Search through all loaded worlds for this map
    for (var i = 0; i < tiled.worlds.length; i++) {
        var world = tiled.worlds[i];
        var maps = world.maps;
        
        for (var j = 0; j < maps.length; j++) {
            if (maps[j].fileName === map.fileName) {
                return { world: world, mapEntry: maps[j] };
            } 
        }
    }
    
    return null;
}

function moveMap(direction) {

    var map = tiled.activeAsset;
    var result = findMapInWorld(map);
    var world = result.world;
    var mapEntry = result.mapEntry;
    var gridWidth = TILE_SIZE * MAJOR_GRID_WIDTH;
    var gridHeight = TILE_SIZE * MAJOR_GRID_HEIGHT;

    // Calculate new position based on direction
    switch(direction) {
        case 'up':
            mapEntry.rect.y -= gridHeight;
            break;
        case 'down':
            mapEntry.rect.y += gridHeight;
            break;
        case 'left':
            mapEntry.rect.x -= gridWidth;
            break;
        case 'right':
            mapEntry.rect.x += gridWidth;
            break;
    }

    world.setMapPos( map, mapEntry.rect.x, mapEntry.rect.y );
}

var mapMoverUp = tiled.registerAction("MoveMapUp", function(action) {
    moveMap('up');
});

mapMoverUp.text = "Move Map Up";
mapMoverUp.iconVisibleInMenu = false;

var mapMoverDown = tiled.registerAction("MoveMapDown", function(action) {
    moveMap('down');
});

mapMoverDown.text = "Move Map Down";
mapMoverDown.iconVisibleInMenu = false;

var mapMoverLeft = tiled.registerAction("MoveMapLeft", function(action) {
    moveMap('left');
});

mapMoverLeft.text = "Move Map Left";
mapMoverLeft.iconVisibleInMenu = false;

var mapMoverRight = tiled.registerAction("MoveMapRight", function(action) {
    moveMap('right');
});

mapMoverRight.text = "Move Map Right";
mapMoverRight.iconVisibleInMenu = false;

// Add actions to a custom menu
tiled.extendMenu("Map", [
    { action: "MoveMapUp", before: "MapProperties" },
    { action: "MoveMapDown" },
    { action: "MoveMapLeft" },
    { action: "MoveMapRight" },
    { separator: true }
]);