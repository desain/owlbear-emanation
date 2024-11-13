vec2 cellCoords(vec2 fragCoord) {
    return (fragCoord - size/2.0) / dpi;
}