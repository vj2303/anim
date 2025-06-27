'use client';
import Spline from '@splinetool/react-spline';

export default function Spline3DObject({ scene, style, className }) {
  // If you need to fetch data, use useEffect and useState here
  return (
    <div style={style} className={className}>
      <Spline scene={scene} />
    </div>
  );
}