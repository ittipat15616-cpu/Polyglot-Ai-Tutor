import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';

// ======================================================
// Animation file mapping
// ======================================================
const AVATAR_BASE = '/avatar/Meshy_AI_The_Dapper_Avatar_biped/Meshy_AI_The_Dapper_Avatar_biped_Animation_';

export type AvatarState = 
  | 'idle'
  | 'talking'
  | 'listening'
  | 'greeting'
  | 'celebrating'
  | 'confused'
  | 'agreeing'
  | 'dancing';

const STATE_ANIMATIONS: Record<AvatarState, string[]> = {
  idle:        ['Walking_withSkin.glb', 'Listening_Gesture_withSkin.glb'],
  talking:     ['Talk_Passionately_withSkin.glb', 'Talk_with_Hands_Open_withSkin.glb', 'Talk_with_Left_Hand_Raised_withSkin.glb'],
  listening:   ['Listening_Gesture_withSkin.glb'],
  greeting:    ['Big_Wave_Hello_withSkin.glb', 'Gentlemans_Bow_withSkin.glb'],
  celebrating: ['Motivational_Cheer_withSkin.glb', 'FunnyDancing_02_withSkin.glb', 'FunnyDancing_03_withSkin.glb'],
  confused:    ['Confused_Scratch_withSkin.glb', 'Shrug_withSkin.glb'],
  agreeing:    ['Agree_Gesture_withSkin.glb'],
  dancing:     ['Pod_Baby_Groove_withSkin.glb', 'FunnyDancing_02_withSkin.glb', 'FunnyDancing_03_withSkin.glb'],
};

// Preload the most commonly used animations
const PRIORITY_ANIMS = [
  'Talk_Passionately_withSkin.glb',
  'Big_Wave_Hello_withSkin.glb',
  'Listening_Gesture_withSkin.glb',
];
PRIORITY_ANIMS.forEach(f => useGLTF.preload(AVATAR_BASE + f));

// ======================================================
// Inner Avatar Model Component
// ======================================================
function AvatarModel({ avatarState, isSpeaking }: { avatarState: AvatarState; isSpeaking: boolean }) {
  const [animFile, setAnimFile] = useState(STATE_ANIMATIONS[avatarState][0]);
  const [animIndex, setAnimIndex] = useState(0);
  const groupRef = useRef<THREE.Group>(null);

  const { scene, animations } = useGLTF(AVATAR_BASE + animFile) as any;
  const { actions, names } = useAnimations(animations, groupRef);

  // Cycle through animations within the current state
  useEffect(() => {
    const files = STATE_ANIMATIONS[avatarState];
    const idx = animIndex % files.length;
    setAnimFile(files[idx]);
  }, [avatarState, animIndex]);

  // Cycle animation when it ends
  useEffect(() => {
    if (!actions || names.length === 0) return;
    const animName = names[0];
    const action = actions[animName];
    if (!action) return;

    action.reset().fadeIn(0.4).play();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;

    const mixer = action.getMixer();
    const onFinished = () => {
      setAnimIndex(prev => prev + 1);
    };
    mixer.addEventListener('finished', onFinished);

    return () => {
      action.fadeOut(0.3);
      mixer.removeEventListener('finished', onFinished);
    };
  }, [actions, names, animFile]);

  // Subtle breathing / floating bob when idle
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += Math.sin(Date.now() * 0.001) * 0.0003;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.55, 0]} scale={1.1}>
      <primitive object={scene} />
    </group>
  );
}

// ======================================================
// Scene Background — Elegant Premium classroom environment
// ======================================================
function ClassroomEnvironment() {
  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0d1020" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Back wall glow panel */}
      <mesh position={[0, 1, -3]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#060c1e" roughness={0.9} />
      </mesh>

      {/* Decorative neon lines */}
      {[-2, 2].map((x, i) => (
        <mesh key={i} position={[x, 0.5, -2.98]}>
          <planeGeometry args={[0.02, 4]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={3} />
        </mesh>
      ))}
      <mesh position={[0, -0.5, -2.98]}>
        <planeGeometry args={[4, 0.02]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={2} />
      </mesh>
    </>
  );
}

// ======================================================
// Floating Particles
// ======================================================
function FloatingParticles() {
  const count = 40;
  const mesh = useRef<THREE.Points>(null);
  
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#818cf8" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ======================================================
// Spotlight Ring — shows when speaking
// ======================================================
function SpeakingRing({ isSpeaking }: { isSpeaking: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ring.current) {
      const scale = isSpeaking ? 1 + Math.sin(Date.now() * 0.005) * 0.07 : 1;
      ring.current.scale.set(scale, scale, scale);
      (ring.current.material as THREE.MeshStandardMaterial).emissiveIntensity = isSpeaking
        ? 1.5 + Math.sin(Date.now() * 0.008) * 0.5
        : 0.3;
    }
  });

  return (
    <mesh ref={ring} position={[0, -1.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.45, 0.5, 64]} />
      <meshStandardMaterial
        color="#818cf8"
        emissive="#818cf8"
        emissiveIntensity={0.5}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ======================================================
// Main Exported Component
// ======================================================
interface MrPeAvatarProps {
  avatarState?: AvatarState;
  isSpeaking?: boolean;
  isCalling?: boolean;
  isLiveConnected?: boolean;
  className?: string;
}

export default function MrPeAvatar({
  avatarState = 'idle',
  isSpeaking = false,
  isCalling = false,
  isLiveConnected = false,
  className = '',
}: MrPeAvatarProps) {
  return (
    <div className={`relative w-full h-full bg-gradient-to-b from-[#060c1e] via-[#0d1124] to-[#080d1c] ${className}`}>
      {/* Status overlay badge */}
      <AnimatePresence>
        {isLiveConnected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-3 left-3 z-20 flex items-center gap-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-300 tracking-widest uppercase">Live</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name plate */}
      <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
          <span className="text-xs font-bold text-white tracking-widest uppercase">Mr.Pe</span>
          <span className="text-[10px] text-indigo-300 ml-1">AI Tutor</span>
        </div>
      </div>

      {/* Holographic scan line animation */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 45%, rgba(99,102,241,0.03) 50%, transparent 55%)',
        }}
        animate={{ backgroundPositionY: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0.2, 2.8], fov: 45 }}
        shadows
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 4, 2]} intensity={1.2} castShadow color="#e0e7ff" />
        <pointLight position={[-2, 1, 1]} intensity={0.8} color="#6366f1" />
        <pointLight position={[2, 0, 1]} intensity={0.5} color="#a78bfa" />
        <pointLight position={[0, 3, -1]} intensity={0.6} color="#ffffff" />

        <Suspense fallback={null}>
          <ClassroomEnvironment />
          <FloatingParticles />
          <SpeakingRing isSpeaking={isSpeaking} />
          <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.08}>
            <AvatarModel avatarState={avatarState} isSpeaking={isSpeaking} />
          </Float>
          <ContactShadows position={[0, -1.54, 0]} opacity={0.5} scale={3} blur={2} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* Connecting overlay */}
      <AnimatePresence>
        {isCalling && !isLiveConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-indigo-300 font-medium tracking-widest uppercase">Connecting...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Not calling overlay */}
      <AnimatePresence>
        {!isCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
          >
            <div className="text-4xl mb-1">👨‍🏫</div>
            <span className="text-sm font-semibold text-white">Mr.Pe</span>
            <span className="text-xs text-indigo-300 tracking-wide">พร้อมสอนเมื่อคุณโทร</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
