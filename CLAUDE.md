# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## KVN Game Project

A platformer game built on the VFXLand 5 (Supershow) game engine stack. Features exploration, collectibles, inventory system, persistent save/resume functionality, and a 100-room world layout.

## Development Commands

### Running the Game
```bash
# Launch game in development mode (Windows)
dev.bat
```

### Map Editing
- Use Tiled Map Editor with the custom KVN room format extension
- Extension located at: `assets/map/ext/kvn.js`
- Room files stored in: `dat/map/roomXXX.dat` (binary tile data)
- Scene scripts: `dat/map/roomXXX.scn` (VFX Forth initialization code)

## Engine Framework

For VFXLand 5 engine documentation, see: `vfxland5_01/CLAUDE.md`

Key engine concepts:
- VFX Forth dialect with custom OOP system (NIBS)
- "Engineer" runtime environment providing graphics window and main loop
- "Supershow" engine provides actor system with physics and collision detection
- "Spunk" framework provides 100x10 room world layout (40x30 tiles per room, 8x8 pixel tiles)
- Hot-reload development workflow

## Game Architecture

### Core Files
- `main.vfx` - Entry point, loads engine stack
- `game.vfx` - Main game loop: `think` → `render` → `animate`
- `common.vfx` - Shared utilities, inventory, collectibles, global events, audio priorities
- `constants.vfx` - Game constants
- `platformer.vfx` - Platformer trait system (gravity, jumping, walking, climbing)
- `savegame.vfx` - Save/resume functionality with world state persistence
- `gameover.vfx` - Game over screen and retry logic
- `modes.vfx` - Includes game modes

### Actor Scripts
Located in `scripts/`:
- `kvn.vfx` - Player character with platforming physics
- `crumbler.vfx` - Crumbling block actor
- `slimedrop.vfx` - Dripping slime hazard
- `secret.vfx` - Secret collectible actor
- `lift.vfx` / `lift1.vfx` - Moving platform actors
- `security.vfx` - Security actor
- `death.vfx` - Death handler

### Game Loop Pattern
```forth
: render  crt>  backsprites  bg  sprites  hud ;
: think   generate animate step ?travel instalment controls muting ;
```

- `render` - Draw CRT shader, background sprites, tilemap, sprites, HUD
- `think` - Generate hazards, animate, physics step, room transitions, payment system, controls, audio
- `animate` - Handled by engine

## Key Systems

### Platformer Trait System
The `platformer` trait provides movement mechanics:
- Properties: `hp`, `fac` (facing), `falling`, `in-air`, `climbing`
- Statics: `gravity`, `terminal-vy`, `jumppower`, `risepower`, `walkspeed`, `inertia`
- Protocols: `_walk`, `_jump`, `_squat`, `_idle`, `_fall`, `_climb`, `collide`, `burn`

Player character (KVN class) derives from `actor` and works-with `platformer`.

### Inventory System
Dictionary-based inventory stored in `inventory`:
```forth
c" key" have      \ Check quantity
1 c" key" get     \ Add to inventory
1 c" key" discard \ Remove from inventory
divest            \ Clear entire inventory
```

Collectible items: keys, rings, money, hearts, diamonds, clubs, spades, notes, beer, baby

### Room System
- 100-room world organized as 10x100 grid (rooms 000-909)
- Room numbers: row * 100 + col (e.g., room 503 = row 5, col 3)
- Binary tile data: `dat/map/roomXXX.dat` (40x30 tiles = 4800 bytes as uint32 array)
- Scene scripts: `dat/map/roomXXX.scn` (optional initialization code)

### Room Transitions
Automatic travel when player reaches screen edge:
- Right edge (x >= 320): +1 room horizontally
- Left edge (x <= 0): -1 room horizontally
- Bottom edge (y >= 240): +100 room vertically
- Top edge (y <= 0): -100 room vertically

