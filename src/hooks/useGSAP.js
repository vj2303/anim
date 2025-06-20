import { useEffect } from 'react';

export function useGSAP() {
  useEffect(() => {
    // Load GSAP from CDN
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