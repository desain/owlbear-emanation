// Stolen from https://github.com/owlbear-rodeo/weather/blob/main/src/background/shaders/util/fbm.frag

// Instead perlin noise or something this is just a checkerboard
// This idea comes from https://iquilezles.org/articles/warp/ where
// it works well
float noise(in vec2 p) {
  return sin(p.x) * sin(p.y);
}

// Bellow are two fBMs with different frequencies
// You could do these with a loop like:
// for (int i = 0; i < OCTAVES; i++) {
//   value += amplitude * noise(p);
//   p *= 2.0;
//   amplitude *= 0.5;
// }
// But here the loops are unrolled and each iteration of the
// loop is detuned a bit (multiplied by 1.01 etc) which helps reduce
// self similarity. The space is also rotated to help with this as well.
// This concept appears in https://iquilezles.org/articles/warp/ and other
// uses of fBMs accross the web.
// For an introduction to this concept see https://thebookofshaders.com/13/

mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);

float fbm4(vec2 p) {
  float f = 0.0;
  f += 0.5000 * noise(p);
  p = rot * p * 2.02;
  f += 0.2500 * noise(p);
  p = rot * p * 2.03;
  f += 0.1250 * noise(p);
  p = rot * p * 2.01;
  f += 0.0625 * noise(p);
  return f / 0.9375;
}

float fbm6(vec2 p) {
  float f = 0.0;
  f += 0.500000 * noise(p);
  p = rot * p * 2.02;
  f += 0.250000 * noise(p);
  p = rot * p * 2.03;
  f += 0.125000 * noise(p);
  p = rot * p * 2.01;
  f += 0.062500 * noise(p);
  p = rot * p * 2.04;
  f += 0.031250 * noise(p);
  p = rot * p * 2.01;
  f += 0.015625 * noise(p);
  return f / 0.96875;
}