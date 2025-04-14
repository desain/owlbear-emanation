uniform float time;
uniform vec2 size;
uniform vec2 direction;
uniform float speed;
uniform float density;

#include util/circle.frag
#include util/fbm.frag;

float snow(vec2 p, float jitter, vec2 direction, float speed, float size) {
  // Move the input space in the given direction
  p += time * direction * speed * vec2(-1, 1);
  // Animate the swaying of the snow
  float minDist = 10.;
  vec2 minPoint;
  animatedCircle(p, jitter, speed, minDist, minPoint);
  // Scale the circle by the progress of the animation
  float scale = dot(minPoint, vec2(0.4, 0.4)) - 0.2 - size;
  // Convert the distance to a circle
  float blur = size * 0.2;
  float circle = smoothstep(size * scale - blur, size * scale + blur, minDist);
  return 1.0 - circle;
}

float mist(vec2 p, float speed) {
  // Animate the space in the given direction
  vec2 anim = direction * time * speed * vec2(-1, 1) * 0.25;

  // Calculate the inner deformation with a slower animation
  vec2 innerP = p + anim * 0.5;
  vec2 q = vec2(fbm4(innerP), fbm4(innerP + vec2(5.452)));

  // Feed the inner fBM into another fBM like https://iquilezles.org/articles/warp/
  return fbm6(p + anim + q * 1.3);
}

half4 main(float2 coord) {
  vec2 p = coord / size;
  // Remove aspect ratio
  p.x *= size.x / size.y;
  float alpha = 0.0;

  // Exponential speed from the input
  float baseSpeed = pow(speed - 0.5, 1.5);
  // Tile per 20 grid cells
  float tiling = max(size.x, size.y) / 150.0 / 20.0;

  // Overlap snow falls of different sizes and speeds
  alpha += snow(p * 8.0 * tiling, 8.363, direction, 0.884 * baseSpeed, 0.08);
  if(density > 3) {
    alpha += snow(p * 35.0 * tiling, 11.683, direction, 1.24 * baseSpeed, 0.25);
  } else if(density > 2) {
    alpha += snow(p * 30.0 * tiling, 11.683, direction, 0.824 * baseSpeed, 0.25);
  } else if(density > 1) {
    alpha += snow(p * 15.0 * tiling, 11.683, direction, 0.824 * baseSpeed, 0.1);
  } else {
    alpha += snow(p * 5.0 * tiling, 11.683, direction, 0.524 * baseSpeed, 0.04);
  }

  if(density > 2) {
    float intensity = density > 3 ? 1.25 : 0.5;
    alpha += mist(p * 5.0 * tiling, baseSpeed) * intensity;
  }

  return vec4(1.0) * alpha * 0.8;
}