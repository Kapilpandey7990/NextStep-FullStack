const BASE_URL = process.env.NEXTSTEP_API_URL;
const CANDIDATE_ID = process.env.CANDIDATE_ID;

const API_TIMEOUT = 10000;

const createHeaders = (idempotencyKey, chaosMode) => {
  const headers = {
    Accept: "application/json",
    "X-Candidate-Id": CANDIDATE_ID,
    "Content-Type": "application/json",
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }
  if (chaosMode) {
    headers["X-Chaos"] = chaosMode;
  }

  return headers;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  let data = null;

  if (rawBody) {
    if (!contentType.includes("application/json")) {
      const error = new Error(
        `NextStep API returned a non-JSON response (${response.status})`,
      );

      error.status = response.status;
      error.requestId = response.headers.get("X-Request-Id");
      error.retryAfter = response.headers.get("Retry-After");

      throw error;
    }

    try {
      data = JSON.parse(rawBody);
    } catch {
      const error = new Error(
        `NextStep API returned malformed JSON (${response.status})`,
      );

      error.status = response.status;
      error.code = "MALFORMED_JSON";
      error.requestId = response.headers.get("X-Request-Id");
      error.retryAfter = response.headers.get("Retry-After");

      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        `NextStep API request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.code = data?.error || null;
    error.requestId = response.headers.get("X-Request-Id");
    error.retryAfter = response.headers.get("Retry-After");

    throw error;
  }

  return data;
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, API_TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("NextStep API request timed out");

      timeoutError.status = 504;
      timeoutError.code = "API_TIMEOUT";

      throw timeoutError;
    }

    const networkError = new Error("NextStep API is unavailable");

    networkError.status = 503;
    networkError.code = "API_UNAVAILABLE";

    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }
};

const createSituation = async (payload, idempotencyKey, chaosMode) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/v1/situations`, {
      method: "POST",
      headers: createHeaders(idempotencyKey, chaosMode),
      body: JSON.stringify(payload),
    });

    return await parseResponse(response);
  } catch (error) {
    if (
      error.code === "MALFORMED_JSON" ||
      error.status === 429 ||
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504
    ) {
      console.log(`NextStep API returned ${error.status}. Retrying once...`);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const retryResponse = await fetchWithTimeout(
        `${BASE_URL}/v1/situations`,
        {
          method: "POST",
          headers: createHeaders(idempotencyKey, chaosMode),
          body: JSON.stringify(payload),
        },
      );

      return await parseResponse(retryResponse);
    }

    throw error;
  }
};

const getSituation = async (situationId) => {
  const response = await fetchWithTimeout(
    `${BASE_URL}/v1/situations/${situationId}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Candidate-Id": CANDIDATE_ID,
      },
    },
  );

  return parseResponse(response);
};

const answerQuestions = async (situationId, payload, idempotencyKey) => {
  try {
    const response = await fetchWithTimeout(
      `${BASE_URL}/v1/situations/${situationId}/answers`,
      {
        method: "POST",
        headers: createHeaders(idempotencyKey),
        body: JSON.stringify(payload),
      },
    );

    return await parseResponse(response);
  } catch (error) {
    if (error.code === "MALFORMED_JSON") {
      console.log(
        "Malformed response received. Recovering latest situation...",
      );

      return await getSituation(situationId);
    }

    throw error;
  }
};

const updateSituation = async (situationId, payload, idempotencyKey) => {
  const response = await fetchWithTimeout(
    `${BASE_URL}/v1/situations/${situationId}/updates`,
    {
      method: "POST",
      headers: createHeaders(idempotencyKey),
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
};

module.exports = {
  createSituation,
  getSituation,
  answerQuestions,
  updateSituation,
};
