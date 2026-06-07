const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'scores.json');

let isMongoConnected = false;
let dbStatusMessage = 'Initializing...';

// 確保本地 JSON 檔案資料庫的目錄與檔案存在
function ensureJsonDbExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

// 連接 MongoDB
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    isMongoConnected = false;
    dbStatusMessage = 'Local File Database (Fallback Mode)';
    console.log('⚠️ [Database] MONGODB_URI is not set. Switching to Local JSON file mode.');
    ensureJsonDbExists();
    return;
  }

  try {
    console.log('🔄 [Database] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // 5 秒連線逾時
    });
    isMongoConnected = true;
    dbStatusMessage = 'MongoDB Atlas (Cloud Mode)';
    console.log('✅ [Database] MongoDB Atlas connected successfully.');
  } catch (err) {
    isMongoConnected = false;
    dbStatusMessage = 'Local File Database (Connection Failed Fallback)';
    console.error(`❌ [Database] MongoDB connection error: ${err.message}`);
    console.log('⚠️ [Database] Falling back to Local JSON file mode.');
    ensureJsonDbExists();
  }
}

// 取得前 N 名高分排行
async function getTopScores(limit = 10) {
  if (isMongoConnected) {
    const Score = require('../models/Score');
    try {
      return await Score.find()
        .sort({ score: -1 })
        .limit(limit)
        .lean();
    } catch (err) {
      console.error(`❌ [Database] Failed to get scores from MongoDB: ${err.message}. Trying local fallback...`);
    }
  }

  // 降級使用 JSON 檔案
  try {
    ensureJsonDbExists();
    const rawData = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    const scores = JSON.parse(rawData);
    // 降冪排序，並取出前 limit 名
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (err) {
    console.error(`❌ [Database] Failed to read local JSON database: ${err.message}`);
    return [];
  }
}

// 儲存新分數
async function saveScore(scoreData) {
  const newScore = {
    username: scoreData.username.trim(),
    score: parseInt(scoreData.score, 10),
    linesCleared: parseInt(scoreData.linesCleared, 10) || 0,
    createdAt: new Date()
  };

  // 後端參數防呆校驗
  if (!newScore.username || newScore.username.length > 10) {
    throw new Error('Username must be 1-10 characters long.');
  }
  if (isNaN(newScore.score) || newScore.score < 0) {
    throw new Error('Score must be a positive number.');
  }

  if (isMongoConnected) {
    const Score = require('../models/Score');
    try {
      const scoreDoc = new Score(newScore);
      return await scoreDoc.save();
    } catch (err) {
      console.error(`❌ [Database] Failed to save score to MongoDB: ${err.message}. Trying local fallback...`);
    }
  }

  // 降級使用 JSON 檔案
  try {
    ensureJsonDbExists();
    const rawData = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    const scores = JSON.parse(rawData);
    
    // 生成一個自訂 ID 並存入
    newScore._id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    scores.push(newScore);
    
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(scores, null, 2), 'utf-8');
    return newScore;
  } catch (err) {
    console.error(`❌ [Database] Failed to save score locally: ${err.message}`);
    throw new Error('Failed to save score database.');
  }
}

function getDbStatus() {
  return {
    isMongo: isMongoConnected,
    status: dbStatusMessage
  };
}

module.exports = {
  connectDB,
  getTopScores,
  saveScore,
  getDbStatus
};
