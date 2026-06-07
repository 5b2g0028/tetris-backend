require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const scoresRouter = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

// 連線至資料庫 (MongoDB 或本地備援)
db.connectDB();

// 中間件設定
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api/scores', scoresRouter);

// 託管前端靜態資源
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 網頁進入點 (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 [Server] Tetris Arcade Server started!`);
  console.log(`🌐 [Server] URL: http://localhost:${PORT}`);
  console.log(`⚙️  [Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});
