
import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Soft Ambient Blobs */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[120px] animate-pulse"
        style={{ animationDuration: '8s' }}
      ></div>
      <div 
        className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-indigo-200/30 blur-[100px] animate-pulse"
        style={{ animationDuration: '12s', animationDelay: '2s' }}
      ></div>
      <div 
        className="absolute top-[20%] right-[10%] w-[25%] h-[25%] rounded-full bg-slate-200/20 blur-[80px] animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '1s' }}
      ></div>

      {/* Subtle Animated Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Radial Gradient for depth */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-white/40 to-white/80"></div>
    </div>
  );
};

export default Background;
