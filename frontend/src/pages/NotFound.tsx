import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-20 bg-mist-blue">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-lg text-gray-700 mb-6">Page not found.</p>
      <Link to="/" className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-container transition">
        Go Home
      </Link>
    </div>
  );
}

