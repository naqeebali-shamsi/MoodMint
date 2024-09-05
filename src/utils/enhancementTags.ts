const enhancementTags = [
    "enhance", "cinematic-diva", "abstract-expressionism", "academia", "action-figure", "adorable-3d-character", "adorable-kawaii", "art-deco", "art-nouveau", "astral-aura", "avant-garde", "baroque", "bauhaus-style-poster", "blueprint-schematic-drawing", "caricature", "cel-shaded-art", "character-design-sheet", "classicism-art", "color-field-painting", "colored-pencil-art", "conceptual-art", "constructivism", "cubism", "dadaism", "dark-fantasy", "dark-moody-atmosphere", "dmt-art", "doodle-art", "double-exposure", "dripping-paint-splatter", "expressionism", "faded-polaroid-photo", "fauvism", "flat-2d", "fortnite-style", "futurism", "glitchcore", "glo-fi", "googie-style", "graffiti-art", "harlem-renaissance-art", "high-fashion", "idyllic", "impressionism", "infographic-drawing", "ink-dripping-drawing", "japanese-ink-drawing", "knolling-photography", "light-cheery-atmosphere", "logo-design", "luxurious-elegance", "macro-photography", "mandola-art", "marker-drawing", "medievalism", "minimalism", "neo-baroque", "neo-byzantine", "neo-futurism", "neo-impressionism", "neo-rococo", "neoclassicism", "op-art", "ornate-and-intricate", "pencil-sketch-drawing", "pop-art-2", "rococo", "silhouette-art", "simple-vector-art", "sketchup", "steampunk-2", "surrealism", "suprematism", "terragen", "tranquil-relaxing-atmosphere", "sticker-designs", "vibrant-rim-light", "volumetric-lighting", "watercolor", "whimsical-and-playful", "sharp", "masterpiece", "photograph", "negative", "cinematic", "ads-advertising", "ads-automotive", "ads-corporate", "ads-fashion-editorial", "ads-food-photography", "ads-gourmet-food-photography", "ads-luxury", "ads-real-estate", "ads-retail", "abstract", "abstract-expressionism", "art-deco", "art-nouveau", "constructivist", "cubist", "expressionist", "graffiti", "hyperrealism", "impressionist", "pointillism", "pop-art", "psychedelic", "renaissance", "steampunk", "surrealist", "typography", "watercolor", "futuristic-biomechanical", "futuristic-biomechanical-cyberpunk", "futuristic-cybernetic", "futuristic-cybernetic-robot", "futuristic-cyberpunk-cityscape", "futuristic-futuristic", "futuristic-retro-cyberpunk", "futuristic-retro", "futuristic-sci-fi", "futuristic-vaporwave", "game-bubble", "game-cyberpunk", "game-fighting", "game-gta", "game-mario", "game-minecraft", "game-pokemon", "game-retro-arcade", "game-retro", "game-rpg-fantasy", "game-strategy", "game-streetfighter", "game-zelda", "misc-architectural", "misc-disco", "misc-dreamscape", "misc-dystopian", "misc-fairy-tale", "misc-gothic", "misc-grunge", "misc-horror", "misc-kawaii", "misc-lovecraftian", "misc-macabre", "misc-manga", "misc-metropolis", "misc-minimalist", "misc-monochrome", "misc-nautical", "misc-space", "misc-stained-glass", "misc-techwear-fashion", "misc-tribal", "misc-zentangle", "papercraft-collage", "papercraft-flat-papercut", "papercraft-kirigami", "papercraft-paper-mache", "papercraft-paper-quilling", "papercraft-papercut-collage", "papercraft-papercut-shadow-box", "papercraft-stacked-papercut", "papercraft-thick-layered-papercut", "photo-alien", "photo-film-noir", "photo-glamour", "photo-hdr", "photo-iphone-photographic", "photo-long-exposure", "photo-neon-noir", "photo-silhouette", "photo-tilt-shift", "3d-model", "analog-film", "anime", "cinematic", "comic-book", "craft-clay", "digital-art", "fantasy-art", "isometric", "line-art", "lowpoly", "neonpunk", "origami", "photographic", "pixel-art", "texture"
];

export function getRandomEnhancementTag(): string {
    const randomIndex = Math.floor(Math.random() * enhancementTags.length);
    return enhancementTags[randomIndex];
}