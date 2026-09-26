const { randomUUID } = require("crypto");
const { z } = require("zod");

const Situation = require("../models/Situation");
const {
  createSituation,
  answerQuestions,
  updateSituation,
} = require("../services/nextStepService");

const createSituationSchema = z.object({
  text: z.string().trim().min(1, "Situation text is required"),
  locale: z.string().optional(),
  client_time: z.string().optional(),
});

const answerItemSchema = z.object({
  question_id: z.string().trim().min(1, "Question ID is required"),
  answer: z.string().trim().min(1, "Answer is required"),
});

const answersSchema = z.object({
  answers: z
    .array(answerItemSchema)
    .min(1, "At least one answer is required"),
});

const createSituationController = async (req, res) => {
  try {
    // 1. Validate incoming data
    const payload = createSituationSchema.parse(req.body);

    // 2. Generate a unique idempotency key for this request
    const idempotencyKey = randomUUID();

    // 3. Send situation to NextStep API
    const chaosMode = req.headers["x-chaos"];

const apiResponse = await createSituation(
  payload,
  idempotencyKey,
  chaosMode
);

    // 4. Save the API response in MongoDB
    const situation = await Situation.create({
      originalText: payload.text,

      situationId: apiResponse.situation_id,
      version: apiResponse.version,
      mode: apiResponse.mode,
      summary: apiResponse.summary,

      issues: apiResponse.issues || [],
      priorities: apiResponse.priorities || [],

      nextAction: apiResponse.next_action || null,

      clarifyingQuestions:
        apiResponse.clarifying_questions || [],

      missingInformation:
        apiResponse.missing_information || [],

      riskFlags: apiResponse.risk_flags || [],

      confidence: apiResponse.confidence || null,

      changes: apiResponse.changes || [],

      support: apiResponse.support || null,

      history: [
        {
          version: apiResponse.version,
          response: apiResponse,
        },
      ],
    });

    // 5. Send response to frontend
    res.status(201).json({
      message: "Situation created successfully",
      situation,
    });
  } catch (error) {
    // Validation error
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Invalid request data",
        errors: error.issues,
      });
      return handleControllerError(res, error);
    }

    // NextStep API error
    if (error.status) {
      return res.status(error.status).json({
        message: "NextStep API request failed",
        error: error.message,
        code: error.code,
        requestId: error.requestId,
        retryAfter: error.retryAfter,
      });
    }

    // Unexpected server/database error
    console.error("Create situation error:", error);

    res.status(500).json({
      message: "Failed to create situation",
      error: error.message,
    });
  }
};

//get situation controller
const getSituationController = async (req, res) => {
  try {
    const { id } = req.params;

    const situation = await Situation.findOne({
      situationId: id,
    });

    if (!situation) {
      return res.status(404).json({
        message: "Situation not found",
      });
    }

    res.status(200).json({
      situation,
    });
  } catch (error) {
  return handleControllerError(res, error);
}
};

//answer questions controller
const answerQuestionsController = async (req, res) => {
  try {
    const { id } = req.params;

    const situation = await Situation.findOne({
      situationId: id,
    });

    if (!situation) {
      return res.status(404).json({
        message: "Situation not found",
      });
    }

    const { answers } = answersSchema.parse(req.body);

    const idempotencyKey = randomUUID();

    const apiResponse = await answerQuestions(
      id,
      { answers },
      idempotencyKey
    );

    situation.version = apiResponse.version;
    situation.mode = apiResponse.mode;
    situation.summary = apiResponse.summary || "";

    situation.issues = apiResponse.issues || [];
    situation.priorities = apiResponse.priorities || [];

    situation.nextAction = apiResponse.next_action || null;

    situation.clarifyingQuestions =
      apiResponse.clarifying_questions || [];

    situation.missingInformation =
      apiResponse.missing_information || [];

    situation.riskFlags =
      apiResponse.risk_flags || [];

    situation.confidence =
      apiResponse.confidence || null;

    situation.changes =
      apiResponse.changes || [];

    situation.support =
      apiResponse.support || null;

    situation.history.push({
      version: apiResponse.version,
      response: apiResponse,
    });

    await situation.save();

    res.status(200).json({
      message: "Answers submitted successfully",
      situation,
    });
  } catch (error) {
  if (error.name === "ZodError") {
    return res.status(400).json({
      message: "Invalid request data",
      errors: error.issues,
    });
  }

  return handleControllerError(res, error);
}
};

//update situation controller
const updateSituationController = async (req, res) => {
  try {
    const { id } = req.params;

    const situation = await Situation.findOne({
      situationId: id,
    });

    if (!situation) {
      return res.status(404).json({
        message: "Situation not found",
      });
    }

    const { text, client_time } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Update text is required",
      });
    }

    const idempotencyKey = randomUUID();

    const apiResponse = await updateSituation(
      id,
      {
        text: text.trim(),
        ...(client_time && { client_time }),
      },
      idempotencyKey
    );

    situation.version = apiResponse.version;
    situation.mode = apiResponse.mode;
    situation.summary = apiResponse.summary || "";

    situation.issues = apiResponse.issues || [];
    situation.priorities = apiResponse.priorities || [];

    situation.nextAction = apiResponse.next_action || null;

    situation.clarifyingQuestions =
      apiResponse.clarifying_questions || [];

    situation.missingInformation =
      apiResponse.missing_information || [];

    situation.riskFlags =
      apiResponse.risk_flags || [];

    situation.confidence =
      apiResponse.confidence || null;

    situation.changes =
      apiResponse.changes || [];

    situation.support =
      apiResponse.support || null;

    situation.history.push({
      version: apiResponse.version,
      response: apiResponse,
    });

    await situation.save();

    res.status(200).json({
      message: "Situation updated successfully",
      situation,
    });
  } catch (error) {
  return handleControllerError(res, error);
}
};

const handleControllerError = (res, error) => {
  console.error("Controller error:", error.message);

  if (error.status) {
    return res.status(error.status).json({
      message: error.message,
      code: error.code || null,
      requestId: error.requestId || null,
      retryAfter: error.retryAfter || null,
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};

module.exports = {
  createSituationController,
  getSituationController,
  answerQuestionsController,
  updateSituationController,
    handleControllerError,
};