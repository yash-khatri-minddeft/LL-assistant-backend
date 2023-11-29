const express = require("express");
const { default: OpenAI } = require("openai");
const app = express();
const ServerlessHttp = require("serverless-http");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config();

// parse application/json
app.use(bodyParser.json());
const { ASSISTANT_ID, OPENAI_API_KEY, ORIGIN } = process.env;
const whitelist = ORIGIN.split(",");
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

app.post("/create-thread", async (req, res) => {
  try {
    const thread = await openai.beta.threads.create();
    res
      .json({ thread, success: true, message: "Thread created Successfully." })
      .status(200);
  } catch (error) {
    res
      .json({ success: false, error, message: "Error while creating thread." })
      .status(200);
  }
});

app.post("/create-message", async (req, res) => {
  try {
    const { threadId, messageText } = req.body;
    const message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: messageText,
    });
    return res
      .json({ message, success: true, message: "message created successfully" })
      .status(200);
  } catch (error) {
    console.log(error);
    res
      .json({ success: false, error, message: "Error while creating message." })
      .status(400);
  }
});

app.post("/run-thread", async (req, res) => {
  try {
    const { threadId } = req.body;
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });
    res.json({ run, success: true, message: "Thread running." }).status(200);
  } catch (error) {
    console.log(error);
    res
      .json({ success: false, error, message: "Error while running thread." })
      .status(400);
  }
});

app.post("/get-thread-status", async (req, res) => {
  try {
    const { threadId, runId } = req.body;
    const myThread = await openai.beta.threads.runs.retrieve(threadId, runId);
    res
      .json({ myThread, success: true, message: "Fetching Thread." })
      .status(200);
  } catch (error) {
    res
      .json({ success: false, error, message: "Error while running thread." })
      .status(400);
  }
});

app.post("/cancel-run", async (req, res) => {
  try {
    const { threadId, runId } = req.body;
    const cancelRun = await openai.beta.threads.runs.cancel(threadId, runId);
    res
      .json({
        cancelRun,
        success: true,
        message: "Thread successfully cancelled.",
      })
      .status(200);
  } catch (error) {
    res
      .json({
        success: false,
        error,
        message: "Error while cancelling thread.",
      })
      .status(400);
  }
});

app.post("/get-messages", async (req, res) => {
  try {
    const { threadId } = req.body;
    const messages = await openai.beta.threads.messages.list(threadId);
    res.json({ messages, success: true }).status(200);
  } catch (error) {
    res
      .json({ success: false, error, message: "Error while getting message." })
      .status(400);
  }
});
if (process.env.ENVIRONMENT === "production") {
  exports.handler = ServerlessHttp(app);
} else {
  app.listen(4000, () => {
    console.log(`Server is listening on port ${4000}.`);
  });
}
