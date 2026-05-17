import React, { JSX } from 'react';

// Define the types for the props using an interface
interface HeadingProps {
  level: number; // Expecting a number for the 'level' prop (1-6)
  children: React.ReactNode; // 'children' can be any React node (string, number, JSX, etc.)
  className?: string; // 'className' is optional and should be a string
}

const Heading: React.FC<HeadingProps> = ({ level, children, className = '' }) => {
  // Set the appropriate HTML heading tag based on the 'level' prop
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className={`text-3xl font-bold p-3 ${className}`}>
      {children}
    </Tag>
  );
};

export default Heading;
