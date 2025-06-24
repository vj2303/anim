import React, { useRef, useEffect, ReactNode } from "react";

interface Parallax3DSpaceProps {
  children: ReactNode;
  maxOffset?: number;
}

const Parallax3DSpace: React.FC<Parallax3DSpaceProps> = ({ children, maxOffset = 20 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      target.current.x = x * maxOffset;
      target.current.y = y * maxOffset;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame: number;
    const animate = (currentTime: number) => {
      // Enhanced smooth interpolation with delta time
      const deltaTime = currentTime - lastTime.current;
      const smoothingFactor = Math.min(deltaTime / 16, 1) * 0.06; // Adaptive smoothing
      
      current.current.x += (target.current.x - current.current.x) * smoothingFactor;
      current.current.y += (target.current.y - current.current.y) * smoothingFactor;
      
      if (ref.current) {
        // Use transform3d for hardware acceleration
        ref.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }
      
      lastTime.current = currentTime;
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, [maxOffset]);

  return (
    <div
      ref={ref}
      style={{
        willChange: "transform",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "auto",
        backfaceVisibility: "hidden", // Performance optimization
        perspective: "1000px", // Enable 3D transforms
      }}
    >
      {children}
    </div>
  );
};

export default Parallax3DSpace;