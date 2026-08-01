import { useParams, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect, useRef } from "react";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";

const categoryFallbackSpecs = {
  mobiles: [
    { group: "General", name: "Model Name", value: "Smart Mobile Phone" },
    { group: "General", name: "Color", value: "Dynamic Black" },
    { group: "General", name: "SIM Type", value: "Dual SIM (Nano-SIM)" },
    { group: "Display Features", name: "Display Size", value: "16.76 cm (6.6 inch)" },
    { group: "Display Features", name: "Resolution", value: "2408 x 1080 Pixels" },
    { group: "OS & Processor Features", name: "Operating System", value: "Android 13" },
    { group: "OS & Processor Features", name: "Processor Core", value: "Octa Core" },
    { group: "Memory & Storage Features", name: "Internal Storage", value: "128 GB" },
    { group: "Memory & Storage Features", name: "RAM", value: "6 GB" },
    { group: "Camera Features", name: "Primary Camera", value: "50MP + 2MP Rear Camera" },
    { group: "Camera Features", name: "Secondary Camera", value: "13MP Front Camera" },
    { group: "Warranty", name: "Warranty Summary", value: "1 Year Brand Warranty" }
  ],
  shoes: [
    { group: "General", name: "Type", value: "Sports / Running Shoes" },
    { group: "General", name: "Color", value: "Crimson Red / Space Grey" },
    { group: "Product Details", name: "Outer Material", value: "Premium Breathable Mesh" },
    { group: "Product Details", name: "Sole Material", value: "Responsive EVA Foam & Rubber" },
    { group: "Product Details", name: "Closure", value: "Lace-Up" },
    { group: "Product Details", name: "Weight", value: "290g (Single Shoe)" },
    { group: "Warranty", name: "Warranty Summary", value: "6 Months Brand Warranty against manufacturing defects" }
  ],
  electronics: [
    { group: "General", name: "Device Type", value: "Premium Electronics Gadget" },
    { group: "General", name: "Color", value: "Obsidian Black" },
    { group: "Product Details", name: "Connectivity", value: "Wireless Bluetooth v5.3 & WiFi" },
    { group: "Product Details", name: "Power Source", value: "Rechargeable Li-Polymer Battery" },
    { group: "Warranty", name: "Warranty Summary", value: "1 Year Brand Warranty" }
  ],
  fashion: [
    { group: "General", name: "Type", value: "Premium Apparel" },
    { group: "General", name: "Color", value: "Multi-color Blend" },
    { group: "Product Details", name: "Fabric", value: "100% Ringspun Cotton" },
    { group: "Product Details", name: "Fit", value: "Comfortable Regular Fit" },
    { group: "Product Details", name: "Style", value: "Modern Casual" },
    { group: "Warranty", name: "Warranty Summary", value: "7 Days Easy Replacement Policy" }
  ],
  beauty: [
    { group: "General", name: "Product Type", value: "Organic Skincare/Wellness Solution" },
    { group: "Product Details", name: "Skin Type", value: "All Skin Types Approved" },
    { group: "Product Details", name: "Ingredients", value: "Natural Extracts & Minerals" },
    { group: "Product Details", name: "Organic", value: "Yes" },
    { group: "Warranty", name: "Shelf Life", value: "24 Months from Manufacture Date" }
  ],
  accessories: [
    { group: "General", name: "Type", value: "Premium Lifestyle Accessory" },
    { group: "Product Details", name: "Material", value: "Eco-friendly Synthetics" },
    { group: "Product Details", name: "Water Resistance", value: "Splash-proof" },
    { group: "Warranty", name: "Warranty Summary", value: "6 Months Brand Warranty" }
  ]
};

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { userInfo } = useContext(AuthContext);

  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pincode state
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState(null);

  // New review form state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);

  // Media gallery states
  const [mediaList, setMediaList] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null);

  // Ref for active preview image zoom
  const previewImgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, reviewsRes] = await Promise.all([
          API.get(`/products/${id}`),
          API.get(`/reviews?productId=${id}`)
        ]);

        const prod = prodRes.data;
        setProduct(prod);
        setReviews(reviewsRes.data);

        // Compile media gallery items
        const list = [];
        // 1. Primary image
        if (prod.image) {
          list.push({ type: "image", url: prod.image });
        }
        // 2. Additional images
        if (prod.images && Array.isArray(prod.images)) {
          prod.images.forEach(img => {
            if (img && img !== prod.image && !list.some(item => item.url === img)) {
              list.push({ type: "image", url: img });
            }
          });
        }
        // 3. Videos
        if (prod.videos && Array.isArray(prod.videos)) {
          prod.videos.forEach(vid => {
            if (vid) {
              list.push({ type: "video", url: vid });
            }
          });
        }

        setMediaList(list);
        if (list.length > 0) {
          setActiveMedia(list[0]);
        }

      } catch (err) {
        console.error("Error loading product details page:", err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({ ...product, qty });
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart({ ...product, qty });
      navigate("/checkout");
    }
  };

  // Image Hover Zoom Handler
  const handleMouseMove = (e) => {
    if (previewImgRef.current) {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      previewImgRef.current.style.transformOrigin = `${x}% ${y}%`;
      previewImgRef.current.style.transform = "scale(1.8)";
    }
  };

  const handleMouseLeave = () => {
    if (previewImgRef.current) {
      previewImgRef.current.style.transform = "scale(1)";
      previewImgRef.current.style.transformOrigin = "center center";
    }
  };

  // Check Pincode
  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeResult({
        success: false,
        message: "Please enter a valid 6-digit pincode."
      });
      return;
    }
    // Simulation of pincode delivery check
    const speedOptions = [
      "Delivery by Tomorrow, 11:00 PM | FREE",
      "Delivery in 2 days, Friday | ₹40 (FREE above ₹500)",
      "Delivery in 3-4 days, Monday | FREE",
    ];
    const mockSpeed = speedOptions[Number(pincode) % speedOptions.length];
    setPincodeResult({
      success: true,
      message: mockSpeed,
      cod: Number(pincode) % 2 === 0
    });
  };

  // Submit Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      alert("Please log in to write a review.");
      return;
    }

    try {
      setReviewSubmitLoading(true);
      const payload = {
        user: userInfo.user._id,
        product: id,
        rating: userRating,
        comment: userComment
      };
      
      const { data } = await API.post("/reviews", payload);
      
      // Update local reviews state to include user name
      const newReviewFull = {
        ...data,
        user: {
          _id: userInfo.user._id,
          name: userInfo.user.name
        }
      };

      const updatedReviews = [newReviewFull, ...reviews];
      setReviews(updatedReviews);
      
      // Re-calculate rating
      if (product) {
        const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = (sum / updatedReviews.length).toFixed(1);
        setProduct({ ...product, averageRating: Number(avg) });
      }

      setUserComment("");
      alert("Review posted successfully! Thank you.");
    } catch (err) {
      console.error("Error posting review:", err);
      alert("Failed to submit review.");
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "50px", fontSize: "1.2rem" }}>Loading product details...</p>;
  if (error || !product) return <p style={{ textAlign: "center", marginTop: "50px", color: "red", fontSize: "1.2rem" }}>{error || "Product not found."}</p>;

  // Price calculations
  const oldPrice = Math.round(product.price * 1.35);
  const discount = Math.round(((oldPrice - product.price) / oldPrice) * 100);

  // Ratings calculation
  const totalReviewsCount = reviews.length;
  const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalReviewsCount > 0 ? (ratingSum / totalReviewsCount).toFixed(1) : (product.averageRating || "4.5");

  // Ratings Breakdown percentages
  const starsCount = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (starsCount[r.rating] !== undefined) {
      starsCount[r.rating]++;
    }
  });

  const getBarPercentage = (rating) => {
    if (totalReviewsCount === 0) {
      // Mock defaults so visual bars are present
      const mocks = { 5: 65, 4: 20, 3: 10, 2: 3, 1: 2 };
      return mocks[rating] + "%";
    }
    return Math.round((starsCount[rating] / totalReviewsCount) * 100) + "%";
  };

  // Compile specifications: use product custom specs, or fallback based on category
  const activeCategoryName = product.category?.name?.toLowerCase() || "mobiles";
  const specifications = (product.specifications && product.specifications.length > 0)
    ? product.specifications
    : (categoryFallbackSpecs[activeCategoryName] || categoryFallbackSpecs["mobiles"]);

  // Group specs by group name
  const groupedSpecs = specifications.reduce((acc, item) => {
    const groupName = item.group || "General";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(item);
    return acc;
  }, {});

  return (
    <div className="pd-container">
      {/* LEFT COLUMN: Sticky Media Gallery & Actions */}
      <div className="pd-left">
        <div className="pd-media-gallery">
          {/* Vertical Thumbnails */}
          <div className="pd-thumbnails">
            {mediaList.map((item, idx) => (
              <div
                key={idx}
                className={`pd-thumbnail ${activeMedia?.url === item.url ? "active" : ""}`}
                onClick={() => setActiveMedia(item)}
              >
                {item.type === "image" ? (
                  <img src={item.url} alt={`Thumb ${idx}`} />
                ) : (
                  <>
                    <img src={product.image} alt={`Thumb Video ${idx}`} style={{ opacity: 0.7 }} />
                    <div className="pd-thumbnail-video-overlay">▶</div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Main Media Preview Screen */}
          <div className="pd-main-preview">
            {activeMedia?.type === "image" ? (
              <div
                className="pd-zoom-container"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  ref={previewImgRef}
                  className="pd-zoom-img"
                  src={activeMedia.url}
                  alt={product.name}
                />
              </div>
            ) : (
              <video
                className="pd-main-preview-video"
                src={activeMedia?.url}
                controls
                autoPlay
                muted
                loop
              />
            )}
          </div>
        </div>

        {/* Quantity Selector */}
        {product.stock > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", background: "#f8fafc", padding: "8px 12px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
            <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "#475569" }}>Quantity:</span>
            <select
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: "600", width: "70px" }}
            >
              {[...Array(Math.min(10, product.stock)).keys()].map(x => (
                <option key={x + 1} value={x + 1}>{x + 1}</option>
              ))}
            </select>
          </div>
        )}

        {/* CTA Buttons Under Image */}
        <div className="pd-cta-buttons">
          <button
            className="pd-btn-cart"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            🛒 ADD TO CART
          </button>
          <button
            className="pd-btn-buy"
            onClick={handleBuyNow}
            disabled={product.stock === 0}
          >
            ⚡ BUY NOW
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Full Product Details Scroll */}
      <div className="pd-right">
        {/* Breadcrumb */}
        <div className="pd-breadcrumb">
          <span>Home</span>
          <span style={{ textTransform: "capitalize" }}>{product.category?.name || "Products"}</span>
          <span>{product.name}</span>
        </div>

        {/* Product Title */}
        <h1 style={{ fontWeight: 500 }}>{product.name}</h1>

        {/* Rating Header */}
        <div className="pd-rating-header">
          <span className="pd-badge-green">
            {avgRating} ★
          </span>
          <span className="pd-rating-counts">
            {totalReviewsCount > 0 ? `${totalReviewsCount} Ratings & ${reviews.filter(r => r.comment).length} Reviews` : "8,234 Ratings & 1,452 Reviews (Simulated)"}
          </span>
        </div>

        {/* Pricing Box */}
        <div className="pd-price-wrapper">
          <div className="pd-price-box">
            <span className="price">₹{product.price.toLocaleString("en-IN")}</span>
            <span className="old">₹{oldPrice.toLocaleString("en-IN")}</span>
            <span className="discount">{discount}% off</span>
          </div>
          <p style={{ color: "#388e3c", fontSize: "0.85rem", fontWeight: "600", marginTop: "3px" }}>Inclusive of all taxes</p>
        </div>

        {/* Flipkart style Offers */}
        <div className="pd-offers-wrapper">
          <span className="pd-offers-title">Available Offers</span>
          
          <div className="pd-offer-item">
            <span className="pd-offer-tag">🏷️</span>
            <div className="pd-offer-text">
              <strong>Bank Offer</strong> 10% off on SBI Credit Card Transactions, up to ₹1,500 on orders of ₹5,000 and above <span className="pd-offer-link">T&C</span>
            </div>
          </div>

          <div className="pd-offer-item">
            <span className="pd-offer-tag">🏷️</span>
            <div className="pd-offer-text">
              <strong>Bank Offer</strong> 5% Unlimited Cashback on Flipkart Axis Bank Credit Card <span className="pd-offer-link">T&C</span>
            </div>
          </div>

          <div className="pd-offer-item">
            <span className="pd-offer-tag">🏷️</span>
            <div className="pd-offer-text">
              <strong>Special Price</strong> Get extra 15% off (price inclusive of cashback/coupon) <span className="pd-offer-link">T&C</span>
            </div>
          </div>

          <div className="pd-offer-item">
            <span className="pd-offer-tag">🏷️</span>
            <div className="pd-offer-text">
              <strong>Partner Offer</strong> Sign up for TrendEra Pay Later & get shopping voucher worth up to ₹500 <span className="pd-offer-link">T&C</span>
            </div>
          </div>
        </div>

        {/* Interactive Pincode Checker */}
        <div className="pd-pincode-section">
          <span className="pd-pincode-label">Delivery & Shipping Eligibility</span>
          <form onSubmit={handlePincodeCheck} className="pd-pincode-input-wrapper">
            <input
              type="text"
              placeholder="Enter Delivery Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              maxLength="6"
            />
            <button type="submit" className="pd-pincode-btn">Check</button>
          </form>
          {pincodeResult && (
            <div className="pd-pincode-result">
              {pincodeResult.success ? (
                <div className="pd-pincode-success">
                  <p style={{ color: "#388e3c", fontWeight: "600" }}>✓ {pincodeResult.message}</p>
                  <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "2px" }}>
                    {pincodeResult.cod ? "✔ Cash on Delivery Available" : "✗ Cash on Delivery Not Available"} | 7 Days Replacement Policy
                  </p>
                </div>
              ) : (
                <p className="pd-pincode-error">✗ {pincodeResult.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Description & Features */}
        <div className="pd-section-card">
          <h3 className="pd-section-title">Product Description</h3>
          <p style={{ lineHeight: "1.6", color: "#333", fontSize: "0.95rem" }}>{product.description}</p>
          
          <h3 className="pd-section-title" style={{ marginTop: "20px" }}>Highlights</h3>
          <ul style={{ paddingLeft: "20px", color: "#333", fontSize: "0.95rem", lineHeight: "1.7" }}>
            {product.features && product.features.length > 0 ? (
              product.features.map((feature, i) => <li key={i}>{feature}</li>)
            ) : (
              <>
                <li>Premium Build Quality & materials</li>
                <li>1 Year Official Brand Warranty</li>
                <li>7 Days Easy Replacement Policy</li>
                <li>Cash on Delivery Available</li>
              </>
            )}
          </ul>
        </div>

        {/* Specifications Section (Flipkart Table Style) */}
        <div className="pd-section-card">
          <h3 className="pd-section-title">Specifications</h3>
          {Object.keys(groupedSpecs).map((groupName, idx) => (
            <div className="pd-specs-group" key={idx}>
              <h4 className="pd-specs-group-title">{groupName}</h4>
              <table className="pd-specs-table">
                <tbody>
                  {groupedSpecs[groupName].map((spec, sIdx) => (
                    <tr key={sIdx}>
                      <td className="label-col">{spec.name}</td>
                      <td className="value-col">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Ratings & Reviews Section */}
        <div className="pd-section-card">
          <h3 className="pd-section-title">Ratings & Reviews</h3>
          
          {/* Visual Progress Breakdown */}
          <div className="pd-ratings-breakdown">
            <div className="pd-ratings-average">
              <div className="pd-ratings-average-num">{avgRating}</div>
              <div className="pd-ratings-average-stars">★</div>
              <div className="pd-ratings-average-count">
                {totalReviewsCount > 0 ? `${totalReviewsCount} Reviews` : "8,432 Ratings (Simulated)"}
              </div>
            </div>

            <div className="pd-rating-bars-container">
              {[5, 4, 3, 2, 1].map(num => (
                <div className="pd-rating-bar-row" key={num}>
                  <span className="pd-rating-bar-star">{num} ★</span>
                  <div className="pd-rating-bar-bg">
                    <div
                      className={`pd-rating-bar-fill star-${num}`}
                      style={{ width: getBarPercentage(num) }}
                    />
                  </div>
                  <span className="pd-rating-bar-count">
                    {totalReviewsCount > 0 ? starsCount[num] : getBarPercentage(num)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* List of Reviews */}
          <div className="pd-reviews-list">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div className="pd-review-card" key={rev._id}>
                  <div className="pd-review-top">
                    <span className={`pd-badge-small-green ${rev.rating < 3 ? "low-rating" : ""}`}>
                      {rev.rating} ★
                    </span>
                    <span className="pd-review-title">
                      {rev.rating === 5 ? "Excellent Product" : rev.rating === 4 ? "Very Good Choice" : rev.rating === 3 ? "Good, met expectations" : "Below average"}
                    </span>
                  </div>
                  <p className="pd-review-comment">{rev.comment}</p>
                  <div className="pd-review-footer">
                    <div className="pd-review-user">
                      <strong style={{ color: "#212121" }}>{rev.user?.name || "Verified Customer"}</strong>
                      <span className="pd-review-verified">✔ Certified Buyer</span>
                      <span>• {new Date(rev.createdAt || Date.now()).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="pd-review-actions">
                      <button className="pd-review-action-btn">👍 Helpful (12)</button>
                      <button className="pd-review-action-btn">👎 Dislike (1)</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#878787", padding: "10px 0" }}>No reviews posted yet. Be the first to review this product!</p>
            )}
          </div>

          {/* Add Review Form */}
          <div className="pd-add-review-box">
            <h4>Write a Product Review</h4>
            {userInfo ? (
              <form onSubmit={handleReviewSubmit}>
                <div style={{ marginBottom: "10px", fontSize: "0.9rem" }}>
                  <span style={{ fontWeight: "600", marginRight: "10px" }}>Rate this product:</span>
                  <select
                    value={userRating}
                    onChange={(e) => setUserRating(Number(e.target.value))}
                    style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="5">5 Stars (Excellent)</option>
                    <option value="4">4 Stars (Good)</option>
                    <option value="3">3 Stars (Average)</option>
                    <option value="2">2 Stars (Poor)</option>
                    <option value="1">1 Star (Very Poor)</option>
                  </select>
                </div>

                <textarea
                  className="pd-add-review-textarea"
                  placeholder="Share details of your experience with this product..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  required
                />
                
                <button
                  type="submit"
                  className="pd-add-review-submit-btn"
                  disabled={reviewSubmitLoading}
                >
                  {reviewSubmitLoading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <p style={{ color: "#878787", fontSize: "0.9rem" }}>
                Please <span style={{ color: "#2874f0", cursor: "pointer", fontWeight: "600" }} onClick={() => navigate("/login")}>Login</span> to submit a review.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;