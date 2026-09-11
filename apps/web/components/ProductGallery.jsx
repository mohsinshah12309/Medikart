"use client";

import React, { useState, Component } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

class ThreeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("3D Viewer Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3 bg-slate-50 rounded-2xl border border-slate-200 aspect-square">
          <span className="text-3xl">🌐</span>
          <h4 className="text-xs font-bold text-slate-800">3D Interactive Preview Unavailable</h4>
          <p className="text-[11px] text-slate-500 max-w-xs">
            Hardware acceleration or WebGL is currently limited in your browser.
          </p>
          <button
            type="button"
            onClick={this.props.onFallback}
            className="mt-1 px-4 py-1.5 bg-yellow-400 font-bold text-xs text-slate-950 rounded-xl shadow-xs cursor-pointer"
          >
            ← View Standard Photo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  fallback = "/uploads/placeholder.webp" 
}) {
  const [activeImage, setActiveImage] = useState(images[0]?.path || fallback);
  const [viewMode, setViewMode] = useState("2d"); // "2d" or "3d"
  const [imgError, setImgError] = useState(false);

  const getFullUrl = (path) => {
    if (!path || path === "/images/placeholder-product.png" || imgError) {
      return fallback;
    }
    return path.startsWith('http') || path.startsWith('/') ? path : `http://localhost:5000${path}`;
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
          <ThreeErrorBoundary onFallback={() => setViewMode("2d")}>
            <Product3DViewer 
              productName={productName} 
              imageUrl={getFullUrl(activeImage)} 
            />
          </ThreeErrorBoundary>
        </div>
      ) : (
        <>
          {/* Active 2D Image */}
          <div className="aspect-square bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden shadow-sm">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={getFullUrl(activeImage)}
                alt={productName}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-contain p-4 transition-transform duration-300 hover:scale-105"
                onError={() => {
                  setImgError(true);
                }}
              />
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {images.map((img, index) => {
                const isSelected = img.path === activeImage;
                const thumbUrl = img.path?.startsWith('http') ? img.path : `http://localhost:5000${img.path}`;
                return (
                  <button
                    key={img._id || index}
                    onClick={() => {
                      setImgError(false);
                      setActiveImage(img.path);
                    }}
                    className={`w-16 h-16 flex-shrink-0 border rounded-xl p-1.5 bg-white hover:border-yellow-400 transition-all cursor-pointer relative ${
                      isSelected ? 'border-yellow-500 ring-2 ring-yellow-400/30' : 'border-slate-200'
                    }`}
                  >
                    <Image
                      src={thumbUrl || fallback}
                      alt={`${productName} Thumbnail ${index + 1}`}
                      fill
                      sizes="64px"
                      loading="lazy"
                      className="object-contain p-1"
                      onError={(e) => {
                        e.currentTarget.src = fallback;
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
