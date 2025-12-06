import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
// Import từ src folder
import { User } from "./src/models/index.js";
import { USER_ROLES, USER_STATUS } from "./src/lib/constants.js";

dotenv.config();

const createAdmin = async () => {
  try {
    // Kết nối DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "admin@auctionhub.com";
    const adminPassword = "AdminPassword123@"; // Bạn có thể sửa pass này

    // 1. Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin account already exists.");
      process.exit(0);
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // 3. Tạo user với role ADMIN
    const newAdmin = new User({
      username: "superadmin",
      email: adminEmail,
      passwordHash: passwordHash,
      fullName: "Super Administrator",
      roles: [USER_ROLES.ADMIN], // QUAN TRỌNG NHẤT
      status: USER_STATUS.ACTIVE,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await newAdmin.save();
    console.log("✅ Admin created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Pass: ${adminPassword}`);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
