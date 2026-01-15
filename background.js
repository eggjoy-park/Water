
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  alpha: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const circles = [];
const colors = [0xff6347, 0x4682b4, 0x9acd32, 0xffd700, 0x6a5acd];

function addCircle() {
    const geometry = new THREE.CircleGeometry(1, 64);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
    });
    const circle = new THREE.Mesh(geometry, material);

    const [x, y] = [
        THREE.MathUtils.randFloatSpread(15),
        THREE.MathUtils.randFloatSpread(15),
    ];
    const z = THREE.MathUtils.randFloat(-10, -20);
    
    circle.position.set(x, y, z);
    
    circle.userData = {
        life: 0,
        maxLife: THREE.MathUtils.randFloat(100, 200), // Lifespan in frames
    };

    scene.add(circle);
    circles.push(circle);
}

camera.position.z = 5;

function animate() {
  requestAnimationFrame(animate);

  // Add a new circle if the total number is less than 8
  if (circles.length < 8) {
      addCircle();
  }

  for (let i = circles.length - 1; i >= 0; i--) {
      const circle = circles[i];
      
      // Animate the circle
      circle.userData.life += 1;
      const lifeRatio = circle.userData.life / circle.userData.maxLife;

      // Scale increases over life (very slowly)
      const scale = lifeRatio * 2;
      circle.scale.set(scale, scale, scale);

      // Opacity decreases over life
      circle.material.opacity = 1 - lifeRatio;

      // Remove circle when its life is over
      if (circle.userData.life >= circle.userData.maxLife) {
          scene.remove(circle);
          circle.geometry.dispose();
          circle.material.dispose();
          circles.splice(i, 1);
      }
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
