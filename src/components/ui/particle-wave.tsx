import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Theme = 'dark' | 'light';

interface ParticleWaveProps {
  className?: string;
}

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  particles: THREE.Points;
  particleMaterial: THREE.ShaderMaterial;
  animationId: number | null;
  theme: Theme;
}

const ParticleWave = ({ className = '' }: ParticleWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneState | null>(null);

  const getCurrentTheme = (): Theme =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

  const getBackgroundColor = (theme: Theme) =>
    theme === 'dark' ? new THREE.Color(0x0a0a0a) : new THREE.Color(0xfafafa);

  const getParticleColor = (theme: Theme) =>
    theme === 'dark' ? new THREE.Vector3(1, 1, 1) : new THREE.Vector3(0.05, 0.05, 0.05);

  const particleVertex = `
    attribute float scale;
    uniform float uTime;
    void main() {
      vec3 p = position;
      float s = scale;
      p.y += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
      p.x += (sin(p.y + uTime) * 0.5);
      s += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = s * 15.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const particleFragment = `
    uniform vec3 uColor;
    void main() {
      gl_FragColor = vec4(uColor, 0.45);
    }
  `;

  const initScene = (canvas: HTMLCanvasElement) => {
    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 1000);
    camera.position.set(0, 6, 5);

    const scene = new THREE.Scene();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      canvas.hidden = true;
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    const theme = getCurrentTheme();
    renderer.setClearColor(getBackgroundColor(theme), 0);

    const gap = 0.3;
    const amountX = 180;
    const amountY = 180;
    const particlePositions = new Float32Array(amountX * amountY * 3);
    const particleScales = new Float32Array(amountX * amountY);
    let positionIndex = 0;
    let scaleIndex = 0;

    for (let x = 0; x < amountX; x += 1) {
      for (let y = 0; y < amountY; y += 1) {
        particlePositions[positionIndex] = x * gap - (amountX * gap) / 2;
        particlePositions[positionIndex + 1] = 0;
        particlePositions[positionIndex + 2] = y * gap - (amountY * gap) / 2;
        particleScales[scaleIndex] = 1;
        positionIndex += 3;
        scaleIndex += 1;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: getParticleColor(theme) },
      },
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);
    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      particleMaterial,
      animationId: null,
      theme,
    };
  };

  const animate = () => {
    const state = sceneRef.current;
    if (!state) return;

    state.particleMaterial.uniforms.uTime.value += 0.04;
    const theme = getCurrentTheme();
    if (state.theme !== theme) {
      state.particleMaterial.uniforms.uColor.value = getParticleColor(theme);
      state.renderer.setClearColor(getBackgroundColor(theme), 0);
      state.theme = theme;
    }

    state.camera.lookAt(state.scene.position);
    state.renderer.render(state.scene, state.camera);
    state.animationId = requestAnimationFrame(animate);
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    const state = sceneRef.current;
    if (!canvas || !state) return;

    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(width, height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    initScene(canvas);
    if (!sceneRef.current) return;

    let isVisible = true;
    const startFrame = () => {
      const state = sceneRef.current;
      if (!state || !isVisible || document.hidden || state.animationId !== null) return;
      animate();
    };
    const stopFrame = () => {
      const state = sceneRef.current;
      if (!state?.animationId) return;
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) startFrame();
      else stopFrame();
    });
    observer.observe(canvas);

    const onVisibilityChange = () => {
      if (document.hidden) stopFrame();
      else startFrame();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('resize', handleResize);
    startFrame();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', handleResize);
      const state = sceneRef.current;
      if (!state) return;
      if (state.animationId !== null) cancelAnimationFrame(state.animationId);
      state.scene.remove(state.particles);
      state.particles.geometry.dispose();
      state.particleMaterial.dispose();
      state.renderer.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  );
};

export { ParticleWave };
