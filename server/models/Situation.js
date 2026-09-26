const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    category: String,
    urgency: mongoose.Schema.Types.Mixed,
    deadline: Date,
    depends_on: [String],
  },
  { _id: false }
);

const prioritySchema = new mongoose.Schema(
  {
    rank: Number,
    issue_id: String,
    action: String,
    reason: String,
    estimated_minutes: Number,
  },
  { _id: false }
);

const nextActionSchema = new mongoose.Schema(
  {
    text: String,
    issue_id: String,
    why: String,
  },
  { _id: false }
);

const clarifyingQuestionSchema = new mongoose.Schema(
  {
    id: String,
    question: String,
    options: [String],
    skippable: Boolean,
  },
  { _id: false }
);

const confidenceSchema = new mongoose.Schema(
  {
    level: String,
    reasons: [String],
  },
  { _id: false }
);

const changeSchema = new mongoose.Schema(
  {
    field: String,
    from: mongoose.Schema.Types.Mixed,
    to: mongoose.Schema.Types.Mixed,
    reason: String,
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    version: Number,
    response: mongoose.Schema.Types.Mixed,
  },
  {
    _id: false,
    timestamps: true,
  }
);

const situationSchema = new mongoose.Schema(
  {
    originalText: {
      type: String,
      required: true,
      trim: true,
    },

    situationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    version: {
      type: Number,
      required: true,
    },

    mode: {
      type: String,
      required: true,
    },

    summary: {
      type: String,
      default: "",
    },

    issues: {
      type: [issueSchema],
      default: [],
    },

    priorities: {
      type: [prioritySchema],
      default: [],
    },

    nextAction: {
      type: nextActionSchema,
      default: null,
    },

    clarifyingQuestions: {
      type: [clarifyingQuestionSchema],
      default: [],
    },

    missingInformation: {
      type: [String],
      default: [],
    },

    riskFlags: {
      type: [String],
      default: [],
    },

    confidence: {
      type: confidenceSchema,
      default: null,
    },

    changes: {
      type: [changeSchema],
      default: [],
    },

    support: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    history: {
      type: [historySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Situation", situationSchema);