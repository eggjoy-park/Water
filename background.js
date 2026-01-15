
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  alpha: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.6);
pointLight.position.set(5, 5, 5);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(pointLight, ambientLight);

const shapes = [];

const geometries = [
    new THREE.TorusKnotGeometry(3.0, 0.6, 100, 16),
    new THREE.IcosahedronGeometry(3.0),
    new THREE.DodecahedronGeometry(3.0)
];
const colors = [0xff6347, 0x4682b4, 0x9acd32, 0xffd700, 0x6a5acd];

function addShape() {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.8,
    });
    const shape = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(20));

    shape.position.set(x, y, z);
    shape.rotation.set(Math.random(), Math.random(), Math.random());

    shape.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );

    scene.add(shape);
    shapes.push(shape);
}

Array(20).fill().forEach(addShape);


camera.position.z = 15;

function animate() {
  requestAnimationFrame(animate);

  shapes.forEach(shape => {
      shape.rotation.x += 0.001;
      shape.rotation.y += 0.001;
      shape.rotation.z += 0.001;

      shape.position.add(shape.userData.velocity);

      if (shape.position.x > 15 || shape.position.x < -15) {
        shape.userData.velocity.x = -shape.userData.velocity.x;
      }
      if (shape.position.y > 10 || shape.position.y < -10) {
          shape.userData.velocity.y = -shape.userData.velocity.y;
      }
      if (shape.position.z > 10 || shape.position.z < -10) {
          shape.userData.velocity.z = -shape.userData.velocity.z;
      }
  });

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
