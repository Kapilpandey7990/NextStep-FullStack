import { useState } from "react";
import "./App.css";

function App() {
  const [situationText, setSituationText] = useState("");
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [updateText, setUpdateText] = useState("");
  const [loading, setLoading] = useState(false);
  console.log("LOADING STATE:", loading);
  const [errorMessage, setErrorMessage] = useState("");
  const handleSubmit = async () => {
    if (!situationText.trim()) {
      alert("Please describe your situation first.");
      return;
    }
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/situations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: situationText,
          locale: "en-IN",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create situation");
      }

      console.log("Situation created:", data);
      setResult(data.situation);
      setSituationText("");
    } catch (error) {
      console.error("Failed to create situation:", error);

      setErrorMessage(
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleAnswersSubmit = async () => {
    if (!result?.situationId) {
      alert("Situation ID is missing.");
      return;
    }

    const formattedAnswers = Object.entries(answers).map(
      ([question_id, answer]) => ({
        question_id,
        answer,
      }),
    );

    if (formattedAnswers.length === 0) {
      alert("Please answer at least one question.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/situations/${result.situationId}/answers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: formattedAnswers,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit answers");
      }

      console.log("Answers submitted:", data);
      setResult(data.situation);
      setAnswers({});
    } catch (error) {
      console.error("Failed to submit answers:", error);

      setErrorMessage(
        error.message || "Something went wrong while submitting your answers.",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateSubmit = async () => {
    if (!result?.situationId) {
      alert("Situation ID is missing.");
      return;
    }

    if (!updateText.trim()) {
      alert("Please describe what has changed.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/situations/${result.situationId}/updates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: updateText,
            client_time: new Date().toISOString(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update situation");
      }

      console.log("Situation updated:", data);

      setResult(data.situation);
      setUpdateText("");
    } catch (error) {
      console.error("Failed to update situation:", error);

      setErrorMessage(
        error.message || "Something went wrong while updating your situation.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">NextStep</div>

        <div className="navbar-text">AI decision assistant</div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="hero-badge">Clear thinking, one step at a time</div>

          <h1>
            Turn a messy situation
            <br />
            into a clear next step.
          </h1>

          <p className="hero-description">
            Tell us what is going on. NextStep will help you understand the
            situation, identify priorities, and decide what to do next.
          </p>

          <div className="situation-box">
            <textarea
              value={situationText}
              onChange={(event) => setSituationText(event.target.value)}
              placeholder="What's going on? Tell us about your situation..."
            />

            <button
              className="start-button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Find My Next Step"}
            </button>
          </div>
          {result && (
            <div className="result-box">
              <h2>Your NextStep Analysis</h2>

              <p>
                <strong>Mode:</strong> {result.mode}
              </p>

              {result.summary && (
                <p>
                  <strong>Summary:</strong> {result.summary}
                </p>
              )}

              {result.nextAction && (
                <div>
                  <h3>Next Action</h3>
                  <p>{result.nextAction.text}</p>
                </div>
              )}

              {result.issues && result.issues.length > 0 && (
                <div>
                  <h3>Issues</h3>

                  {result.issues.map((issue) => (
                    <div key={issue.id}>
                      <p>
                        <strong>{issue.title}</strong>
                      </p>
                      <p>{issue.category}</p>
                    </div>
                  ))}
                </div>
              )}

              {result.clarifyingQuestions &&
                result.clarifyingQuestions.length > 0 && (
                  <div>
                    <h3>We need a little more information</h3>

                    {result.clarifyingQuestions.map((question) => (
                      <div key={question.id} className="question-item">
                        <p>{question.question}</p>

                        <input
                          type="text"
                          value={answers[question.id] || ""}
                          onChange={(event) =>
                            setAnswers({
                              ...answers,
                              [question.id]: event.target.value,
                            })
                          }
                          placeholder="Type your answer..."
                        />
                      </div>
                    ))}
                    <button
                      className="answer-button"
                      onClick={handleAnswersSubmit}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Submit Answers"}
                    </button>
                  </div>
                )}
              <div className="update-section">
                <h3>Has something changed?</h3>

                <p className="update-description">
                  Tell NextStep if anything has changed in your situation.
                </p>

                <textarea
                  value={updateText}
                  onChange={(event) => setUpdateText(event.target.value)}
                  placeholder="Example: My laptop is fixed now, so I can work on the project."
                />

                <button
                  className="update-button"
                  onClick={handleUpdateSubmit}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update My Situation"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
