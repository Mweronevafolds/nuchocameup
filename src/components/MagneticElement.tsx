import React, { useRef, useState } from "react";

interface MagneticElementProps {
  children: React.ReactElement;
  amount?: number;
}

export default function MagneticElement({ children, amount = 0.5 }: MagneticElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * amount, y: middleY * amount });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  // Clone the child element to apply the transform style
  const clonedChild = React.cloneElement(children as React.ReactElement, {
    style: {
      ...((children as React.ReactElement).props.style || {}),
      transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      transition: "transform 0.1s ease-out",
    },
  });

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {clonedChild}
    </div>
  );
}
