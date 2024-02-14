/**
 * This is the main server script that provides the API endpoints
 * The script uses the database helper in /src
 * The endpoints retrieve, update, and return data to the page handlebars files
 *
 * The API returns the front-end UI handlebars pages, or
 * Raw json if the client requests it with a query parameter ?raw=json
 */

// Utilities we need
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
});

Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});

Handlebars.registerHelper('eq', function(a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

fastify.get("/", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };
  
  const drawingData = await db.getRandomDrawing();
  
  params.drawing = drawingData;
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
});

fastify.get("/draw", async (request, reply) => {

  let params = request.query.raw ? {} : { seo: seo };

  const wordsData = await db.getWords();
  params.word = wordsData;

  params.loop = new Array(7).fill(new Array(7).fill(null));

  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/draw.hbs", params);
});

fastify.get("/admin", async (request, reply) => {
  return reply.view("/src/pages/admin.hbs");
});

fastify.get("/archive", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  const wordsData = await db.getWordsWithThumbnail();
  
  params.words = wordsData;

  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/archive.hbs", params);
});

fastify.get("/archive/:wordId", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };
  const wordId = request.params.wordId;
  const gridData = await db.getGridsByWordId(wordId);
  const wordData = await db.getWord(wordId);
  
  params.grids = gridData;
  params.word = wordData[0];
  
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/archive-word.hbs", params);
});

fastify.post("/saveGrid", async (request, reply) => {
  try {
    const { gridData, wordId } = request.body;
    const result = await db.saveGrid(gridData, wordId);

    if (result) {
      return reply.send({ success: true, message: "Grid saved successfully" });
    } else {
      return reply
        .code(500)
        .send({ success: false, message: "Failed to save data" });
    }
  } catch (error) {
    console.error("Error saving data:", error);
    return reply
      .code(500)
      .send({ success: false, message: "An error occurred while saving data" });
  }
});


fastify.get("/admin/archive", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  const wordsData = await db.getWordsWithThumbnail();
  
  params.words = wordsData;

  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/admin/archive.hbs", params);
});

fastify.get("/admin/archive/:wordId", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };
  const wordId = request.params.wordId;
  const gridData = await db.getGridsByWordId(wordId);
  const wordData = await db.getWord(wordId);
  
  
  console.log(gridData[0])

  
  params.grids = gridData;
  params.word = wordData[0];
  
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/admin/archive-word.hbs", params);
});

fastify.post("/add-word", async (request, reply) => {
  try {
    const { word } = request.body;
     await db.addWord(word);
      return reply.send({ success: true, message: "Word added sucessfully" });
  } catch (error) {
    console.error("Error saving data:", error);
    return reply
      .code(500)
      .send({ success: false, message: "An error occurred while saving data" });
  }
});

fastify.post("/remove-word", async (request, reply) => {
  try {
    const { wordId } = request.body;
   await db.removeWord(wordId);
    return reply.send({ success: true, message: "Word and drawings removed sucessfully" });
  } catch (error) {
    console.error("Error saving data:", error);
    return reply
      .code(500)
      .send({ success: false, message: "An error occurred while saving data" });
  }
});


fastify.post("/remove-drawing", async (request, reply) => {
  try {
    const { gameId } = request.body;
   await db.removeGame(gameId);
    return reply.send({ success: true, message: "Drawing removed sucessfully" });
  } catch (error) {
    console.error("Error saving data:", error);
    return reply
      .code(500)
      .send({ success: false, message: "An error occurred while saving data" });
  }
});



/*
fastify.post("/", async (request, reply) => {
  // We only send seo if the client is requesting the front-end ui
  let params = request.query.raw ? {} : { seo: seo };

  // Flag to indicate we want to show the poll results instead of the poll form
  params.results = true;
  let options;

  // We have a vote - send to the db helper to process and return results
  if (request.body.language) {
    options = await db.processVote(request.body.language);
    if (options) {
      // We send the choices and numbers in parallel arrays
      params.optionNames = options.map((choice) => choice.language);
      params.optionCounts = options.map((choice) => choice.picks);
    }
  }
  params.error = options ? null : data.errorMessage;
  // Return the info to the client
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/index.hbs", params);
});
*/

/**
 * Admin endpoint returns log of votes
 *
 * Send raw json or the admin handlebars page
fastify.get("/logs", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  // Get the log history from the db
  params.optionHistory = await db.getLogs();

  // Let the user know if there's an error
  params.error = params.optionHistory ? null : data.errorMessage;

  // Send the log list
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/admin.hbs", params);
});
**/

/**
fastify.post("/reset", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.failed = "You entered invalid credentials!";

    // Get the log list
    params.optionHistory = await db.getLogs();
  } else {
    // We have a valid key and can clear the log
    params.optionHistory = await db.clearHistory();

    // Check for errors - method would return false value
    params.error = params.optionHistory ? null : data.errorMessage;
  }

  // Send a 401 if auth failed, 200 otherwise
  const status = params.failed ? 401 : 200;
  // Send an unauthorized status code if the user credentials failed
  return request.query.raw
    ? reply.status(status).send(params)
    : reply.status(status).view("/src/pages/admin.hbs", params);
});
**/

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
