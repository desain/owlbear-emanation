#include hash

// Stolen from https://github.com/owlbear-rodeo/weather/blob/main/src/background/shaders/util/circle.frag
// Based off of https://thebookofshaders.com/12/
// A simple voronoi based cellular animation that jitters back and forth
void animatedCircle(vec2 p, float jitter, float speed, inout float minDist, inout vec2 minPoint) {
  // Split the space into tiles
  vec2 tileInt = floor(p);
  vec2 tileFrac = fract(p);
  // Query the surrounding tiles to find the minimum values
  for(int j = -1; j <= 1; j++) {
    for(int i = -1; i <= 1; i++) {
      vec2 neighbor = vec2(float(i), float(j));
      vec2 point = hash(tileInt + neighbor);
      // Animate the point
      point = 0.5 + 0.5 * sin(time * speed + jitter * point);
      vec2 diff = neighbor + point - tileFrac;
      float dist = length(diff);
      if(dist < minDist) {
        minDist = dist;
        minPoint = point;
      }
    }
  }
}