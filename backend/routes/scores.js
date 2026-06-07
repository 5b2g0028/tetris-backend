const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/scores - 取得前 10 名排行榜及資料庫狀態
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const scores = await db.getTopScores(limit);
    const dbStatus = db.getDbStatus();
    
    res.json({
      success: true,
      dbStatus: dbStatus.status,
      isMongo: dbStatus.isMongo,
      data: scores
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve scores.',
      error: err.message
    });
  }
});

// POST /api/scores - 新增排行榜紀錄
router.post('/', async (req, res) => {
  try {
    const { username, score, linesCleared } = req.body;
    
    // 基本後端校驗
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Username is required and cannot be empty.'
      });
    }
    
    if (username.trim().length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Username cannot exceed 10 characters.'
      });
    }
    
    if (score === undefined || isNaN(score) || score < 0) {
      return res.status(400).json({
        success: false,
        message: 'Score must be a positive number.'
      });
    }

    const saved = await db.saveScore({
      username: username.trim(),
      score: parseInt(score, 10),
      linesCleared: parseInt(linesCleared, 10) || 0
    });

    res.status(201).json({
      success: true,
      message: 'Score saved successfully!',
      data: saved
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to save score.'
    });
  }
});

module.exports = router;
