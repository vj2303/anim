import React, { useRef, useEffect, ReactNode } from "react";

interface Parallax3DSpaceProps {
  children: ReactNode;
  maxOffset?: number;
}

const Parallax3DSpace: React.FC<Parallax3DSpaceProps> = ({ children, maxOffset = 20 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

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
    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      if (ref.current) {
        ref.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

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
        transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "auto",
      }}
    >
      {children}
    </div>
  );
};

export default Parallax3DSpace;