### Tile Semantics
- Tile 8: Door requiring key
- Tile 10: Door requiring ring
- Tile 22: Secret collectible (spawns secret actor)
- Tile 31: Slime drop spawner (column-based generation)
- Tile 178: Crumbling block trigger
- Tile 240-255: Climbable surfaces
- Collectible tiles (3-6, 9, 11-14, 20): Auto-collected on contact

### Save System
- Auto-save on exit (if `can-save` is enabled)
- Save file: `kvn.sav`
- Persists: inventory, variables, world state, actor positions, player position
- Debug mode skips save/resume

### Death & Game Over
From `doc/design.txt`:
- On death: game saves, player loses $1000, can retry or quit
- Game over: if insufficient money to retry, save deleted, game resets
- Deaths tracked in `#deaths` variable

### Audio System
Priority-based voice system prevents lower-priority sounds from interrupting:
- Uses `importance` array to store sound priorities (0-9)
- `voice?` checks priorities before playing
- Highest priority (9): death, game over, baby collectible
- Medium priority (2-3): keys, doors, splat, fall, secret
- Low priority (1): general collectibles, jump, drip

### Generator System
Column-based hazard generation in `generate`:
- Scans tilemap columns every 500ms
- Spawns actors based on tile types (e.g., tile 31 = slime drop)

### HUD Display
Format: `Room# Keys $Money [Debug:X Y] GameTime(H:M:S)`
- Room number with icon
- 3 key slots + ring slot
- Money display (flashes when `money-flashing` enabled)
- Optional coordinates (debug mode)
- Optional game time clock (toggle with <t> key)

## Controls
- Arrow keys: Movement
- Space: Jump (`<jump>`)
- Down: Squat/climb down (`<squat>`)
- Enter: Start menu (`<start>`)
- Q: Use (`<use>`)
- T: Toggle clock display
- M: Toggle mute
- Enter/Esc: Subscreen (context-dependent)

## Asset Directories
- `dat/gfx/` - PNG graphics (auto-loaded as bitmaps)
- `dat/map/` - Room tile data (.dat) and scene scripts (.scn)
- `dat/bgm/` - Background music
- `dat/smp/` - OGG sound samples (auto-loaded)

## Tiled Map Editor Integration
Custom room format extension at `assets/map/ext/kvn.js`:
- Import: Reads all roomXXX.dat files, assembles into single Tiled map
- Export: Splits Tiled map back into individual room files
- Room dimensions: 40x30 tiles (320x240 pixels at 8x8 tile size)
- Rooms arranged in grid based on numbering (row = roomNum / 100, col = roomNum % 100)

## Key Patterns

### Actor Instantiation
```forth
x y at actor-class one       \ Spawn actor at coordinates
512 priority actor-class one \ Spawn with priority (default 0)
```

### Property Access
```forth
p1 -> x 2@           \ Access property via ->
p1 as> x 2@          \ Enter object context with as>
p1 [[ x 2@ ]]        \ Enter object context with [[
```

### Global Events
```forth
s" event-name" gevent \ Execute named global event
```

Common events:
- `game` - Return to game loop
- `restart` - Full game restart
- `death` - Player death sequence

### Physics/Behavior Assignment
```forth
act> <code>          \ Per-frame behavior
act&> <code>         \ Per-frame behavior with immediate execution
phys> <code>         \ Physics phase behavior
['] word phys !      \ Assign physics word
```

## Development Notes

### Spunk Constraints
- World: 100 rooms (10x10 grid)
- Room: 40x30 tiles (320x240 pixels)
- Tile: 8x8 pixels

### Player State Management
Player actor stored in global `p1` variable:
```forth
?kvn to p1           \ Get/spawn player
p1 as> <code>        \ Access player properties
```

### Room Loading Hook
Custom initialization on room load via `load-room-chain`:
```forth
load-room-chain link ' create-secrets ,
```

The `create-secrets` word scans for tile 22 and spawns secret actors.

### Debugging
- `debug @` controls debug mode (affects auto-save, HUD display, subscreen key)
- `godmode @` disables fall damage
- Coordinate display in HUD when debug enabled