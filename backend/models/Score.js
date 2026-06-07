const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [10, 'Username cannot exceed 10 characters']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative']
  },
  linesCleared: {
    type: Number,
    default: 0,
    min: [0, 'Lines cleared cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 建立索引以優化排行榜降冪查詢
scoreSchema.index({ score: -1 });

module.exports = mongoose.model('Score', scoreSchema);
