const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    global.isOfflineDB = false;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    console.warn(`[Database Notice] Falling back to Local JSON DB for persistent storage.`);
    global.isOfflineDB = true;
    
    // Initialize mock database stores from local JSON files to ensure users register only once
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const usersFile = path.join(tempDir, 'mockUsers.json');
    if (fs.existsSync(usersFile)) {
      try {
        global.mockUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      } catch (e) {
        global.mockUsers = [];
      }
    } else {
      global.mockUsers = [];
      fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
    }

    const reviewsFile = path.join(tempDir, 'mockReviews.json');
    if (fs.existsSync(reviewsFile)) {
      try {
        global.mockReviews = JSON.parse(fs.readFileSync(reviewsFile, 'utf8'));
      } catch (e) {
        global.mockReviews = [];
      }
    } else {
      global.mockReviews = [];
      fs.writeFileSync(reviewsFile, JSON.stringify([], null, 2));
    }
  }
};

module.exports = connectDB;
