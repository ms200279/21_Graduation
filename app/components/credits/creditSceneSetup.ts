import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function createCreditSceneBase(container: HTMLDivElement) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const sceneRoot = new THREE.Group();
  const roomEnvironment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;

  roomEnvironment.dispose();
  scene.environment = environmentMap;
  scene.fog = new THREE.Fog("#ffffff", 18, 32);
  scene.add(sceneRoot);

  const ambientLight = new THREE.AmbientLight("#ffffff", 0.44);
  const keyLight = new THREE.DirectionalLight("#ffffff", 0.18);
  const rimLight = new THREE.DirectionalLight("#dcecff", 0.07);
  const fillLight = new THREE.PointLight("#f5f9ff", 0.03, 8);

  keyLight.position.set(-4.8, 1.2, 4.4);
  rimLight.position.set(4.2, -0.4, -3.2);
  fillLight.position.set(2.6, -1.8, 3.2);
  scene.add(ambientLight, keyLight, rimLight, fillLight);

  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "credits-webgl-canvas";
  container.appendChild(renderer.domElement);

  return {
    renderer,
    scene,
    camera,
    sceneRoot,
    environmentMap,
    pmremGenerator,
  };
}

export function disposeCreditSceneBase(
  base: ReturnType<typeof createCreditSceneBase>,
) {
  base.scene.environment = null;
  base.scene.background = null;
  base.environmentMap.dispose();
  base.pmremGenerator.dispose();
  base.renderer.dispose();
}
