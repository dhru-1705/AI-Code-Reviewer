const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    language: {
      type: String,
      required: [true, 'Please specify the code language'],
      trim: true,
    },
    reviewType: {
      type: String,
      required: [true, 'Please specify the review type'],
      enum: ['general', 'security', 'performance', 'best-practices'],
      default: 'general',
    },
    analysisMode: {
      type: String,
      enum: ['enhanced', 'ai-only'],
      default: 'enhanced',
    },
    compilerUsed: {
      type: String,
      default: 'None',
    },
    originalCode: {
      type: String,
      required: [true, 'Original code is required'],
    },
    optimizedCode: {
      type: String,
      required: [true, 'Optimized code is required'],
    },
    feedback: {
      summary: {
        type: String,
        required: true,
      },
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 100,
      },
      suggestions: [{
        type: String,
      }],
      security: [{
        type: String,
      }],
      performance: [{
        type: String,
      }],
      bestPractices: [{
        type: String,
      }],
      issues: [{
        type: { type: String },
        title: { type: String },
        message: { type: String },
        lineNumber: { type: Number },
        column: { type: Number },
        severity: { type: String },
        suggestedFix: { type: String },
        impact: { type: String },
      }],
      aiExplanation: {
        type: String,
      },
      stats: {
        linesOfCode: { type: Number },
        functions: { type: Number },
        classes: { type: Number },
        variables: { type: Number },
        importsCount: { type: Number },
        commentsCount: { type: Number },
        errorsCount: { type: Number },
        warningsCount: { type: Number },
        complexity: { type: String },
        reviewTime: { type: Number },
        inferenceTime: { type: Number },
        modelName: { type: String },
        tokensUsed: {
          prompt: { type: Number },
          completion: { type: Number },
          total: { type: Number },
        },
      },
      summaryCards: {
        errors: { type: Number },
        warnings: { type: Number },
        suggestions: { type: Number },
        complexity: { type: String },
        maintainability: { type: String },
        security: { type: String },
        performance: { type: String },
        overallGrade: { type: String },
      },
      breakdown: {
        syntax: { type: Number },
        logic: { type: Number },
        performance: { type: Number },
        security: { type: Number },
        maintainability: { type: Number },
        readability: { type: Number },
        bestPractices: { type: Number },
        overall: { type: Number },
      },
      confidence: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Review', reviewSchema);
