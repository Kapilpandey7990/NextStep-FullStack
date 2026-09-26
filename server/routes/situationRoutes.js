const express = require("express");
const {
  createSituationController,
  getSituationController,
  answerQuestionsController,
  updateSituationController,
  handleControllerError
} = require("../controllers/situationController");

const router = express.Router();

router.post("/", createSituationController);
router.get("/:id", getSituationController);
router.post("/:id/answers", answerQuestionsController);
router.post("/:id/updates", updateSituationController);




module.exports = router;