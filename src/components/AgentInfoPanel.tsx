import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface AgentInfoPanelProps {
  agent: { name: string; description: string } | null;
  open: boolean;
  onClose: () => void;
}

const AgentInfoPanel: React.FC<AgentInfoPanelProps> = ({ agent, open, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && panelRef.current) {
      gsap.to(panelRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power4.out',
        rotateY: 0,
        pointerEvents: 'auto',
      });
    } else if (panelRef.current) {
      gsap.to(panelRef.current, {
        x: 500,
        opacity: 0,
        duration: 0.5,
        ease: 'power4.in',
        rotateY: 45,
        pointerEvents: 'none',
      });
    }
  }, [open]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '380px',
        height: '100vh',
        background: 'linear-gradient(135deg, #23243a 60%, #1a1b2b 100%)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
        color: '#fff',
        zIndex: 3000,
        transform: 'translateX(500px) rotateY(45deg)',
        opacity: 0,
        pointerEvents: open ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px 32px 32px',
        borderTopLeftRadius: '32px',
        borderBottomLeftRadius: '32px',
        transition: 'box-shadow 0.3s',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 24,
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: 28,
          cursor: 'pointer',
          opacity: 0.7,
        }}
        aria-label="Close agent info"
      >
        &times;
      </button>
      {agent && (
        <>
          <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 18, letterSpacing: 0.5, textShadow: '0 2px 12px #0008' }}>{agent.name}</div>
          <div style={{ fontSize: 20, color: '#b3e5fc', marginBottom: 28, textAlign: 'center', textShadow: '0 1px 8px #0006' }}>{agent.description}</div>
        </>
      )}
    </div>
  );
};

export default AgentInfoPanel; 