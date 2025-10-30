var selectNextTile = tiled.registerAction("SelectNextTile", function(action) {
	if(!tiled.mapEditor || !tiled.mapEditor.tilesetsView || !tiled.mapEditor.tilesetsView.currentTileset
	|| !tiled.mapEditor.tilesetsView.selectedTiles || tiled.mapEditor.tilesetsView.selectedTiles.length < 1) {
		return;
	}

	var selectedTile = tiled.mapEditor.tilesetsView.selectedTiles[0];
	var selectedTileset = tiled.mapEditor.tilesetsView.currentTileset;

	var tileIndex = selectedTileset.tiles.indexOf(selectedTile);
	if(tileIndex < 0)
		tileIndex = 0;
	else {
		if(tileIndex < selectedTileset.tiles.length-1)
			tileIndex++;
		else tileIndex = 0;
	}
	
	var newTile = selectedTileset.tiles[tileIndex];
	
	// Update visual selection
	tiled.mapEditor.tilesetsView.selectedTiles = [newTile];
	
	// Update the painting brush
	var brush = new TileMap();
	brush.setSize(1, 1);
	brush.setTileSize(selectedTileset.tileWidth, selectedTileset.tileHeight);
	var layer = new TileLayer();
	brush.addLayer(layer);
	var edit = layer.edit();
	edit.setTile(0, 0, newTile);
	edit.apply();
	tiled.mapEditor.currentBrush = brush;
});
selectNextTile.text = "Select Next Tile";

var selectPrevTile = tiled.registerAction("SelectPrevTile", function(action) {
	if(!tiled.mapEditor || !tiled.mapEditor.tilesetsView || !tiled.mapEditor.tilesetsView.currentTileset
	|| !tiled.mapEditor.tilesetsView.selectedTiles || tiled.mapEditor.tilesetsView.selectedTiles.length < 1) {
		return;
	}

	var selectedTile = tiled.mapEditor.tilesetsView.selectedTiles[0];
	var selectedTileset = tiled.mapEditor.tilesetsView.currentTileset;

	var tileIndex = selectedTileset.tiles.indexOf(selectedTile);
	if(tileIndex < 0)
		tileIndex = selectedTileset.tiles.length-1;
	else {
		if(tileIndex > 0)
			tileIndex--;
		else tileIndex = selectedTileset.tiles.length-1;
	}
	
	var newTile = selectedTileset.tiles[tileIndex];
	
	// Update visual selection
	tiled.mapEditor.tilesetsView.selectedTiles = [newTile];
	
	// Update the painting brush
	var brush = new TileMap();
	brush.setSize(1, 1);
	brush.setTileSize(selectedTileset.tileWidth, selectedTileset.tileHeight);
	var layer = new TileLayer();
	brush.addLayer(layer);
	var edit = layer.edit();
	edit.setTile(0, 0, newTile);
	edit.apply();
	tiled.mapEditor.currentBrush = brush;
});
selectPrevTile.text = "Select Previous Tile";

tiled.extendMenu("Map", [
	{ action: "SelectNextTile", before: "SelectNextTileset" },
	{ action: "SelectPrevTile" }
]);