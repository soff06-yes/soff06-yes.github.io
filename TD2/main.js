import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const largeur = window.innerWidth;
const hauteur = window.innerHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(60, largeur / hauteur, 0.1, 100);
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);

const rendu = new THREE.WebGLRenderer({ antialias: true });
rendu.setSize(largeur, hauteur);
document.body.appendChild(rendu.domElement);

const controle = new OrbitControls(camera, rendu.domElement);
controle.target.set(0, 0.2, 0);
controle.enableDamping = true;
controle.update();

const lumiereAmbiante = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(lumiereAmbiante);

const lumiereDirectionnelle = new THREE.DirectionalLight(0xffffff, 2);
lumiereDirectionnelle.position.set(5, 5, 5);
scene.add(lumiereDirectionnelle);

const lumierePoint = new THREE.PointLight(0xffaa00, 1.2, 10);
lumierePoint.position.set(-2, 2, 2);
scene.add(lumierePoint);

const chargeur = new GLTFLoader();
let cubeRubik, terre, objetActif = null;

function normaliserObjet(objet, tailleVoulue = 1) {
  const box = new THREE.Box3().setFromObject(objet);
  const taille = new THREE.Vector3();
  box.getSize(taille);
  const maxDim = Math.max(taille.x, taille.y, taille.z);
  const facteur = tailleVoulue / maxDim;
  objet.scale.setScalar(facteur);
  box.setFromObject(objet);
  const centre = new THREE.Vector3();
  box.getCenter(centre);
  objet.position.sub(centre);
}

chargeur.load("./images/rubik.glb", (gltf) => {
  cubeRubik = gltf.scene;
  normaliserObjet(cubeRubik, 1);
  cubeRubik.position.set(1.5, 0, 0);
  scene.add(cubeRubik);
});

chargeur.load("./images/earth.glb", (gltf) => {
  terre = gltf.scene;
  normaliserObjet(terre, 1.5);
  terre.position.set(-1.5, 0, 0);
  scene.add(terre);
});

function animer(temps) {
  const t = temps / 1000;
  if (terre && objetActif !== terre) terre.rotation.y = -t * 0.2;
  controle.update();
  rendu.render(scene, camera);
}
rendu.setAnimationLoop(animer);

let rotationActive = false;
let sourisX = 0, sourisY = 0;

document.addEventListener('mousedown', (e) => {
  selectionnerObjet(e.clientX, e.clientY);
  rotationActive = true;
  sourisX = e.clientX;
  sourisY = e.clientY;
});
document.addEventListener('mousemove', (e) => {
  if (rotationActive && objetActif) {
    const deltaX = (e.clientX - sourisX) * 0.01;
    const deltaY = (e.clientY - sourisY) * 0.01;
    objetActif.rotation.y += deltaX;
    objetActif.rotation.x += deltaY;
    sourisX = e.clientX;
    sourisY = e.clientY;
  }
});
document.addEventListener('mouseup', () => rotationActive = false);

let toucherX = 0, toucherY = 0;
document.addEventListener('touchstart', (e) => {
  selectionnerObjet(e.touches[0].clientX, e.touches[0].clientY);
  toucherX = e.touches[0].clientX;
  toucherY = e.touches[0].clientY;
});
document.addEventListener('touchmove', (e) => {
  if (objetActif) {
    const deltaX = (e.touches[0].clientX - toucherX) * 0.01;
    const deltaY = (e.touches[0].clientY - toucherY) * 0.01;
    objetActif.rotation.y += deltaX;
    objetActif.rotation.x += deltaY;
    toucherX = e.touches[0].clientX;
    toucherY = e.touches[0].clientY;
  }
});

function selectionnerObjet(x, y) {
  const souris = new THREE.Vector2(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1
  );
  const rayon = new THREE.Raycaster();
  rayon.setFromCamera(souris, camera);
  const objets = [];
  if (cubeRubik) objets.push(cubeRubik);
  if (terre) objets.push(terre);
  const intersects = rayon.intersectObjects(objets, true);
  if (intersects.length > 0) {
    objetActif = intersects[0].object;
    while (objetActif.parent && objetActif.parent !== scene) {
      objetActif = objetActif.parent;
    }
  }
}
window.addEventListener('resize', () => {
  rendu.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
