#include quadraticBezier
#include cellCoords

float getOpacity(float d) { // opacity from distance
    return quadraticBezier(d * 2.0 + 1.0, vec2(1.0, 0.0)) * 0.95 + 0.05;
}

vec4 main(in vec2 fragCoord) {
    vec2 xy = cellCoords(fragCoord);
    xy = abs(xy); // mirror to each quadrant
    xy = transformCoordinateSpace(xy); // move to corner or pixel to hex

    float d = distance(xy);
    float itemRadius = getItemRadius();
    float threshold = numUnits + itemRadius;
    float pct = (d - itemRadius) / numUnits;

    float d2 = (distance(xy) - numUnits - itemRadius) / (2.0 * numUnits);
    return vec4(color, 1.) * getOpacity(d2) * opacity;
}