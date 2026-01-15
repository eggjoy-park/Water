
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  alpha: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights (can be removed or adjusted later)
const pointLight = new THREE.PointLight(0xffffff, 0.6);
pointLight.position.set(5, 5, 5);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(pointLight, ambientLight);

// New wave animation
const geometry = new THREE.PlaneGeometry(30, 30, 100, 100);

const material = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0.0 },
    u_color1: { value: new THREE.Color(0x6a5acd) }, // SlateBlue
    u_color2: { value: new THREE.Color(0xff6347) }, // Tomato
    u_color3: { value: new THREE.Color(0x4682b4) }, // SteelBlue
  },
  vertexShader: `
    uniform float u_time;
    varying float v_elevation;
    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      // Create two sine waves
      float wave1 = sin(modelPosition.x * 0.2 + u_time * 0.5);
      float wave2 = sin(modelPosition.y * 0.3 + u_time * 0.3);
      
      // Combine them and add some noise
      float elevation = (wave1 + wave2) * 0.7;
      
      modelPosition.z += elevation;
      
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
      v_elevation = elevation;
    }
  `,
  fragmentShader: `
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec3 u_color3;
    varying float v_elevation;

    void main() {
      // Mix colors based on elevation
      vec3 final_color = mix(u_color1, u_color2, (v_elevation + 1.0) / 2.0);
      final_color = mix(final_color, u_color3, (sin(v_elevation * 5.0) + 1.0) / 2.0);
      
      gl_FragColor = vec4(final_color, 1.0);
    }
  `,
  wireframe: true, // This will give the sound wave look
});

const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = -Math.PI / 4; // Rotate the plane to see the effect better
scene.add(plane);


camera.position.z = 10;
camera.position.y = 5;
camera.lookAt(plane.position);

let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();
  material.uniforms.u_time.value = elapsedTime;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
