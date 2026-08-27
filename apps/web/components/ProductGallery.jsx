"use client";

import React, { useState } from 'react';
import Product3DViewer from './3d/Product3DViewer';

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
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            viewMode === "2d"
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 font-semibold'
              : 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          📸 Photo View
        </button>
        <button
          type="button"
          onClick={() => setViewMode("3d")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            viewMode === "3d"
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 font-semibold'
              : 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          🌐 3D Interactive View
        </button>
      </div>

      {/* Active Display Panel */}
      {viewMode === "3d" ? (
        <div className="aspect-square bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
          <Product3DViewer 
            productName={productName} 
            imageUrl={getFullUrl(activeImage)} 
          />
        </div>
      ) : (
        <>
          {/* Active 2D Image */}
          <div className="aspect-square bg-slate-950/20 border border-slate-800/60 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden shadow-inner">
            <img
              src={getFullUrl(activeImage)}
              alt={productName}
              className="max-h-full max-w-full object-contain"
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
                    className={`w-16 h-16 flex-shrink-0 border rounded-xl p-1 bg-slate-900/35 hover:border-teal-500/60 transition-colors ${
                      isSelected ? 'border-teal-650 ring-2 ring-teal-500/10' : 'border-slate-800/80'
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
        </>
      )}
    </div>
  );
}
