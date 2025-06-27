import React from 'react';

interface AgentDescriptionProps {
  agent: { name: string; description: string } | null;
  open: boolean;
  onClose: () => void;
}

const AgentDescription: React.FC<AgentDescriptionProps> = ({ agent, open, onClose }) => {
  if (!open || !agent) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.55)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(30,30,40,0.98)',
        borderRadius: '18px',
        padding: '36px 32px 28px 32px',
        minWidth: '320px',
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        color: '#fff',
        position: 'relative',
        textAlign: 'center',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: 12,
          right: 16,
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: 22,
          cursor: 'pointer',
          opacity: 0.7,
        }}>&times;</button>
        <div style={{ fontSize: 38, fontWeight: 700, marginBottom: 10, letterSpacing: 0.5 }}>{agent.name}</div>
        <div style={{ fontSize: 16, color: '#b3e5fc', marginBottom: 18 }}>{agent.description}</div>
      </div>
    </div>
  );
};

export default AgentDescription; 