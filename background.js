const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  alpha: true,
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Star creation
const starCount = 8000;
const starGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(starCount * 3);
const colors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  // Random positions in a large cube
  positions[i * 3] = (Math.random() - 0.5) * 1000;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;

  // Add some color variety (white to blue-ish)
  const color = new THREE.Color();
  const hue = 0.6 + Math.random() * 0.1; // Blue range
  const saturation = 0.2 + Math.random() * 0.3;
  const lightness = 0.8 + Math.random() * 0.2;
  color.setHSL(hue, saturation, lightness);
  
  colors[i * 3] = color.r;
  colors[i * 3 + 1] = color.g;
  colors[i * 3 + 2] = color.b;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const starMaterial = new THREE.PointsMaterial({
  size: 1.2,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

camera.position.z = 1;

// Mouse movement for parallax
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - window.innerWidth / 2) / 100;
  mouseY = (event.clientY - window.innerHeight / 2) / 100;
});

function animate() {
  requestAnimationFrame(animate);

  const posAttr = stars.geometry.attributes.position;
  for (let i = 0; i < starCount; i++) {
    // Move towards viewer (increasing Z)
    posAttr.array[i * 3 + 2] += 1.5;

    // Reset if it passes the camera or goes too far
    if (posAttr.array[i * 3 + 2] > 500) {
      posAttr.array[i * 3 + 2] = -500;
      // Reposition x and y to fill the field
      posAttr.array[i * 3] = (Math.random() - 0.5) * 1000;
      posAttr.array[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    }
  }
  posAttr.needsUpdate = true;

  // Parallax effect based on mouse
  stars.rotation.x += (mouseY * 0.05 - stars.rotation.x) * 0.05;
  stars.rotation.y += (mouseX * 0.05 - stars.rotation.y) * 0.05;
  
  // Constant slow rotation
  stars.rotation.z += 0.0005;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
