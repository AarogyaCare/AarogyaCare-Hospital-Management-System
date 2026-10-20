import React from 'react';
import { useLocation } from 'react-router-dom';

type PlaceholderProps = {
  name?: string;
};

const Placeholder: React.FC<PlaceholderProps> = ({ name }) => {
  const location = useLocation();
  const title = name || location.pathname.replace(/^\//, '').replace(/-/g, ' ') || 'Page';
  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-4 bg-mist-blue">
      <h1 className="text-4xl font-bold text-primary mb-4">{title}</h1>
      <p className="text-gray-600">This page is under construction.</p>
    </div>
  );
};

export default Placeholder;
