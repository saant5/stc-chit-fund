require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);

// Allowed frontend URLs
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend.vercel.app",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // User joins personal room for push notifications
  socket.on("user:join", ({ userId }) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user_${userId}`);
    }
  });

  // Auction room join
  socket.on("auction:join", ({ auctionId }) => {
    if (auctionId) {
      socket.join(`auction_${auctionId}`);
      console.log(`Socket ${socket.id} joined auction_${auctionId}`);
    }
  });

  // Auction room leave
  socket.on("auction:leave", ({ auctionId }) => {
    if (auctionId) {
      socket.leave(`auction_${auctionId}`);
      console.log(`Socket ${socket.id} left auction_${auctionId}`);
    }
  });

  // Place a bid
  socket.on("auction:bid", async ({ auctionId, bidAmount, bidderName, memberId }) => {
    try {
      const Auction = require("./models/Auction");
      const auction = await Auction.findById(auctionId);

      if (!auction || auction.status !== "live") {
        socket.emit("auction:error", { msg: "Auction is not live" });
        return;
      }

      if (bidAmount >= auction.chitAmount) {
        socket.emit("auction:error", {
          msg: `Bid must be less than ₹${auction.chitAmount.toLocaleString("en-IN")}`,
        });
        return;
      }

      if (auction.bidAmount > 0 && bidAmount >= auction.bidAmount) {
        socket.emit("auction:error", {
          msg: `Bid must be lower than ₹${auction.bidAmount.toLocaleString("en-IN")}`,
        });
        return;
      }

      auction.bidAmount = bidAmount;
      await auction.save();

      io.to(`auction_${auctionId}`).emit("auction:bid_placed", {
        auctionId,
        bidAmount,
        bidderName,
        memberId,
        timestamp: new Date().toISOString(),
      });

      console.log(`Bid ₹${bidAmount} by ${bidderName}`);
    } catch (err) {
      socket.emit("auction:error", { msg: err.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });