import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function AdminProducts() {
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    imagesStr: "",
    videosStr: "",
    category: "",
    stock: "",
    averageRating: 4.5
  });
  const [specificationsList, setSpecificationsList] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (!userInfo || userInfo.user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [userInfo, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        API.get("/products"),
        API.get("/categories")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      alert("Failed to load products/categories");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Specs List Handlers
  const handleAddSpecRow = () => {
    setSpecificationsList([...specificationsList, { group: "General", name: "", value: "" }]);
  };

  const handleSpecChange = (index, field, value) => {
    const updated = [...specificationsList];
    updated[index][field] = value;
    setSpecificationsList(updated);
  };

  const handleRemoveSpecRow = (index) => {
    const updated = specificationsList.filter((_, i) => i !== index);
    setSpecificationsList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Process comma-separated strings to arrays
      const images = formData.imagesStr
        ? formData.imagesStr.split(",").map(url => url.trim()).filter(url => url !== "")
        : [];
      const videos = formData.videosStr
        ? formData.videosStr.split(",").map(url => url.trim()).filter(url => url !== "")
        : [];

      // Filter empty specifications
      const specifications = specificationsList.filter(spec => spec.name.trim() !== "");

      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        images,
        videos,
        specifications
      };

      if (editId) {
        await API.put(`/products/${editId}`, payload);
        alert("Product updated successfully!");
      } else {
        await API.post("/products", payload);
        alert("Product added successfully!");
      }
      setShowForm(false);
      setEditId(null);
      setSpecificationsList([]);
      setFormData({
        name: "", description: "", price: "", image: "", imagesStr: "", videosStr: "", category: "", stock: "", averageRating: 4.5
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving product. Please check inputs.");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      imagesStr: product.images ? product.images.join(", ") : "",
      videosStr: product.videos ? product.videos.join(", ") : "",
      category: product.category?._id || "",
      stock: product.stock,
      averageRating: product.averageRating || 4.5
    });
    setSpecificationsList(product.specifications || []);
    setEditId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await API.delete(`/products/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete product");
      }
    }
  };

  if (loading) return <h2 style={{ textAlign: "center", padding: "50px" }}>Loading Product Management...</h2>;

  return (
    <div className="admin-page">
      <div className="admin-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Manage Products</h1>
          <p>Add, edit, or delete items from the catalog.</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setSpecificationsList([]);
            setFormData({ name: "", description: "", price: "", image: "", imagesStr: "", videosStr: "", category: "", stock: "", averageRating: 4.5 });
          }}
          className="admin-btn-primary"
        >
          {showForm ? "Cancel" : "➕ Add New Product"}
        </button>
      </div>

      {showForm && (
        <div className="admin-form-container" style={{ background: "#f8fafc", padding: "25px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ marginBottom: "15px" }}>{editId ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit} className="admin-form" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleInputChange} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} rows="3" required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            <input type="number" name="price" placeholder="Price (₹)" value={formData.price} onChange={handleInputChange} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            <input type="text" name="image" placeholder="Main Image URL" value={formData.image} onChange={handleInputChange} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            
            <input type="text" name="imagesStr" placeholder="Additional Gallery Image URLs (comma separated)" value={formData.imagesStr} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            <input type="text" name="videosStr" placeholder="Product Video URLs (comma separated MP4 or Youtube links)" value={formData.videosStr} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            
            <select name="category" value={formData.category} onChange={handleInputChange} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
              <option value="" disabled>Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            
            <input type="number" name="stock" placeholder="Stock Quantity" value={formData.stock} onChange={handleInputChange} required style={{ padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
            
            {/* Custom Specifications Section */}
            <div style={{ marginTop: "10px", padding: "15px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Product Specifications
                <button type="button" onClick={handleAddSpecRow} style={{ padding: "4px 8px", background: "#2874f0", color: "white", border: "none", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>
                  ＋ Add Spec Row
                </button>
              </h4>
              
              {specificationsList.map((spec, index) => (
                <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input type="text" placeholder="Group (e.g. General, Display)" value={spec.group} onChange={(e) => handleSpecChange(index, "group", e.target.value)} style={{ flex: 1, padding: "6px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                  <input type="text" placeholder="Spec Name (e.g. Brand, Color)" value={spec.name} onChange={(e) => handleSpecChange(index, "name", e.target.value)} required style={{ flex: 1, padding: "6px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                  <input type="text" placeholder="Value (e.g. Apple, Blue)" value={spec.value} onChange={(e) => handleSpecChange(index, "value", e.target.value)} required style={{ flex: 1.5, padding: "6px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid #cbd5e1" }} />
                  <button type="button" onClick={() => handleRemoveSpecRow(index)} style={{ padding: "0 8px", background: "#d32f2f", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    ✖
                  </button>
                </div>
              ))}
              
              {specificationsList.length === 0 && (
                <p style={{ color: "#878787", fontSize: "0.85rem", textAlign: "center", padding: "10px 0" }}>No custom specs added. Category defaults will be used.</p>
              )}
            </div>

            <button type="submit" className="admin-btn-success" style={{ padding: "12px", background: "#388e3c", color: "white", border: "none", borderRadius: "4px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" }}>
              {editId ? "Update Product" : "Save Product"}
            </button>
          </form>
        </div>
      )}

      <div className="recent-orders">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td><img src={product.image} alt={product.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }} /></td>
                <td>{product.name}</td>
                <td>₹{product.price}</td>
                <td style={{ textTransform: "capitalize" }}>{product.category?.name || "Uncategorized"}</td>
                <td>{product.stock}</td>
                <td>
                  <button onClick={() => handleEdit(product)} className="admin-btn-edit">Edit</button>
                  <button onClick={() => handleDelete(product._id)} className="admin-btn-delete" style={{ marginLeft: "10px" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminProducts;
