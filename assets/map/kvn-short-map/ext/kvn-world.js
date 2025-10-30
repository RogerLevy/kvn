var kvnRoom = {
    name: "KVN Room Importer",
    extension: "dat",
    nameFilter: "Room files (*.dat)",
    fileName: "room000.dat",

    read: function(fileName) {
        // Quick validation - check if this looks like a room file
        if (!fileName.match(/room\d+\.dat$/)) {
            return null;
        }
        // Extract base name by removing the number and .dat extension
        var baseName = fileName.replace(/\d+\.dat$/, '');
        var roomFiles = [];
        var maxRow = 0;
        var maxCol = 0;
        
        // Find all room files and determine grid size
        for (var roomNumber = 0; roomNumber < 10000; roomNumber++) {
            var roomFileName = baseName + String(roomNumber).padStart(3, '0') + '.dat';
            
            try {
                var file = new BinaryFile(roomFileName, BinaryFile.ReadOnly);
                var buffer = file.readAll();
                file.close();
                
                if (buffer.byteLength > 0) {
                    roomFiles.push({
                        fileName: roomFileName,
                        number: roomNumber,
                        row: Math.floor(roomNumber / 100),
                        col: roomNumber % 100
                    });
                    
                    maxRow = Math.max(maxRow, Math.floor(roomNumber / 100));
                    maxCol = Math.max(maxCol, roomNumber % 100);
                }
            } catch (e) {
                // File doesn't exist, continue
                continue;
            }
        }
        
        if (roomFiles.length === 0) {
            tiled.error("No room files found");
            return null;
        }
        
        // Assume standard tile size and room dimensions
        var tileWidth = 8;
        var tileHeight = 8;
        var roomWidthPixels = 320;
        var roomHeightPixels = 240;
        var roomWidthTiles = roomWidthPixels / tileWidth;  
        var roomHeightTiles = roomHeightPixels / tileHeight;
        
        // Calculate map dimensions based on actual room positions
        var mapWidth = (maxCol + 1) * roomWidthTiles;
        var mapHeight = (maxRow + 1) * roomHeightTiles;
        var map = new TileMap();
        map.setSize(mapWidth, mapHeight);
        map.setTileSize(tileWidth, tileHeight);
        
        // Create a dummy tileset
        var tileset = new Tileset("dummy");
        tileset.setTileSize(tileWidth, tileHeight);
        for (var i = 0; i < 256; i++) {
            tileset.addTile();
        }
        map.addTileset(tileset);        

        // Create rooms layer
        var roomsLayer = new TileLayer("rooms");
        roomsLayer.width = mapWidth;
        roomsLayer.height = mapHeight;
        
        // Read and place each room
        var edit = roomsLayer.edit();
        
        for (var i = 0; i < roomFiles.length; i++) {
            var roomInfo = roomFiles[i];
            var file = new BinaryFile(roomInfo.fileName, BinaryFile.ReadOnly);
            var buffer = file.readAll();
            var view = new Uint32Array(buffer);
            
            // Place tiles for this room at its correct position
            var tileIndex = 0;
            for (var y = 0; y < roomHeightTiles; y++) {
                for (var x = 0; x < roomWidthTiles; x++) {
                    var mapX = roomInfo.col * roomWidthTiles + x;
                    var mapY = roomInfo.row * roomHeightTiles + y;
                    
                    var tileId = view[tileIndex];
                    
                    // Handle 1-based to 0-based conversion
                    edit.setTile(mapX, mapY, tileset.tile(tileId));
                    
                    tileIndex++;
                }
            }
            
            file.close();
        }
        
        edit.apply();
        
        map.addLayer(roomsLayer);
        
        tiled.log("Imported " + roomFiles.length + " rooms into " + (maxCol + 1) + "x" + (maxRow + 1) + " grid");
        return map;
    },

    write: function(map, fileName) {
        // Check if we have a world
        if (!tiled.worlds || tiled.worlds.length === 0) {
            tiled.error("No world found. This exporter requires maps to be part of a Tiled world.");
            return;
        }

        var world = tiled.worlds[0];
        var roomWidthPixels = 320;
        var roomHeightPixels = 240;

        // Find all maps in the world and determine the top-left origin
        var worldMaps = world.maps;
        var minX = Infinity;
        var minY = Infinity;

        for (var i = 0; i < worldMaps.length; i++) {
            var worldMap = worldMaps[i];
            minX = Math.min(minX, worldMap.rect.x);
            minY = Math.min(minY, worldMap.rect.y);
        }

        if (worldMaps.length === 0) {
            tiled.error("No maps found in world");
            return;
        }

        // Round to nearest room grid position
        var originX = Math.round(minX / roomWidthPixels) * roomWidthPixels;
        var originY = Math.round(minY / roomHeightPixels) * roomHeightPixels;

        tiled.log("World origin: (" + originX + ", " + originY + ")");

        // Extract directory path from fileName and use "room" as base name
        var lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
        var dirPath = lastSlash > 0 ? fileName.substring(0, lastSlash + 1) : '';
        var baseName = dirPath + "room";

        var roomsExported = 0;

        // Process each map in the world
        for (var i = 0; i < worldMaps.length; i++) {
            var worldMap = worldMaps[i];
            var loadedMap = tiled.open(worldMap.fileName);
            
            if (!loadedMap) {
                tiled.warn("Could not load map: " + worldMap.fileName);
                continue;
            }

            // Use the first tile layer
            var roomsLayer = null;
            for (var j = 0; j < loadedMap.layerCount; j++) {
                var layer = loadedMap.layerAt(j);
                if (layer.isTileLayer) {
                    roomsLayer = layer;
                    break;
                }
            }

            if (!roomsLayer) {
                tiled.warn("No tile layer found in " + worldMap.fileName);
                continue;
            }

            // Calculate room dimensions in tiles
            var tileWidth = loadedMap.tileWidth;
            var tileHeight = loadedMap.tileHeight;
            var roomWidthTiles = Math.floor(roomWidthPixels / tileWidth);
            var roomHeightTiles = Math.floor(roomHeightPixels / tileHeight);

            // Calculate which rooms this map covers
            var mapWorldX = Math.round(worldMap.rect.x / roomWidthPixels) * roomWidthPixels;
            var mapWorldY = Math.round(worldMap.rect.y / roomHeightPixels) * roomHeightPixels;
            
            // Calculate room grid position relative to origin
            var startRoomCol = Math.round((mapWorldX - originX) / roomWidthPixels);
            var startRoomRow = Math.round((mapWorldY - originY) / roomHeightPixels);

            // Calculate how many rooms this map spans
            var roomsX = Math.ceil(loadedMap.width / roomWidthTiles);
            var roomsY = Math.ceil(loadedMap.height / roomHeightTiles);

            // Extract and write each room
            for (var ry = 0; ry < roomsY; ry++) {
                for (var rx = 0; rx < roomsX; rx++) {
                    var roomData = [];
                    var hasData = false;

                    // Extract tiles for this room
                    for (var y = 0; y < roomHeightTiles; y++) {
                        for (var x = 0; x < roomWidthTiles; x++) {
                            var mapX = rx * roomWidthTiles + x;
                            var mapY = ry * roomHeightTiles + y;
                            
                            var tileId = -1;
                            if (mapX < loadedMap.width && mapY < loadedMap.height) {
                                var cell = roomsLayer.cellAt(mapX, mapY);
                                tileId = cell.tileId;
                                if (tileId !== -1) {
                                    hasData = true;
                                }
                            }
                            
                            roomData.push(tileId);
                        }
                    }

                    // Skip empty rooms
                    if (!hasData) {
                        continue;
                    }

                    // Calculate room number: row * 10 + col
                    var roomCol = startRoomCol + rx;
                    var roomRow = startRoomRow + ry;
                    var roomNumber = roomRow * 10 + roomCol;

                    // Validate room number is in valid range
                    if (roomNumber < 0 || roomNumber >= 100) {
                        tiled.warn("Room number " + roomNumber + " out of range [0-99], skipping");
                        continue;
                    }

                    // Write room data as binary file
                    var roomFileName = baseName + String(roomNumber).padStart(3, '0') + '.dat';
                    var buffer = new ArrayBuffer(roomData.length * 4);
                    var view = new Uint32Array(buffer);
                    
                    for (var k = 0; k < roomData.length; k++) {
                        view[k] = roomData[k];
                    }

                    var file = new BinaryFile(roomFileName, BinaryFile.WriteOnly);
                    file.write(buffer);
                    file.commit();
                    
                    roomsExported++;
                }
            }
        }

        tiled.log("Exported " + roomsExported + " rooms");
    }
};

tiled.registerMapFormat("kvn-room", kvnRoom);