const uploadMedia = require("./src/middlewares/upload.middleware").uploadMedia;

// Test if middleware exists and is callable
console.log("uploadMedia middleware:", typeof uploadMedia);
console.log("uploadMedia is a function:", typeof uploadMedia === "function");

// Create mock req/res/next
const mockReq = {
  files: [
    {
      fieldname: "files",
      originalname: "test.png",
      encoding: "7bit",
      mimetype: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    },
    {
      fieldname: "title",
      originalname: undefined,
      encoding: "7bit",
      mimetype: "text/plain",
      buffer: undefined,
    },
  ],
};

const mockRes = {};
const mockNext = () => console.log("Next called");

// Call middleware
try {
  uploadMedia(mockReq, mockRes, mockNext);
  console.log("Middleware executed successfully");
  console.log("After middleware, req.files:", mockReq.files ? mockReq.files.map(f => f.fieldname) : "undefined");
} catch (error) {
  console.error("Error executing middleware:", error.message);
}
