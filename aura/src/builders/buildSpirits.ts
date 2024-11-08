
export function getSpiritsSksl(numUnits: number) {
    return `
uniform vec2 size;
uniform float time;
uniform float dpi;

const int TRAIL_COUNT = 30;
const int NUM_PARTICLES = ${6 * numUnits};
const float TRAIL_LENGTH = 0.5; // how long back in time

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

half3 c(float t, int particleNum) {
  float t2 = t * 2 + float(particleNum);
  return half3(sin(t2), cos(t2), sin(t2)) * .2 + .8;
}

float2 p(float t, int particleNum, float radius, float speed) {
  float t2 = t * speed + float(particleNum) / float(NUM_PARTICLES);
  return float2(sin(t2), cos(t2)) * radius;
}

half4 main(in float2 fragCoord) {
    float2 uv = (fragCoord / size) * 2.0 - 1.0;
    float unitInUv = dpi / size.x;

    half4 color = half4(0.0);

  	for (int i = 0; i < NUM_PARTICLES; i++) {
      float i_rand = random(vec2(float(i)));
      float radius = .5 + (i_rand - .5) * unitInUv * .3;
      float speed = unitInUv * (9.0 + i_rand);

      for (int j = 0; j < TRAIL_COUNT; j++) {
          float t = time - (float(j) / float(TRAIL_COUNT)) * TRAIL_LENGTH;
          float dist = length(uv - p(t, i, radius, speed)) * size.x / dpi; // dist as fraction of grid unit

          color += half4(c(t, i), 1) * exp(-dist * 10. - float(j) * 0.1);
      }
    }

    return color;
}
`;
}