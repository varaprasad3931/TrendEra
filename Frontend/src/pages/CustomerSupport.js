import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";

function CustomerSupport() {
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState("bot");

  // Orders State (for tracking and chat)
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ==========================================
  // 1. LIVE CHAT BOT STATES & HANDLERS
  // ==========================================
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hello! Welcome to TrendEra Virtual Assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showActions: true,
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [chatMode, setChatMode] = useState("bot"); // bot or human
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isBotTyping]);

  // Fetch orders if logged in
  useEffect(() => {
    if (userInfo) {
      setLoadingOrders(true);
      API.get("/orders/myorders")
        .then(({ data }) => setOrders(data))
        .catch(err => console.error("Error fetching orders:", err))
        .finally(() => setLoadingOrders(false));
    }
  }, [userInfo]);

  const addChatMessage = (sender, text, extra = {}) => {
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...extra
      }
    ]);
  };

  const handleBotQuickAction = async (actionType, data = null) => {
    if (!userInfo) {
      addChatMessage("bot", "Please login to access this feature.");
      return;
    }

    if (actionType === "track_orders") {
      addChatMessage("user", "I want to track an order");
      setIsBotTyping(true);

      setTimeout(() => {
        setIsBotTyping(false);
        if (orders.length === 0) {
          addChatMessage("bot", "You haven't placed any orders yet. Would you like to check out our products?", {
            showActions: false,
            suggestions: ["Browse Products"]
          });
        } else {
          addChatMessage("bot", "Select which order you want to track:", {
            showActions: false,
            ordersList: orders
          });
        }
      }, 1000);
    } 
    
    else if (actionType === "select_track_order") {
      const order = data;
      addChatMessage("user", `Track Order #${order._id.slice(-6).toUpperCase()}`);
      setIsBotTyping(true);

      setTimeout(() => {
        setIsBotTyping(false);
        addChatMessage("bot", `Here is the live status for Order #${order._id.slice(-6).toUpperCase()}:`, {
          showActions: false,
          embeddedTracking: order
        });
      }, 1200);
    }

    else if (actionType === "cancel_orders_list") {
      addChatMessage("user", "I want to cancel an order");
      setIsBotTyping(true);

      setTimeout(() => {
        setIsBotTyping(false);
        const cancellable = orders.filter(o => o.orderStatus === "Pending" || o.orderStatus === "Processing");
        if (cancellable.length === 0) {
          addChatMessage("bot", "You don't have any pending or processing orders that can be cancelled at this time. If you have concerns about a shipped order, you can contact an agent.", {
            showActions: true
          });
        } else {
          addChatMessage("bot", "Select the order you wish to cancel:", {
            showActions: false,
            cancellableList: cancellable
          });
        }
      }, 1000);
    }

    else if (actionType === "execute_cancel_order") {
      const orderId = data;
      addChatMessage("user", `Cancel Order #${orderId.slice(-6).toUpperCase()}`);
      setIsBotTyping(true);

      try {
        await API.put(`/orders/${orderId}/cancel`);
        // Refresh orders list
        const { data: updatedOrders } = await API.get("/orders/myorders");
        setOrders(updatedOrders);

        setTimeout(() => {
          setIsBotTyping(false);
          addChatMessage("bot", `Order #${orderId.slice(-6).toUpperCase()} has been successfully cancelled. A refund of the amount will be processed back to the payment method within 5-7 business days.`, {
            showActions: true
          });
        }, 1500);
      } catch (err) {
        setTimeout(() => {
          setIsBotTyping(false);
          addChatMessage("bot", err.response?.data?.message || "Failed to cancel order. It might have already shipped.", {
            showActions: true
          });
        }, 1000);
      }
    }

    else if (actionType === "talk_agent") {
      addChatMessage("user", "Connect me to an agent");
      setIsBotTyping(true);

      setTimeout(() => {
        setIsBotTyping(false);
        setChatMode("human");
        addChatMessage("bot", "Connecting to a live TrendEra customer service representative...");
        
        setIsBotTyping(true);
        setTimeout(() => {
          setIsBotTyping(false);
          addChatMessage("support", "Hello! I am Alex from TrendEra support team. I have opened your profile. How can I assist you with your orders or account today?");
        }, 1500);
      }, 1000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQuery = chatInput;
    addChatMessage("user", userQuery);
    setChatInput("");
    setIsBotTyping(true);

    if (chatMode === "bot") {
      // Chatbot parsing
      setTimeout(() => {
        setIsBotTyping(false);
        const lower = userQuery.toLowerCase();
        
        if (lower.includes("track") || lower.includes("status")) {
          addChatMessage("bot", "Sure! I can help you track your shipments. Please click 'Track My Orders' below:", {
            showActions: true
          });
        } else if (lower.includes("cancel")) {
          addChatMessage("bot", "If you want to cancel a recent order, please choose 'Cancel An Order' below:", {
            showActions: true
          });
        } else if (lower.includes("refund") || lower.includes("money")) {
          addChatMessage("bot", "Refunds are processed automatically when orders are cancelled or returned. It generally takes 5-7 working days. Would you like to talk to an agent for specific details?", {
            suggestions: ["Talk to Agent", "Cancel An Order"]
          });
        } else {
          addChatMessage("bot", "I didn't quite catch that. Would you like me to connect you to a support specialist, or choose from one of the quick options below?", {
            showActions: true
          });
        }
      }, 1200);
    } else {
      // Simulated live human representative replies
      setTimeout(() => {
        setIsBotTyping(false);
        const lower = userQuery.toLowerCase();
        let agentReply = "I understand your concern. Let me pull up your account records to check this details. Could you give me 1-2 minutes?";

        if (lower.includes("refund") || lower.includes("money")) {
          agentReply = "I've checked our system, and your refund request is already processing. You will receive it in your bank account in 2-3 business days. Is there anything else I can assist you with?";
        } else if (lower.includes("delivery") || lower.includes("late") || lower.includes("where")) {
          agentReply = "Your recent order is currently in transit with our courier partner. It is scheduled for delivery today by 8:00 PM. You can view the live progress of the driver in the 'Live Tracking Map' tab above!";
        } else if (lower.includes("thank") || lower.includes("bye")) {
          agentReply = "You're very welcome! Thank you for choosing TrendEra. Have a wonderful day!";
        }

        addChatMessage("support", agentReply);
      }, 2000);
    }
  };

  // ==========================================
  // 2. LIVE TRACKING TAB STATES & HANDLERS
  // ==========================================
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [mapEta, setMapEta] = useState(15);
    const [liveLogs, setLiveLogs] = useState([]);

  // Live map animation tick
  useEffect(() => {
    let interval = null;
    if (trackingOrder && activeTab === "track") {
      setMapEta(15);
      
      const timestamps = [
        { time: "09:30 AM", text: "Order Packed & Verified in TrendEra Hub" },
        { time: "11:15 AM", text: "In Transit: Handed over to Express Courier Delivery" },
        { time: "02:40 PM", text: "Arrived at Local Delivery Station" },
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: "Out for Delivery: Courier agent Vikram Singh is on his way to your home" }
      ];
      setLiveLogs(timestamps);

      let counter = 0;
      interval = setInterval(() => {
        setMapEta(prev => {
          const next = prev - 1;
          return next <= 1 ? 2 : next;
        });
        
        counter += 1;
        if (counter === 15) {
          setLiveLogs(prev => [
            { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: "Courier agent is 500 meters away. Please prepare to receive the package." },
            ...prev
          ]);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [trackingOrder, activeTab]);

  // ==========================================
  // 3. SUPPORT TICKET SYSTEM STATES & HANDLERS
  // ==========================================
  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    message: ""
  });
  const [ticketError, setTicketError] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Drawer overlay state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!userInfo) return;
    setLoadingTickets(true);
    try {
      const { data } = await API.get("/support/tickets");
      setTickets(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchTickets();
    }
  }, [activeTab, fetchTickets]);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      return setTicketError("You must be logged in to submit a ticket.");
    }
    setTicketError("");
    setTicketSuccess("");

    try {
      await API.post("/support/tickets", {
        name: userInfo.user.name,
        email: userInfo.user.email,
        subject: ticketForm.subject,
        message: ticketForm.message
      });

      setTicketSuccess("Support ticket submitted successfully! Checking updates...");
      setTicketForm({ subject: "", message: "" });
      
      // Reload tickets after delay to show bot reply
      setTimeout(() => {
        fetchTickets();
      }, 2000);

    } catch (err) {
      setTicketError(err.response?.data?.message || "Failed to submit ticket.");
    }
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim() || sendingReply) return;
    setSendingReply(true);

    try {
      const { data } = await API.post(`/support/tickets/${selectedTicket._id}/reply`, {
        text: ticketReplyText
      });
      setSelectedTicket(data.ticket);
      setTicketReplyText("");
      
      // Reload details after 2.5 seconds to pull simulated support reply
      setTimeout(async () => {
        const { data: refreshed } = await API.get("/support/tickets");
        setTickets(refreshed);
        const current = refreshed.find(t => t._id === selectedTicket._id);
        if (current) setSelectedTicket(current);
      }, 2500);

    } catch (err) {
      console.error("Failed to reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  // ==========================================
  // 4. FAQS INTERACTIVE ACCORDION
  // ==========================================
  const [expandedFaq, setExpandedFaq] = useState(null);
  const faqsList = [
    { id: 1, q: "How can I track my order?", a: "Go to the 'Live Tracking Map' tab on this page or go to your Orders page and click 'Track Order'. We show live vehicle movements for active shipments." },
    { id: 2, q: "What is your refund policy?", a: "Refunds are processed immediately after order cancellation. If you are returning an item, the refund is initiated once the courier picks it up and inspects it at our hub (takes 5-7 business days)." },
    { id: 3, q: "Can I cancel my order after it has shipped?", a: "Unfortunately, orders cannot be cancelled once they have been handed over to the delivery courier ('Shipped' status). However, you can reject delivery or start a return request within 7 days." },
    { id: 4, q: "Are payments secure on TrendEra?", a: "Yes. All transactions are fully encrypted using industry-standard SSL protocols. We do not store raw card numbers, ensuring premium banking protection." }
  ];

  return (
    <div className="support-suite-container">
      {/* Header Banner */}
      <div className="support-header">
        <h1>Premium Customer Support Suite</h1>
        <p>
          Need assistance? Our secure, high-tech customer service center is available 24/7.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="support-tabs">
        <button
          className={`support-tab-btn ${activeTab === "bot" ? "active" : ""}`}
          onClick={() => setActiveTab("bot")}
        >
          💬 Live Support Chat
        </button>
        <button
          className={`support-tab-btn ${activeTab === "track" ? "active" : ""}`}
          onClick={() => setActiveTab("track")}
        >
          📦 Live Tracking Map
        </button>
        <button
          className={`support-tab-btn ${activeTab === "tickets" ? "active" : ""}`}
          onClick={() => setActiveTab("tickets")}
        >
          🎟️ Support Tickets
        </button>
        <button
          className={`support-tab-btn ${activeTab === "faqs" ? "active" : ""}`}
          onClick={() => setActiveTab("faqs")}
        >
          ❓ Help & FAQs
        </button>
      </div>

      {/* TAB 1: LIVE CHAT ASSISTANT */}
      {activeTab === "bot" && (
        <div className="chat-assistant-card">
          <div className="chat-header">
            <div className="chat-bot-avatar">🤖</div>
            <div className="chat-header-info">
              <h3>TrendEra Help Assistant</h3>
              <p>
                <span className="status-dot"></span> 
                {chatMode === "bot" ? "Automated Help Bot" : "Connected to Support (Alex)"}
              </p>
            </div>
          </div>

          <div className="chat-messages">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                <div>{msg.text}</div>
                
                {/* Embed Order Tracking details inside chat if requested */}
                {msg.embeddedTracking && (
                  <div style={{
                    marginTop: "10px",
                    background: "rgba(241, 245, 249, 0.9)",
                    padding: "10px",
                    borderRadius: "10px",
                    borderLeft: "4px solid #2563eb",
                    fontSize: "12px",
                    color: "#334155"
                  }}>
                    <strong>Order Status:</strong> {msg.embeddedTracking.orderStatus}<br/>
                    <strong>Delivery Location:</strong> {msg.embeddedTracking.shippingAddress.city}<br/>
                    <strong>Total Amount:</strong> ₹{msg.embeddedTracking.totalAmount}<br/>
                    
                    <button
                      onClick={() => {
                        setTrackingOrder(msg.embeddedTracking);
                        setActiveTab("track");
                      }}
                      style={{
                        marginTop: "8px",
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      Open Live Tracking Map
                    </button>
                  </div>
                )}

                {/* List Orders in Chat */}
                {msg.ordersList && (
                  <div className="quick-replies-container" style={{ flexDirection: "column", gap: "6px" }}>
                    {msg.ordersList.slice(0, 3).map((order) => (
                      <button
                        key={order._id}
                        onClick={() => handleBotQuickAction("select_track_order", order)}
                        className="quick-reply-btn"
                        style={{ textAlign: "left", width: "100%", borderRadius: "10px" }}
                      >
                        📦 Order #{order._id.slice(-6).toUpperCase()} - ₹{order.totalAmount}
                      </button>
                    ))}
                  </div>
                )}

                {/* List Cancellable Orders in Chat */}
                {msg.cancellableList && (
                  <div className="quick-replies-container" style={{ flexDirection: "column", gap: "6px" }}>
                    {msg.cancellableList.slice(0, 3).map((order) => (
                      <button
                        key={order._id}
                        onClick={() => handleBotQuickAction("execute_cancel_order", order._id)}
                        className="quick-reply-btn"
                        style={{ textAlign: "left", width: "100%", borderRadius: "10px", borderColor: "#fecaca", color: "#dc2626" }}
                      >
                        ❌ Cancel Order #{order._id.slice(-6).toUpperCase()} - ₹{order.totalAmount}
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions / Action options */}
                {msg.showActions && (
                  <div className="quick-replies-container">
                    <button
                      onClick={() => handleBotQuickAction("track_orders")}
                      className="quick-reply-btn"
                    >
                      📦 Track My Orders
                    </button>
                    <button
                      onClick={() => handleBotQuickAction("cancel_orders_list")}
                      className="quick-reply-btn"
                    >
                      ❌ Cancel an Order
                    </button>
                    <button
                      onClick={() => handleBotQuickAction("talk_agent")}
                      className="quick-reply-btn"
                    >
                      👤 Talk to Agent
                    </button>
                  </div>
                )}

                {/* Simple Suggestions list */}
                {msg.suggestions && (
                  <div className="quick-replies-container">
                    {msg.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (s === "Talk to Agent") handleBotQuickAction("talk_agent");
                          if (s === "Cancel An Order") handleBotQuickAction("cancel_orders_list");
                          if (s === "Browse Products") navigate("/products");
                        }}
                        className="quick-reply-btn"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="chat-time">{msg.time}</div>
              </div>
            ))}

            {isBotTyping && (
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input
              type="text"
              placeholder={chatMode === "bot" ? "Ask a question (e.g. 'where is my refund?')..." : "Type message to Agent..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isBotTyping}
            />
            <button type="submit" disabled={!chatInput.trim() || isBotTyping}>
              ➤
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: LIVE ORDER TRACKING */}
      {activeTab === "track" && (
        <div className="tracking-layout">
          {/* Order Selection */}
          <div className="order-selector-card">
            <h2>Track Shipments</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Select a package to monitor courier delivery in real time on our digital vector map.
            </p>

            {!userInfo ? (
              <div style={{ textAlign: "center", padding: "30px 10px" }}>
                <h3>Authentication Required</h3>
                <p style={{ fontSize: "13px", color: "#64748b" }}>Please login to view active orders.</p>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    marginTop: "10px"
                  }}
                >
                  Login Page
                </button>
              </div>
            ) : loadingOrders ? (
              <p>Loading your orders...</p>
            ) : orders.length === 0 ? (
              <div style={{ padding: "20px 0" }}>
                <h4>No orders found.</h4>
                <button onClick={() => navigate("/products")} style={{ background: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Start Shopping</button>
              </div>
            ) : (
              <div className="order-select-list">
                {orders.map((o) => (
                  <div
                    key={o._id}
                    onClick={() => setTrackingOrder(o)}
                    className={`order-select-item ${trackingOrder?._id === o._id ? "selected" : ""}`}
                  >
                    <div>
                      <strong style={{ fontSize: "14px" }}>Order #{o._id.slice(-6).toUpperCase()}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        Placed on: {new Date(o.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: o.orderStatus === "Cancelled" ? "#ef4444" : "#2563eb",
                        background: o.orderStatus === "Cancelled" ? "#fef2f2" : "#eff6ff",
                        padding: "4px 10px",
                        borderRadius: "10px"
                      }}
                    >
                      {o.orderStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map display */}
          <div>
            {trackingOrder ? (
              <>
                <div className="map-card">
                  {/* Map Header */}
                  <div style={{ padding: "15px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "15px" }}>Live Delivery Agent Route</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Order ID: #{trackingOrder._id}</div>
                    </div>
                    <span className="eta-badge">
                      ETA: {trackingOrder.orderStatus === "Delivered" ? "Delivered" : trackingOrder.orderStatus === "Cancelled" ? "N/A" : `${mapEta} mins`}
                    </span>
                  </div>

                  {/* SVG Map Container */}
                  <div className="map-container">
                    <svg className="live-map-svg" viewBox="0 0 500 350">
                      {/* Grid Roads background */}
                      <path d="M 50 50 L 450 50 M 50 150 L 450 150 M 50 250 L 450 250" stroke="#cbd5e1" strokeWidth="4" opacity="0.3" strokeDasharray="5,5" />
                      <path d="M 100 20 L 100 330 M 250 20 L 250 330 M 400 20 L 400 330" stroke="#cbd5e1" strokeWidth="4" opacity="0.3" strokeDasharray="5,5" />

                      {/* Main Road Route Path */}
                      <path
                        className="map-road-track"
                        d="M 50 250 L 100 250 L 100 150 L 250 150 L 250 50 L 400 50 L 400 150"
                      />
                      
                      {/* Active Route Progress */}
                      {trackingOrder.orderStatus !== "Cancelled" && trackingOrder.orderStatus !== "Delivered" && (
                        <path
                          className="map-road-progress"
                          d="M 50 250 L 100 250 L 100 150 L 250 150 L 250 50 L 400 50 L 400 150"
                          style={{ animationPlayState: activeTab === "track" ? "running" : "paused" }}
                        />
                      )}

                      {/* Starting Warehouse Point */}
                      <circle cx="50" cy="250" r="10" fill="#2563eb" />
                      <text x="50" y="275" fontSize="10" fontWeight="bold" fill="#2563eb" textAnchor="middle">TrendEra Hub</text>

                      {/* Ending Customer Point */}
                      <circle cx="400" cy="150" r="10" fill="#ef4444" />
                      <text x="400" y="180" fontSize="10" fontWeight="bold" fill="#ef4444" textAnchor="middle">Your Location</text>

                      {/* Moving Vehicle Icon (Simulated along path) */}
                      {trackingOrder.orderStatus !== "Cancelled" && trackingOrder.orderStatus !== "Delivered" && (
                        <g 
                          className="courier-bike"
                          style={{
                            offsetPath: "path('M 50 250 L 100 250 L 100 150 L 250 150 L 250 50 L 400 50 L 400 150')",
                            animation: "move-bike 15s linear infinite",
                            animationPlayState: activeTab === "track" ? "running" : "paused"
                          }}
                        >
                          {/* Circle bike background */}
                          <circle cx="0" cy="0" r="14" fill="#3b82f6" stroke="white" strokeWidth="2" />
                          <text x="0" y="4" fontSize="12" textAnchor="middle">🛵</text>
                        </g>
                      )}
                    </svg>
                  </div>

                  {/* Courier Info Bar */}
                  <div className="courier-info-footer">
                    <div className="courier-profile">
                      <img
                        className="courier-avatar"
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                        alt="Courier Vikram"
                      />
                      <div className="courier-name">
                        <h4>Vikram Singh</h4>
                        <p>🔒 Security-Verified delivery agent</p>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Vehicle No:</span>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#334155" }}>DL-03-CB-9908</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: "white", padding: "20px", borderRadius: "20px", marginTop: "20px", border: "1px solid #f1f5f9" }}>
                  <h4 style={{ margin: "0 0 15px 0" }}>Shipment Milestones</h4>
                  
                  <div className="tracking-timeline">
                    <div className={`timeline-step completed`}>
                      <div className="step-node">🛒</div>
                      <span className="step-label">Ordered</span>
                    </div>

                    <div className={`timeline-step ${
                      trackingOrder.orderStatus !== "Pending" ? "completed" : "active"
                    }`}>
                      <div className="step-node">⚙️</div>
                      <span className="step-label">Processing</span>
                    </div>

                    <div className={`timeline-step ${
                      trackingOrder.orderStatus === "Shipped" || trackingOrder.orderStatus === "Delivered" ? "completed" :
                      trackingOrder.orderStatus === "Processing" ? "active" : ""
                    }`}>
                      <div className="step-node">📦</div>
                      <span className="step-label">Shipped</span>
                    </div>

                    <div className={`timeline-step ${
                      trackingOrder.orderStatus === "Delivered" ? "completed" :
                      trackingOrder.orderStatus === "Shipped" ? "active" : ""
                    }`}>
                      <div className="step-node">🛵</div>
                      <span className="step-label">Out for Delivery</span>
                    </div>

                    <div className={`timeline-step ${
                      trackingOrder.orderStatus === "Delivered" ? "active" : ""
                    }`}>
                      <div className="step-node">🏠</div>
                      <span className="step-label">Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Live Activity Logs */}
                <div className="live-logs-card">
                  <h4 style={{ margin: "0 0 10px 0" }}>Real-Time Courier Updates</h4>
                  <div className="live-logs-list">
                    {liveLogs.map((log, idx) => (
                      <div key={idx} className="log-item">
                        <div className="log-time">{log.time}</div>
                        <div className="log-text">{log.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                background: "#f8fafc",
                border: "2px dashed #cbd5e1",
                borderRadius: "20px",
                height: "350px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b"
              }}>
                <span style={{ fontSize: "50px", marginBottom: "15px" }}>🛵</span>
                <h3>No Package Selected</h3>
                <p>Choose an order on the left to activate the live tracking map.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUPPORT TICKET SYSTEM */}
      {activeTab === "tickets" && (
        <div className="tickets-grid">
          {/* Submit Ticket Form */}
          <div className="ticket-form-card">
            <h2>File a Support Request</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>
              Our automated helpdesk will route your ticket to specialists.
            </p>

            {ticketError && <div className="error-box">{ticketError}</div>}
            {ticketSuccess && <div className="success-box">{ticketSuccess}</div>}

            <form onSubmit={handleTicketSubmit}>
              <input
                type="text"
                placeholder="Subject of Issue (e.g. Refund pending)"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                required
              />
              <textarea
                rows="6"
                placeholder="Please describe your issue in detail. Add order numbers if applicable..."
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                required
              />
              <button type="submit">Submit Secure Request</button>
            </form>
          </div>

          {/* Ticket History */}
          <div className="tickets-history-card">
            <h2>Ticket Dashboard</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "15px" }}>
              Click on a ticket to view conversation history with support agents.
            </p>

            {!userInfo ? (
              <p style={{ color: "#64748b", textAlign: "center", marginTop: "30px" }}>
                Please login to view ticket history.
              </p>
            ) : loadingTickets ? (
              <p>Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", marginTop: "30px" }}>
                You have not filed any tickets yet.
              </p>
            ) : (
              <div className="tickets-list">
                {tickets.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    className={`ticket-item ${selectedTicket?._id === t._id ? "selected" : ""}`}
                  >
                    <div className="ticket-item-header">
                      <span className="ticket-subject">{t.subject}</span>
                      <span className={`ticket-status-badge ${t.status.toLowerCase().replace(" ", "-")}`}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="ticket-date">
                        Created: {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold" }}>
                        View replies ({t.replies.length}) →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TICKET CONVERSATION DRAWER (MODAL OVERLAY) */}
          {selectedTicket && (
            <div className="ticket-drawer-overlay" onClick={() => setSelectedTicket(null)}>
              <div className="ticket-drawer" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="ticket-drawer-header">
                  <div>
                    <h3 style={{ margin: "0", fontSize: "16px" }}>{selectedTicket.subject}</h3>
                    <span className="ticket-date" style={{ fontSize: "11px" }}>
                      Ticket ID: #{selectedTicket._id}
                    </span>
                  </div>
                  <button className="close-drawer-btn" onClick={() => setSelectedTicket(null)}>
                    ✕
                  </button>
                </div>

                {/* Messages Body */}
                <div className="ticket-drawer-messages">
                  <div className="ticket-orig-message">
                    <strong>Original Request:</strong>
                    <div style={{ marginTop: "5px", whiteSpace: "pre-line" }}>
                      {selectedTicket.message}
                    </div>
                  </div>

                  {selectedTicket.replies.map((reply, idx) => (
                    <div
                      key={idx}
                      className={`ticket-reply-bubble ${
                        reply.sender === "user" ? "user" : "support"
                      }`}
                    >
                      <div>{reply.text}</div>
                      <div style={{ fontSize: "9px", opacity: "0.7", marginTop: "4px", textAlign: "right" }}>
                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendTicketReply} className="ticket-drawer-input">
                  <input
                    type="text"
                    placeholder="Provide details or ask a follow-up..."
                    value={ticketReplyText}
                    onChange={(e) => setTicketReplyText(e.target.value)}
                    required
                  />
                  <button type="submit" disabled={sendingReply}>
                    {sendingReply ? "Sending..." : "Send"}
                  </button>
                </form>

              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HELPDESK FAQS */}
      {activeTab === "faqs" && (
        <div style={{ background: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)", border: "1px solid #f1f5f9" }}>
          <h2>Frequently Asked Questions</h2>
          <p style={{ color: "#64748b", marginBottom: "25px" }}>
            Find quick solutions to common issues regarding orders, security, payments, and shipping.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {faqsList.map((faq) => (
              <div
                key={faq.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "all 0.3s ease"
                }}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    background: expandedFaq === faq.id ? "#f8fafc" : "white",
                    border: "none",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ transition: "transform 0.2s ease", transform: expandedFaq === faq.id ? "rotate(180deg)" : "rotate(0)" }}>
                    ▼
                  </span>
                </button>
                
                {expandedFaq === faq.id && (
                  <div style={{ padding: "18px 20px", fontSize: "14px", color: "#475569", lineHeight: "1.6", borderTop: "1px solid #e2e8f0", background: "white" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSupport;