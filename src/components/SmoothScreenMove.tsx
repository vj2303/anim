import React, { useEffect, useRef } from "react";

const SmoothScreenMove = ({ children, style = {} }) => {
  const containerRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      // Calculate offset from center, normalized between -1 and 1
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      // Scale down for even more subtle movement
      target.current.x = x * 20; // max 10px left/right
      target.current.y = y * 20; // max 10px up/down
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame;
    const animate = () => {
      // Lerp for extra smoothness
      current.current.x += (target.current.x - current.current.x) * 0.05;
      current.current.y += (target.current.y - current.current.y) * 0.05;
      if (containerRef.current) {
        containerRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`;
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        willChange: "transform",
        transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default SmoothScreenMove;