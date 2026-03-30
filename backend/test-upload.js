const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const axios = require("axios");

const API_URL = "http://localhost:5000";

async function testUpload() {
  try {
    // Step 1: Login
    console.log("Step 1: Logging in...");
    const loginRes = await axios.post(`${API_URL}/citizen/login`, {
      email: "uz@gmail2222.com",
      password: "test123", // Assuming password is test123
    });
    
    const token = loginRes.data.token;
    console.log("Login successful. Token:", token.slice(0, 20) + "...");

    // Step 2: Create a test image file
    console.log("\nStep 2: Creating test image...");
    const testImagePath = path.join(__dirname, "test-image.png");
    // Create a simple 1x1 PNG (smallest valid PNG)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0x0f, 0x00, 0x00,
      0x01, 0x01, 0x00, 0x01, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ]);
    fs.writeFileSync(testImagePath, pngData);
    console.log("Test image created at:", testImagePath);

    // Step 3: Upload complaint with file
    console.log("\nStep 3: Uploading complaint with file...");
    const form = new FormData();
    form.append("title", "Test Complaint");
    form.append("description", "This is a test complaint with file upload");
    form.append("files", fs.createReadStream(testImagePath));

    const uploadRes = await axios.post(`${API_URL}/citizen/complaints`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("\nUpload successful!");
    console.log("Response:", JSON.stringify(uploadRes.data, null, 2));

    // Cleanup
    fs.unlinkSync(testImagePath);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testUpload();
