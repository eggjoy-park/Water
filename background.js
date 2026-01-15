
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

function addShape() {
    const geometry = new THREE.BoxGeometry( 2, 2, 2 );
    const edges = new THREE.EdgesGeometry( geometry );
    const grayValue = Math.floor(Math.random() * 128) + 64; // shades of gray from dark to light
    const grayHex = (grayValue << 16) | (grayValue << 8) | grayValue;
    const material = new THREE.LineBasicMaterial({
        color: grayHex,
    });
    const shape = new THREE.LineSegments(edges, material);

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(20));

    shape.position.set(x, y, z);
    shape.rotation.set(Math.random(), Math.random(), Math.random());

    scene.add(shape);
    shapes.push(shape);
}

Array(7).fill().forEach(addShape);


camera.position.z = 15;

function animate() {
  requestAnimationFrame(animate);

  shapes.forEach(shape => {
      shape.rotation.x += 0.001;
      shape.rotation.y += 0.001;
      shape.rotation.z += 0.001;
  });

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
