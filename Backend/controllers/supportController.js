const SupportTicket = require("../models/SupportTicket");

// Create Support Ticket
exports.createTicket = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const userId = req.user.id; // From authMiddleware

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const ticket = await SupportTicket.create({
            user: userId,
            name,
            email,
            subject,
            message
        });

        // Simulate an automated bot response after ticket creation
        setTimeout(async () => {
            try {
                let autoReplyText = `Thank you for contacting TrendEra Support. We have received your query regarding "${subject}". A customer support representative has been assigned to ticket #${ticket._id.toString().slice(-6).toUpperCase()} and will review your request shortly.`;

                // Keyword specific auto-replies
                const textLower = (subject + " " + message).toLowerCase();
                if (textLower.includes("refund")) {
                    autoReplyText = `Hello! Regarding your refund request for ticket #${ticket._id.toString().slice(-6).toUpperCase()}: Refunds typically take 5-7 business days to reflect in your account after the item is received and inspected at our warehouse. We will update you here as soon as processing completes.`;
                } else if (textLower.includes("delivery") || textLower.includes("track")) {
                    autoReplyText = `Hi there! If you are asking about order delivery or tracking, you can use our live tracking feature directly on the support dashboard. If your order status is 'Shipped', it is already on its way. Let us know if you need specific courier agent details.`;
                } else if (textLower.includes("cancel")) {
                    autoReplyText = `Hello. To cancel an order, please visit the 'Orders' page and click 'Cancel Order' (available only if the order is still Pending or Processing). If you have further issues, our team will reply shortly.`;
                }

                await SupportTicket.findByIdAndUpdate(ticket._id, {
                    $push: {
                        replies: {
                            sender: "support",
                            text: autoReplyText,
                            createdAt: new Date()
                        }
                    },
                    status: "In Progress"
                });
            } catch (err) {
                console.error("Error creating auto-reply:", err);
            }
        }, 1500);

        res.status(201).json({
            message: "Support ticket created successfully",
            ticket
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get User's Support Tickets
exports.getTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const tickets = await SupportTicket.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add Reply to Ticket
exports.addReply = async (req, res) => {
    try {
        const { text } = req.body;
        const ticketId = req.params.id;

        if (!text) {
            return res.status(400).json({ message: "Reply text is required" });
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Add user reply
        ticket.replies.push({
            sender: "user",
            text,
            createdAt: new Date()
        });
        ticket.status = "Open";
        await ticket.save();

        // Simulate support response after 2 seconds
        setTimeout(async () => {
            try {
                const replies = [
                    "We've received your update. Our support specialist is looking into this details right now.",
                    "Thank you for the additional information. We are coordinating with our logistics/billing department and will resolve this within 24 hours.",
                    "Got it! We have updated your ticket information. Rest assured, we are prioritizing this issue for you."
                ];
                const randomReply = replies[Math.floor(Math.random() * replies.length)];

                await SupportTicket.findByIdAndUpdate(ticketId, {
                    $push: {
                        replies: {
                            sender: "support",
                            text: randomReply,
                            createdAt: new Date()
                        }
                    },
                    status: "In Progress"
                });
            } catch (err) {
                console.error("Error in support follow-up reply:", err);
            }
        }, 2000);

        res.status(200).json({
            message: "Reply sent successfully",
            ticket
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
