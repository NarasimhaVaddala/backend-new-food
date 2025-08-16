import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { errorMiddleware } from "./middlewares/error.js";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import AuthRoute from "./routes/AuthRoute.js";
import OrderRoute from "./routes/OrderRoute.js";
import AdminRoute from "./routes/AdminRoute.js";
import PartnerRoute from "./routes/DeliveryRoute.js";
import ContactRoute from "./routes/ContactRoute.js";

dotenv.config({ path: "./.env" });

export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";
const port = process.env.PORT || 5000;

const mongoURI = process.env.MONGO_URI;

connectDB(mongoURI);

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

export { io };

export let adminId = null;
export const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("role", ({ role, userId, orderId }) => {
    console.log("admin connected");
    if (role == "admin") {
      adminId = socket.id;
      console.log(adminId);
    }
    connectedUsers.set(socket.id, { userId, role });
    console.log(connectedUsers);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove the user from connectedUsers map when disconnected
    if (connectedUsers.has(socket.id)) {
      const user = connectedUsers.get(socket.id);
      console.log(
        `User removed: ID=${user.userId}, Role=${user.role}, Socket=${socket.id}`
      );
      connectedUsers.delete(socket.id);
    }

    // Optional: If you want to clear adminId when admin disconnects
    if (adminId === socket.id) {
      console.log("Admin disconnected, resetting adminId");
      adminId = null;
    }
  });

  socket.on("partner-location", (data) => {
    console.log(data);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("dev"));

// Make io available to all routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/uploads", express.static("uploads"));
app.use("/logs", express.static("logs"));

app.get("/", (req, res) => {
  res.send({ message: "Welcome to Chalabagundi server" });
});

app.use("/auth", AuthRoute);
app.use("/orders", OrderRoute);
app.use("/admin", AdminRoute);
app.use("/partner", PartnerRoute);
app.use("/contact", ContactRoute);

app.use(errorMiddleware);

server.listen(port, () =>
  console.log("Server is working on Port:" + port + " in " + envMode + " Mode.")
);
