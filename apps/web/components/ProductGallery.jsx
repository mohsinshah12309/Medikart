"use client";

import React, { useState } from 'react';

export default function ProductGallery({ images = [], fallback = "http://localhost:5000/uploads/placeholder.webp" }) {
  const [activeImage, setActiveImage] = useState(images[0]?.path || fallback);

  const getFullUrl = (path) => {
    if (!path) return fallback;
    return path.startsWith('http') ? path : `http://localhost:5000${path}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Active Image */}
      <div className="aspect-square bg-gray-50 border border-gray-100 rounded-lg p-6 flex items-center justify-center relative overflow-hidden">
        <img
          src={getFullUrl(activeImage)}
          alt="Product detail"
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.target.src = fallback;
          }}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => {
            const isSelected = img.path === activeImage;
            return (
              <button
                key={img._id || index}
                onClick={() => setActiveImage(img.path)}
                className={`w-16 h-16 flex-shrink-0 border rounded-md p-1 bg-white hover:border-green-500 transition-colors ${
                  isSelected ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-200'
                }`}
              >
                <img
                  src={getFullUrl(img.path)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = fallback;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
