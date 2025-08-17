import React, { memo } from "react";
import { Handle, Position, NodeProps, useViewport } from "reactflow";

const CharacterNode = ({
  data,
}: NodeProps<{ label: string; avatar?: string }>) => {
  const { zoom } = useViewport();

  const isVisible = zoom >= 0.6;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div
        className="
          w-24 h-24 rounded-full bg-white border-2 border-blue-500 
          flex items-center justify-center text-center p-2 shadow-lg
        "
        style={{
          // Add a subtle scaling effect for very small nodes to keep them visible
          transform: `scale(${Math.max(zoom, 0.5) / zoom})`,
        }}
      >
        {data.avatar && isVisible ? (
          <img
            src={data.avatar}
            alt={data.label}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div
            className="text-sm font-bold"
            style={{ fontSize: isVisible ? "12px" : "18px" }}
          >
            {/* Show initials or a shorter name when zoomed out */}
            {isVisible ? data.label : data.label.substring(0, 1)}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
      />
    </>
  );
};

export default memo(CharacterNode);
