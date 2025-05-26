"use client";

import { cn } from "@/lib/utils";

export function PulseAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-2", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={`pulse-${Date.now()}-${i}`}
          className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export function BounceAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-2", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={`bounce-${Date.now()}-${i}`}
          className="w-3 h-3 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function WaveAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end h-8", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={`wave-${Date.now()}-${i}`}
          className="w-2 mx-0.5 bg-blue-400 rounded-t-full animate-wave"
          style={{
            height: `${(i % 2 === 0 ? 0.6 : 1) * 100}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
