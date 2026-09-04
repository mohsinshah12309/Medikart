import React, { useState, useEffect } from "react";
import { adminFetch } from "../apiClient";

const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`;

function Products({ token }) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  // List State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");

  // Modals Visibility
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Selected Product for Image/Discount operations
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form States — Product Create/Edit
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    description: "",
    categoryId: "",
    isNarcotic: false,
    stockStatus: "in_stock",
    active: true,
  });
  const [formFiles, setFormFiles] = useState([]);

  // Form States — Discount Edit
  const [discountData, setDiscountData] = useState({
    value: 0,
    active: false,
  });

  // Selected files for upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    fetchProducts(1);
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [selectedCategoryFilter]);

  const fetchProducts = async (pageOverride = page) => {
    try {
      setLoading(true);
      let queryParams = [];
      queryParams.push(`page=${pageOverride}`);
      queryParams.push(`limit=${limit}`);
      if (searchQuery) {
        queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      if (selectedCategoryFilter) {
        queryParams.push(`categoryId=${selectedCategoryFilter}`);
      }

      const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";
      const data = await adminFetch(`/admin/products${queryString}`);
      setProducts(data.data?.products || []);
      setTotal(data.pagination?.total || 0);
      setPages(data.pagination?.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminFetch("/admin/categories");
      setCategories(data.data.categories || []);
    } catch (err) {
      console.error("Error fetching categories:", err.message);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({
      name: "",
      sku: "",
      price: "",
      description: "",
      categoryId: categories[0]?._id || "",
      isNarcotic: false,
      stockStatus: "in_stock",
      active: true,
    });
    setFormFiles([]);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setIsEditMode(true);
    setEditId(product._id);
    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      price: product.price || "",
      description: product.description || "",
      categoryId: product.categoryIds?.[0]?._id || product.categoryIds?.[0] || "",
      isNarcotic: !!product.isNarcotic,
      stockStatus: product.stockStatus || "in_stock",
      active: product.active !== false,
    });
    setFormFiles([]);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const payload = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price),
      description: formData.description,
      categoryIds: formData.categoryId ? [formData.categoryId] : [],
      isNarcotic: formData.isNarcotic,
      stockStatus: formData.stockStatus,
      active: formData.active !== false,
    };

    try {
      const url = isEditMode
        ? `${apiUrl}/admin/products/${editId}`
        : `${apiUrl}/admin/products`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Failed to ${isEditMode ? "update" : "create"} product`);
      }

      const newProductId = data._id;
      if (!isEditMode && newProductId && formFiles.length > 0) {
        const imageFormData = new FormData();
        formFiles.forEach((file) => {
          imageFormData.append("images", file);
        });

        const imgRes = await fetch(`${apiUrl}/admin/products/${newProductId}/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageFormData,
        });

        const imgData = await imgRes.json();
        if (!imgRes.ok) {
          throw new Error(imgData.message || "Product created, but image upload failed.");
        }
      }

      setSuccessMsg(`Product successfully ${isEditMode ? "updated" : "created"}!`);
      setIsProductModalOpen(false);
      setFormFiles([]);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${apiUrl}/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete product");

      setSuccessMsg("Product deleted successfully.");
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleNarcotic = async (product) => {
    setError("");
    setSuccessMsg("");
    const newNarcoticState = !product.isNarcotic;

    try {
      const res = await fetch(`${apiUrl}/admin/products/${product._id}/narcotics`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isNarcotic: newNarcoticState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to toggle narcotic status");

      setSuccessMsg(`Narcotics status for ${product.name} updated to ${newNarcoticState ? "ON" : "OFF"}`);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (product) => {
    setError("");
    setSuccessMsg("");
    const newActiveState = product.active === false ? true : false;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, active: newActiveState } : p))
    );

    try {
      const res = await fetch(`${apiUrl}/admin/products/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: newActiveState }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to toggle product status");

      setSuccessMsg(
        `Product "${product.name}" is now ${newActiveState ? "ENABLED (visible on storefront)" : "DISABLED (hidden from storefront)"}.`
      );
    } catch (err) {
      // Revert optimistic update on failure
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, active: product.active } : p))
      );
      setError(err.message);
    }
  };

  const handleOpenDiscountModal = (product) => {
    setSelectedProduct(product);
    setDiscountData({
      value: product.discount?.value || 0,
      active: !!product.discount?.active,
    });
    setIsDiscountModalOpen(true);
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${apiUrl}/admin/products/${selectedProduct._id}/discount`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          value: parseFloat(discountData.value),
          active: discountData.active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update discount");

      setSuccessMsg(`Discount updated for ${selectedProduct.name}`);
      setIsDiscountModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOpenImageModal = (product) => {
    setSelectedProduct(product);
    setSelectedFiles([]);
    setIsImageModalOpen(true);
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUploadImages = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setError("");
    setUploadingImages(true);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await fetch(`${apiUrl}/admin/products/${selectedProduct._id}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload images");

      setSuccessMsg("Images uploaded successfully.");
      const refreshedProduct = data.data.product || await fetchSingleProduct(selectedProduct._id);
      setSelectedProduct(refreshedProduct);
      setSelectedFiles([]);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const fetchSingleProduct = async (id) => {
    const res = await fetch(`${apiUrl}/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.data.product;
  };

  const handleSetPrimaryImage = async (imageId) => {
    setError("");
    try {
      const res = await fetch(`${apiUrl}/admin/products/${selectedProduct._id}/images/${imageId}/primary`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to set primary image");

      setSuccessMsg("Primary cover image updated.");
      const refreshed = data.data.product || await fetchSingleProduct(selectedProduct._id);
      setSelectedProduct(refreshed);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    setError("");

    try {
      const res = await fetch(`${apiUrl}/admin/products/${selectedProduct._id}/images/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete image");

      setSuccessMsg("Image deleted successfully.");
      const refreshed = data.data.product || await fetchSingleProduct(selectedProduct._id);
      setSelectedProduct(refreshed);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const getCategoryName = (product) => {
    const catId = product.categoryIds?.[0]?._id || product.categoryIds?.[0];
    const catObj = categories.find((c) => c._id === catId);
    return catObj ? catObj.name : "N/A";
  };

  const getPrimaryImage = (product) => {
    if (!product.images || product.images.length === 0) return null;
    const primary = product.images.find((img) => img.isPrimary);
    return primary ? primary.path : product.images[0].path;
  };

  const formatPrice = (price) => {
    const num = typeof price === "number" ? price : parseFloat(price || 0);
    if (isNaN(num)) return "0.00 PKR";
    return `${num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR`;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategoryFilter("");
    setPage(1);
    setProducts([]);
    const fetchCleared = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/admin/products?page=1&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch products");
        setProducts(data.data?.products || []);
        setTotal(data.pagination?.total || 0);
        setPages(data.pagination?.pages || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCleared();
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Products</h2>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          + Add Product
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* Search and Category Filter Toolbar */}
      <div className="toolbar-card">
        <div className="toolbar-container">
          {/* Search form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              fetchProducts(1);
            }}
            className="search-box-form"
          >
            <input
              type="text"
              placeholder="Search product by name..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ margin: 0 }}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {/* Category Filter */}
          <div className="filter-controls-group">
            <label htmlFor="cat-filter" className="filter-label-text">
              Filter by Category:
            </label>
            <select
              id="cat-filter"
              className="form-control"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              style={{ margin: 0, minWidth: "170px" }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            {(searchQuery || selectedCategoryFilter) && (
              <button
                onClick={handleClearFilters}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 0.85rem" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ display: "inline-block", width: "24px", height: "24px", border: "3px solid #eab308", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "0.5rem" }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem" }}>Loading products catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "2.5rem" }}>💊</span>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>No Products Found</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem", maxWidth: "400px" }}>
              {searchQuery || selectedCategoryFilter 
                ? "No products match your current search or category filter." 
                : "No products exist in the catalog yet."}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              {(searchQuery || selectedCategoryFilter) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
                onClick={handleOpenCreateModal}
              >
                + Add New Product
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th className="th-preview">Preview</th>
                  <th className="th-name">Name</th>
                  <th className="th-sku">SKU</th>
                  <th className="th-category">Category</th>
                  <th className="th-price">Price</th>
                  <th className="th-status" style={{ textAlign: "center" }}>Status</th>
                  <th className="th-narcotics">Narcotics</th>
                  <th className="th-discount">Discount</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const cover = getPrimaryImage(product);
                  const baseUploadUrl = apiUrl.replace("/api/v1", "");
                  const coverUrl = cover
                    ? cover.startsWith("http")
                      ? cover
                      : `${baseUploadUrl}${cover}`
                    : FALLBACK_IMAGE;

                  return (
                    <tr key={product._id} style={product.active === false ? { opacity: 0.7, backgroundColor: "#fef2f2/20" } : {}}>
                      <td className="td-center">
                        <div className="product-img-wrapper">
                          <img
                            src={coverUrl}
                            alt=""
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = FALLBACK_IMAGE;
                            }}
                          />
                        </div>
                      </td>
                      <td className="product-name-cell">
                        {product.name}
                        {product.active === false && (
                          <span style={{ display: "block", fontSize: "0.7rem", color: "#e11d48", fontWeight: 700 }}>
                            (Hidden on Storefront)
                          </span>
                        )}
                      </td>
                      <td><span className="product-sku-code">{product.sku}</span></td>
                      <td>{getCategoryName(product)}</td>
                      <td className="product-price-cell">{formatPrice(product.price)}</td>
                      <td className="td-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          title={product.active !== false ? "Click to disable product (hide from storefront)" : "Click to enable product (show on storefront)"}
                          style={{
                            padding: "0.25rem 0.65rem",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            borderRadius: "9999px",
                            border: product.active !== false ? "1px solid #86efac" : "1px solid #fca5a5",
                            backgroundColor: product.active !== false ? "#f0fdf4" : "#fef2f2",
                            color: product.active !== false ? "#166534" : "#991b1b",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <span style={{ fontSize: "0.6rem" }}>{product.active !== false ? "●" : "○"}</span>
                          {product.active !== false ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="td-center">
                        <span
                          className={`badge ${product.isNarcotic ? "badge-narcotic" : "badge-secondary"}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleToggleNarcotic(product)}
                          title="Click to toggle Narcotics flag"
                        >
                          {product.isNarcotic ? "Narcotic ⚠️" : "Safe"}
                        </span>
                      </td>
                      <td className="td-center">
                        {product.discount?.active ? (
                          <span className="badge badge-discount">
                            {product.discount.value}% Off
                          </span>
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>None</span>
                        )}
                      </td>
                      <td className="td-right">
                        <div className="action-buttons-flex">
                          <button
                            type="button"
                            className="btn btn-action-sm"
                            style={
                              product.active !== false
                                ? { backgroundColor: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3", fontWeight: 700 }
                                : { backgroundColor: "#fef9c3", color: "#854d0e", borderColor: "#fde047", fontWeight: 700 }
                            }
                            onClick={() => handleToggleActive(product)}
                            title={product.active !== false ? "Disable product from storefront" : "Enable product on storefront"}
                          >
                            {product.active !== false ? "Disable" : "Enable"}
                          </button>
                          <button
                            className="btn btn-secondary btn-action-sm"
                            onClick={() => handleOpenEditModal(product)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-action-sm"
                            onClick={() => handleOpenImageModal(product)}
                          >
                            Images ({product.images?.length || 0})
                          </button>
                          <button
                            className="btn btn-secondary btn-action-sm"
                            onClick={() => handleOpenDiscountModal(product)}
                          >
                            Discount
                          </button>
                          <button
                            className="btn btn-danger btn-action-sm"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <span style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600 }}>
          Showing {products.length} of {total.toLocaleString()} products (Page {page} of {pages})
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            style={{ padding: "0.3rem 0.7rem", fontSize: "0.85rem" }}
            disabled={page <= 1}
            onClick={() => {
              const prev = page - 1;
              setPage(prev);
              fetchProducts(prev);
            }}
          >
            ← Previous
          </button>
          <span style={{ padding: "0 0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
            {page} / {pages}
          </span>
          <button
            className="btn btn-secondary"
            style={{ padding: "0.3rem 0.7rem", fontSize: "0.85rem" }}
            disabled={page >= pages}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              fetchProducts(next);
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditMode ? "Edit Product" : "Create Product"}</h3>
              <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="prod-name">Product Name *</label>
                  <input
                    id="prod-name"
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-sku">SKU *</label>
                  <input
                    id="prod-sku"
                    type="text"
                    className="form-control"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    disabled={isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-price">Price (PKR) *</label>
                  <input
                    id="prod-price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prod-cat">Category *</label>
                  <select
                    id="prod-cat"
                    className="form-control"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="prod-desc">Description</label>
                  <textarea
                    id="prod-desc"
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                {!isEditMode && (
                  <div className="form-group">
                    <label htmlFor="prod-files">Product Pictures (Optional)</label>
                    <input
                      id="prod-files"
                      type="file"
                      className="form-control"
                      multiple
                      accept="image/*"
                      onChange={(e) => setFormFiles(Array.from(e.target.files))}
                    />
                    {formFiles.length > 0 && (
                      <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                        Selected {formFiles.length} file(s)
                      </p>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <div className="switch-group" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", backgroundColor: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
                    <div>
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", display: "block" }}>
                        Storefront Visibility (Product Status)
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {formData.active !== false
                          ? "Enabled — Visible in storefront catalog and search."
                          : "Disabled — Hidden from storefront catalog and search."}
                      </span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.active !== false}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <div className="switch-group">
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#475569" }}>
                      Narcotics Warning / Gate Required
                    </span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formData.isNarcotic}
                        onChange={(e) => setFormData({ ...formData, isNarcotic: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MANAGE IMAGES MODAL --- */}
      {isImageModalOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Manage Images for {selectedProduct.name}</h3>
              <button className="modal-close" onClick={() => setIsImageModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {/* Upload Zone */}
              <form onSubmit={handleUploadImages}>
                <div className="form-group">
                  <label>Upload New Images</label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 0.5rem 0" }}>
                      Selected Files:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
                      {selectedFiles.map((f, i) => (
                        <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={selectedFiles.length === 0 || uploadingImages}
                >
                  {uploadingImages ? "Uploading..." : "Upload Selected Images"}
                </button>
              </form>

              <hr style={{ margin: "1.5rem 0", border: "0", borderTop: "1px solid rgba(20, 184, 166, 0.15)" }} />

              {/* Uploaded Images List */}
              <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: 600, fontSize: "0.9rem", color: "#cbd5e1" }}>
                Current Product Images
              </label>
              {!selectedProduct.images || selectedProduct.images.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No images uploaded yet.</p>
              ) : (
                <div className="image-previews">
                  {selectedProduct.images.map((img) => {
                    const baseUploadUrl = apiUrl.replace("/api/v1", "");
                    const imgUrl = img.path.startsWith("http")
                      ? img.path
                      : `${baseUploadUrl}${img.path}`;

                    return (
                      <div className="image-preview-card" key={img._id}>
                        <img 
                          src={imgUrl} 
                          alt="Product" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMAGE;
                          }}
                        />
                        <div className="image-preview-actions">
                          {img.isPrimary ? (
                            <span className="image-badge-primary">Cover</span>
                          ) : (
                            <button
                              type="button"
                              className="image-btn-primary-set"
                              onClick={() => handleSetPrimaryImage(img._id)}
                            >
                              Make Cover
                            </button>
                          )}
                          <button
                            type="button"
                            className="image-btn-action"
                            onClick={() => handleDeleteImage(img._id)}
                            title="Delete Image"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsImageModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT DISCOUNT MODAL --- */}
      {isDiscountModalOpen && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Manage Discount for {selectedProduct.name}</h3>
              <button className="modal-close" onClick={() => setIsDiscountModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleDiscountSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="disc-val">Discount Percentage (%)</label>
                  <input
                    id="disc-val"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="form-control"
                    value={discountData.value}
                    onChange={(e) => setDiscountData({ ...discountData, value: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <div className="switch-group">
                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#cbd5e1" }}>
                      Activate Discount
                    </span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={discountData.active}
                        onChange={(e) => setDiscountData({ ...discountData, active: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsDiscountModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
