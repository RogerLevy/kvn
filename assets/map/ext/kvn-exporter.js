var roomExporter = {
    name: "KVN Room Exporter",
    extension: "dat",
    nameFilter: "Room files (*.dat)",
    fileName: "room000.dat",

    write: function(map, fileName) {
        // Find the "rooms" layer
        var roomsLayer = null;
        for (var i = 0; i < map.layerCount; ++i) {
            var layer = map.layerAt(i);
            if (layer.isTileLayer && layer.name === "rooms") {
                roomsLayer = layer;
                break;
            }
        }

        if (!roomsLayer) {
            tiled.error("No tilemap layer named 'rooms' found");
            return;
        }

        // Calculate room dimensions in tiles
        var tileWidth = map.tileWidth;
        var tileHeight = map.tileHeight;
        var roomWidthPixels = 320;
        var roomHeightPixels = 240;
        var roomWidthTiles = Math.floor(roomWidthPixels / tileWidth);
        var roomHeightTiles = Math.floor(roomHeightPixels / tileHeight);

        // Calculate number of rooms horizontally and vertically
        var roomsX = Math.ceil(map.width / roomWidthTiles);
        var roomsY = Math.ceil(map.height / roomHeightTiles);

        var baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

        // Process each room
        for (var ry = 0; ry < roomsY; ry++) {
            for (var rx = 0; rx < roomsX; rx++) {
                var roomData = [];
                
                // Extract tiles for this room
                for (var y = 0; y < roomHeightTiles; y++) {
                    for (var x = 0; x < roomWidthTiles; x++) {
                        var mapX = rx * roomWidthTiles + x;
                        var mapY = ry * roomHeightTiles + y;
                        
                        var tileId = roomsLayer.cellAt(mapX, mapY).tileId

                        // if (mapX < map.width && mapY < map.height) {
                        //     var cell = roomsLayer.cellAt(mapX, mapY);
                        //     if (cell.tileId !== -1) {
                        //         // Convert from Tiled's 0-based indexing to 1-based
                        //         // Ignore flip flags by using tileId directly
                        //         tileId = cell.tileId + 1;
                        //     }
                        // }
                        
                        roomData.push(tileId);
                    }
                }

                // Write room data as binary file
                var roomNumber = ry * 100 + rx;
                var roomFileName = baseName + String(roomNumber).padStart(3, '0') + '.dat';
                var buffer = new ArrayBuffer(roomData.length * 4);
                var view = new Uint32Array(buffer);
                
                for (var i = 0; i < roomData.length; i++) {
                    view[i] = roomData[i];
                }

                var file = new BinaryFile(roomFileName, BinaryFile.WriteOnly);
                file.write(buffer);
                file.commit();
            }
        }

        tiled.log("Exported " + (roomsX * roomsY) + " rooms");
    }
};

tiled.registerMapFormat("kvn-room", roomExporter);