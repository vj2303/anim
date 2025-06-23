import { useEffect } from 'react';

declare global {
  interface Window {
    gsap?: {
      to: (target: any, vars: any) => any;
      from: (target: any, vars: any) => any;
      fromTo: (target: any, fromVars: any, toVars: any) => any;
      set: (target: any, vars: any) => any;
      killTweensOf: (target: any) => void;
      timeline: () => any;
    };
  }
}

export function useGSAP() {
  useEffect(() => {
    // Load GSAP from CDN if not already loaded
    if (!window.gsap) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
      script.onload = () => {
        console.log('GSAP loaded successfully');
      };
      document.head.appendChild(script);
    }
  }, []);
} 