"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Code split Three.js 3D viewer so it is only loaded on user request
const Product3DViewer = dynamic(() => import('./3d/Product3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500 bg-slate-50 aspect-square rounded-2xl">
      <div className="w-9 h-9 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-slate-700">Loading 3D Experience...</span>
    </div>
  ),
});

export default function ProductGallery({ 
  images = [], 
  productName = "Product Showcase",
  fallback = "http://localhost:5000/uploads/placeholder.webp" 
}) {
  const [activeImage, setActiveImage] = useState(images[0]?.path || fallback);
  const [viewMode, setViewMode] = useState("2d"); // "2d" or "3d"

  const getFullUrl = (path) => {
    if (!path || path === "/images/placeholder-product.png") {
      return fallback;
    }
    return path.startsWith('http') ? path : `http://localhost:5000${path}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 2D / 3D Toggle Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode("2d")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            viewMode === "2d"
              ? 'bg-yellow-400 border-yellow-500 text-slate-950 shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          📸 Photo View
        </button>
        <button
          type="button"
          onClick={() => setViewMode("3d")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            viewMode === "3d"
              ? 'bg-yellow-400 border-yellow-500 text-slate-950 shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          🌐 3D Interactive View
        </button>
      </div>

      {/* Active Display Panel */}
      {viewMode === "3d" ? (
        <div className="aspect-square bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-sm">
          <Product3DViewer 
            productName={productName} 
            imageUrl={getFullUrl(activeImage)} 
          />
        </div>
      ) : (
        <>
          {/* Active 2D Image */}
          <div className="aspect-square bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden shadow-sm">
            <img
              src={getFullUrl(activeImage)}
              alt={productName}
              loading="eager"
              className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                e.target.src = fallback;
              }}
            />
          </div>

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {images.map((img, index) => {
                const isSelected = img.path === activeImage;
                return (
                  <button
                    key={img._id || index}
                    onClick={() => setActiveImage(img.path)}
                    className={`w-16 h-16 flex-shrink-0 border rounded-xl p-1.5 bg-white hover:border-yellow-400 transition-all cursor-pointer ${
                      isSelected ? 'border-yellow-500 ring-2 ring-yellow-400/30' : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={getFullUrl(img.path)}
                      alt={`Thumbnail ${index + 1}`}
                      loading="lazy"
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
        </>
      )}
    </div>
  );
}
