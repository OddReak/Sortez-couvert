/**
 * Shaders du globe (brief §7.1).
 * - Terminateur : mix(nuit, jour, smoothstep(-0.10, 0.10, dot(normal, sunDir)))
 * - Atmosphère : halo fresnel pow(1 - dot(viewDir, normal), 3)
 */

export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform vec3 sunDirection;
  uniform vec3 cameraPositionW;
  uniform float nightIntensity;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 sun = normalize(sunDirection);
    float d = dot(normal, sun);

    // Largeur du terminateur ≈ 11° d'arc → crépuscule doux (brief §7.1).
    float dayAmount = smoothstep(-0.10, 0.10, d);

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb * nightIntensity;

    vec3 color = mix(night, day, dayAmount);

    // Le globe ne doit pas disparaître dans le fond sombre : plancher léger.
    color += vec3(0.018, 0.022, 0.035) * (1.0 - dayAmount);

    // Reflet spéculaire discret sur les océans, côté jour.
    float ocean = texture2D(specMap, vUv).r;
    vec3 viewDir = normalize(cameraPositionW - vPositionW);
    vec3 halfDir = normalize(sun + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 24.0);
    color += spec * ocean * dayAmount * 0.25;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 glowColor;
  uniform vec3 cameraPositionW;
  uniform vec3 sunDirection;
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPositionW - vPositionW);
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    // Halo plus fort côté jour, mais un liseré subsiste côté nuit (le globe
    // reste détaché du fond sombre).
    float sunSide = clamp(dot(normal, normalize(sunDirection)) * 0.5 + 0.5, 0.18, 1.0);
    gl_FragColor = vec4(glowColor, fresnel * sunSide * 0.95);
  }
`;
