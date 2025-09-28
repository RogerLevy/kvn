var roomImporter = {
    name: "KVN Room Importer",
    extension: "dat",
    nameFilter: "Room files (*.dat)",

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
            var tileIndex = 0;  // ← Different variable name
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
    }
};

tiled.registerMapFormat("kvn-room", roomImporter);