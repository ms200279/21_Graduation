import * as THREE from "three";

export function createCreditFragmentMaterial(
  fragmentTexture: THREE.Texture,
  liquidSurfaceTexture: THREE.Texture,
  seed: number,
) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    map: fragmentTexture,
    emissive: new THREE.Color("#000000"),
    emissiveIntensity: 0,
    roughness: 0.22,
    metalness: 0,
    transmission: 0.34,
    thickness: 0.38,
    ior: 1.42,
    clearcoat: 0.18,
    clearcoatRoughness: 0.24,
    specularIntensity: 0.07,
    specularColor: new THREE.Color("#ffffff"),
    attenuationColor: new THREE.Color("#ffffff"),
    attenuationDistance: 3.6,
    envMapIntensity: 0.05,
    bumpMap: liquidSurfaceTexture,
    bumpScale: 0.045 + seed * 0.002,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}
