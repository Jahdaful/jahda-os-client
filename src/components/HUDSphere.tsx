import { useEffect, useRef } from "react";
import * as THREE from "three";

interface OrbData {
  id: string;
  color: string;
}

interface Props {
  orbs: OrbData[];
  highlightedId: string | null;
}

export default function HUDSphere({ orbs, highlightedId }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<string | null>(highlightedId);

  useEffect(() => {
    highlightedRef.current = highlightedId;
  }, [highlightedId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || 420;
    const H = mount.clientHeight || 420;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 6;

    // ── Central particle sphere ──────────────────────────────────────────────
    const PARTICLE_COUNT = 1800;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const primaryColor = new THREE.Color("#0066ff");
    const accentColor = new THREE.Color("#00d4ff");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere distribution for even spread
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.6 + Math.random() * 0.15;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const mix = Math.random();
      const c = primaryColor.clone().lerp(accentColor, mix);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Inner translucent core
    const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x001133,
      transparent: true,
      opacity: 0.35,
    });
    scene.add(new THREE.Mesh(coreGeo, coreMat));

    // ── Orbit rings + orb meshes ─────────────────────────────────────────────
    const orbRadii = [2.6, 3.0, 3.35, 3.7];
    const orbSpeeds = [0.55, 0.42, 0.32, 0.25];
    const orbInclinations = [0, Math.PI / 5, -Math.PI / 7, Math.PI / 3.5];
    const orbAngles: number[] = orbs.map((_, i) => (i / orbs.length) * Math.PI * 2);
    const orbMeshes: THREE.Mesh[] = [];
    const orbGlowMeshes: THREE.Mesh[] = [];
    const orbPivots: THREE.Object3D[] = [];

    orbs.forEach((orb, i) => {
      const color = new THREE.Color(orb.color);

      // Orbit ring
      const ringGeo = new THREE.RingGeometry(orbRadii[i] - 0.008, orbRadii[i] + 0.008, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = orbInclinations[i];
      scene.add(ring);

      // Pivot for tilted orbit
      const pivot = new THREE.Object3D();
      pivot.rotation.x = orbInclinations[i];
      scene.add(pivot);
      orbPivots.push(pivot);

      // Orb sphere
      const orbGeo = new THREE.SphereGeometry(0.12, 20, 20);
      const orbMat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      pivot.add(mesh);
      orbMeshes.push(mesh);

      // Glow halo
      const glowGeo = new THREE.SphereGeometry(0.22, 20, 20);
      const glowMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      mesh.add(glowMesh);
      orbGlowMeshes.push(glowMesh);
    });

    // ── Data arc lines connecting orbs to center ─────────────────────────────
    const arcLines: THREE.Line[] = [];
    orbs.forEach((orb) => {
      const color = new THREE.Color(orb.color);
      const lineMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08,
      });
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(6), 3)
      );
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      arcLines.push(line);
    });

    // ── Animation loop ───────────────────────────────────────────────────────
    let time = 0;
    let rafId = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      time += 0.01;

      // Breathe + rotate particle sphere
      particles.rotation.y += 0.0025;
      particles.rotation.x += 0.0008;
      const breathScale = 1 + Math.sin(time * 0.7) * 0.025;
      particles.scale.setScalar(breathScale);

      // Animate orbs
      orbs.forEach((orb, i) => {
        orbAngles[i] += orbSpeeds[i] * 0.01;
        const angle = orbAngles[i];
        const r = orbRadii[i];

        orbMeshes[i].position.set(r * Math.cos(angle), 0, r * Math.sin(angle));

        // Pulse highlighted orb
        const isHighlighted = highlightedRef.current === orb.id;
        const pulse = isHighlighted ? 1.5 + Math.sin(time * 6) * 0.5 : 1;
        orbMeshes[i].scale.setScalar(pulse);
        (orbGlowMeshes[i].material as THREE.MeshBasicMaterial).opacity = isHighlighted
          ? 0.5 + Math.sin(time * 6) * 0.2
          : 0.25;

        // Update arc line from center to orb world position
        const worldPos = new THREE.Vector3();
        orbMeshes[i].getWorldPosition(worldPos);
        const posAttr = arcLines[i].geometry.attributes.position as THREE.BufferAttribute;
        posAttr.setXYZ(0, 0, 0, 0);
        posAttr.setXYZ(1, worldPos.x, worldPos.y, worldPos.z);
        posAttr.needsUpdate = true;
      });

      renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbs]);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
