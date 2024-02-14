/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");

// Initialize the database
const dbFile = "./.data/words.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;

/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database,
  })
  .then(async (dBase) => {
    db = dBase;

    // We use try and catch blocks throughout to handle any database errors
    try {
      // The async / await syntax lets us write the db operations in a way that won't block the app
      if (!exists) {
        // Database doesn't exist yet - create Choices and Log tables
        await db.run(
          "CREATE TABLE Words (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)"
        );

        // Add default choices to table
        await db.run(
          "INSERT INTO Words (name) VALUES ('Lejon'), ('Blomma'), ('Krona')"
        );

        await db.run(
          "CREATE TABLE Game (id INTEGER PRIMARY KEY AUTOINCREMENT, wordId INTEGER)"
        );

        await db.run(
          "CREATE TABLE GridData (id INTEGER PRIMARY KEY AUTOINCREMENT, gameId INTEGER, shape TEXT, color TEXT, row INTEGER, column INTEGER)"
        );
      } else {
        // We have a database already - write Choices records to log for info
        console.log(await db.all("SELECT * from Words"));
        console.log(await db.all("SELECT * from Game"));
        console.log(await db.all("SELECT * from GridData"));
        //If you need to remove a table from the database use this syntax
        // db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Our server script will call these methods to connect to the db
module.exports = {
  /**
   * Get the options in the database
   *
   * Return everything in the Choices table
   * Throw an error in case of db connection issues
   */

  getWords: async () => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * from Words");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },
  /*
  getGrids: async (wordId) => {
    // We use a try catch block in case of db errors
    try {
      return await db.all(
        "SELECT * from Game as g JOIN GridData as gd ON g.id = gd.gameId JOIN Words as w ON w.id = g.wordId"
      );
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },
  */
  getWord: async (id) => {
    try {
      return await db.all("SELECT * from Words WHERE id = ?", [id]);
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },
  getGridsByWordId: async (wordId) => {
    // We use a try catch block in case of db errors
    try {
      const gridData = await db.all(
        "SELECT * FROM Game AS g JOIN GridData AS gd ON g.id = gd.gameId WHERE g.wordId = ?",
        [wordId]
      );
      const games = {};
      gridData.forEach((row) => {
        const { gameId, ...gridItem } = row;
        if (!games[gameId]) {
          games[gameId] = { gameId, gridData: [] };
        }
        games[gameId].gridData.push(gridItem);
      });

      const gamesArray = Object.values(games);

      return gamesArray;
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  getRandomDrawing: async () => {
    try {
      const randomGameId = await db.get(
        "SELECT id FROM Game ORDER BY RANDOM() LIMIT 1"
      );
      if (randomGameId) {
        const gameId = randomGameId.id;
        const gridData = await db.all(
          "SELECT * FROM GridData WHERE gameId = ?",
          [gameId]
        );
        return gridData;
      } else {
        return null;
      }
    } catch (dbError) {
      console.error(dbError);
    }
  },

  getRandomWord: async () => {
    try {
      return await db.all("SELECT * from Words ORDER BY RANDOM() LIMIT 1");
    } catch (dbError) {
      console.error(dbError);
    }
  },
  getWords: async () => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * from Words");
    } catch (dbError) {
      console.error(dbError);
    }
  },
  addWord: async (word) => {
    // We use a try catch block in case of db errors
    try {
      return await db.run("INSERT INTO Words (name) VALUES (?)", [word]);
    } catch (dbError) {
      console.error(dbError);
    }
  },
  removeWord: async (wordId) => {
    try {
      
      await db.run(
        "DELETE FROM GridData WHERE gameId IN (SELECT id FROM Game WHERE wordId = ?)",
        [wordId]
      );

      await db.run("DELETE FROM Game WHERE wordId = ?", [wordId]);

      await db.run("DELETE FROM Words WHERE id = ?", [wordId]);

      return true;
    } catch (dbError) {
      console.error(dbError);
      return false;
    }
  },
    removeGame: async (gameId) => {
    try {
      
      await db.run(
        "DELETE FROM GridData WHERE gameId = ?",
        [gameId]
      );

      await db.run("DELETE FROM Game WHERE id = ?", [gameId]);

      return true;
    } catch (dbError) {
      console.error(dbError);
      return false;
    }
  },

  getWordsWithThumbnail: async () => {
    // We use a try catch block in case of db errors
    try {
      const wordsData = await db.all("SELECT * from Words");
      const wordsAndDrawings = [];
      for (const wordData of wordsData) {
        const gridData = await db.all(
          "SELECT * FROM GridData WHERE gameId IN (SELECT id FROM Game WHERE wordId = ? LIMIT 1)",
          [wordData.id]
        );
        wordsAndDrawings.push({
          word: wordData,
          grid: gridData,
        });
      }
      return wordsAndDrawings;
    } catch (dbError) {
      console.error(dbError);
    }
  },
  saveGrid: async (gridData, wordId) => {
    try {
      if (gridData.length > 0) {
        const result = await db.run("INSERT INTO Game (wordId) VALUES (?)", [
          wordId,
        ]);

        const gameId = result.lastID;

        for (const item of gridData) {
          const { row, column, color, shape } = item;
          await db.run(
            "INSERT INTO GridData (gameId, shape, color, row, column) VALUES (?, ?, ?, ? ,?)",
            [gameId, shape, color, row, column]
          );
        }
        return true;
      } else {
        return false;
      }
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * Process a user vote
   *
   * Receive the user vote string from server
   * Add a log entry
   * Find and update the chosen option
   * Return the updated list of votes
  processVote: async vote => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      // Check the vote is valid
      const option = await db.all(
        "SELECT * from Choices WHERE language = ?",
        vote
      );
      if (option.length > 0) {
        // Build the user data from the front-end and the current time into the sql query
        await db.run("INSERT INTO Log (choice, time) VALUES (?, ?)", [
          vote,
          new Date().toISOString()
        ]);

        // Update the number of times the choice has been picked by adding one to it
        await db.run(
          "UPDATE Choices SET picks = picks + 1 WHERE language = ?",
          vote
        );
      }

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      console.error(dbError);
    }
  },
  **/
};
