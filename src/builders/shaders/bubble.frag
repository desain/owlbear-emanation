#include quadraticBezier

// distance from 0 at outside to 1 at inside
float getOpacity(float pct) { // opacity from distance
    return quadraticBezier(1.0 - pct, vec2(1.0, 0.0)) * 0.95 + 0.05;
}

half4 main(float2 fragCoord) {
  vec2 xy = fragCoord - size/2; // put origin in center
  xy = axonometricTransform(xy);
  float d = distance(xy); // distance in pixels
  if (d > 0.0) return vec4(0.0);
  float pct = -d / ((numUnits + itemRadiusUnits) * dpi);
  return vec4(color, 1.0) * getOpacity(pct) * opacity;
}