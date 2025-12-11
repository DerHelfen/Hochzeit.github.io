/**
 * @fileoverview Wedding website webhook handler for Telegram notifications and game scores
 * @author Your Name
 *
 * Required OAuth Scopes:
 * - https://www.googleapis.com/auth/spreadsheets
 * - https://www.googleapis.com/auth/script.external_request
 */

const TELEGRAM_BOT_TOKEN = "xxx";
const TELEGRAM_CHAT_ID = "xxx";
const SPREADSHEET_ID = "xxx";

/**
 * Simple test function to trigger OAuth authorization
 * Run this function first to authorize permissions
 */
function simpleAuthTest() {
  // This will trigger Sheets API authorization
  const sheet = SpreadsheetApp.create("TempAuthTest");
  Logger.log("Created temp sheet: " + sheet.getId());

  // Clean up - delete the temp sheet
  DriveApp.getFileById(sheet.getId()).setTrashed(true);

  // This will trigger URL Fetch authorization
  UrlFetchApp.fetch("https://www.google.com");

  return "Authorization completed!";
}

/**
 * @OnlyCurrentDoc
 * Force authorization by accessing multiple Google services
 * Run this function first to authorize all required permissions
 */
function forceAuthorization() {
  try {
    // Access Spreadsheet service
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log("Sheet access: " + sheet.getName());

    // Access URL Fetch service
    const response = UrlFetchApp.fetch("https://httpbin.org/status/200");
    Logger.log("URL fetch access: " + response.getResponseCode());

    // Test basic operations
    const testSheet =
      sheet.getSheetByName("Highscores") || sheet.insertSheet("Highscores");
    testSheet.appendRow(["Test", "0", new Date()]);
    Logger.log("Sheet write access successful");

    return "All permissions authorized successfully!";
  } catch (error) {
    Logger.log("Authorization error: " + error.toString());
    throw error;
  }
}

function doPost(e) {
  // Log everything for debugging
  console.log("=== INCOMING REQUEST ===");
  console.log("Raw event:", JSON.stringify(e));
  console.log("Parameters:", JSON.stringify(e.parameter));
  console.log("Type received:", e.parameter.type);

  try {
    const name = e.parameter.name || "Unbekannt";
    const type = e.parameter.type || "easter_egg";

    console.log("Parsed - Name:", name, "Type:", type);

    let message = "";

    switch (type) {
      case "easter_egg":
        message = `🎉 Easter Egg entdeckt!\n\nName: ${name}\nZeitpunkt: ${new Date().toLocaleString(
          "de-DE",
          { timeZone: "Europe/Berlin" }
        )}`;
        break;

      case "playlist":
        let songsText = "";
        try {
          const songsJson = e.parameter.songs || "[]";
          const songs = JSON.parse(songsJson);
          if (songs && songs.length > 0) {
            songsText = songs.map((s, i) => `${i + 1}. ${s}`).join("\n");
          } else {
            songsText = "(Keine Songs angegeben)";
          }
        } catch (parseError) {
          songsText = e.parameter.songs || "(Keine Songs angegeben)";
        }

        const userMessage = e.parameter.message || "";

        message = `🎵 Neue Musikwünsche!\n\nVon: ${name}\n\nSongs:\n${songsText}`;
        if (userMessage) {
          message += `\n\nNachricht: ${userMessage}`;
        }
        message += `\n\nZeitpunkt: ${new Date().toLocaleString("de-DE", {
          timeZone: "Europe/Berlin",
        })}`;
        break;

      case "game_highscore":
        const score = parseInt(e.parameter.score) || 0;
        const isNewRecord = saveScoreToSheet(name, score);

        if (isNewRecord) {
          message = `🎮 Neuer Highscore!\n\n👤 Name: ${name}\n🏆 Score: ${score}\nZeitpunkt: ${new Date().toLocaleString(
            "de-DE",
            { timeZone: "Europe/Berlin" }
          )}`;
        } else {
          message = `🎮 Score eingereicht!\n\n👤 Name: ${name}\n⭐ Score: ${score}\nZeitpunkt: ${new Date().toLocaleString(
            "de-DE",
            { timeZone: "Europe/Berlin" }
          )}`;
        }
        console.log("Game highscore message:", message);
        break;

      default:
        message = `📬 Unbekannte Nachricht\n\nTyp: ${type}\nName: ${name}`;
        break;
    }

    console.log("Final message:", message);

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const telegramResponse = UrlFetchApp.fetch(telegramUrl, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    console.log("Telegram response:", telegramResponse.getContentText());

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log("ERROR:", error.message);
    console.log("Stack:", error.stack);

    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  console.log("=== GET REQUEST ===");
  console.log("Parameters:", JSON.stringify(e.parameter));

  try {
    const action = e.parameter.action;

    if (action === "champion") {
      const champion = getCurrentChampion();
      console.log("Returning champion:", champion);

      return ContentService.createTextOutput(
        JSON.stringify(champion)
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "Webhook is running" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.log("GET ERROR:", error.message);
    return ContentService.createTextOutput(
      JSON.stringify({ name: "Noch kein Champion", score: 0 })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function testHighscore() {
  const mockEvent = {
    parameter: {
      type: "game_highscore",
      name: "TestSpieler",
      score: "42",
    },
  };
  doPost(mockEvent);
}

function saveScoreToSheet(name, score) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("Highscores");

    if (!sheet) {
      sheet = ss.insertSheet("Highscores");
      sheet.appendRow(["Name", "Score", "Date"]);
    }

    // Get all data to check for existing player
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      // No data yet, add first score
      sheet.appendRow([name, score, new Date()]);
      return true;
    }

    const data = sheet.getRange("A2:C" + lastRow).getValues();
    let playerRowIndex = -1;
    let existingScore = 0;

    // Find if player already exists
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === name) {
        playerRowIndex = i + 2; // +2 because we start from A2 and sheet is 1-indexed
        existingScore = parseInt(data[i][1]) || 0;
        break;
      }
    }

    if (playerRowIndex > 0) {
      // Player exists, update if new score is higher
      if (score > existingScore) {
        sheet.getRange(playerRowIndex, 2).setValue(score); // Update score
        sheet.getRange(playerRowIndex, 3).setValue(new Date()); // Update date
        console.log(
          `Updated ${name}'s score from ${existingScore} to ${score}`
        );
        return true; // New record
      } else {
        console.log(
          `${name}'s score ${score} not higher than existing ${existingScore}`
        );
        return false; // Not a new record
      }
    } else {
      // New player
      sheet.appendRow([name, score, new Date()]);
      console.log(`Added new player ${name} with score ${score}`);
      return true; // New record (new player)
    }
  } catch (error) {
    console.log("Error saving score to sheet:", error);
    return false;
  }
}

function getCurrentChampion() {
  try {
    console.log("Getting current champion...");

    // Get or create the scores sheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("Highscores");

    if (!sheet) {
      console.log("No Highscores sheet found, creating one...");
      sheet = ss.insertSheet("Highscores");
      sheet.appendRow(["Name", "Score", "Date"]);
      return { name: "Noch kein Champion", score: 0 };
    }

    const lastRow = sheet.getLastRow();
    console.log("Last row in sheet:", lastRow);

    if (lastRow <= 1) {
      console.log("No data in sheet yet");
      return { name: "Noch kein Champion", score: 0 };
    }

    // Find the highest score
    const data = sheet.getRange("A2:C" + lastRow).getValues();
    console.log("Data from sheet:", data.length, "rows");

    if (data.length === 0) {
      return { name: "Noch kein Champion", score: 0 };
    }

    let champion = { name: "Noch kein Champion", score: 0 };
    data.forEach((row, index) => {
      const rowScore = parseInt(row[1]) || 0;
      console.log(`Row ${index}: ${row[0]} - ${rowScore}`);
      if (rowScore > champion.score) {
        champion = { name: row[0], score: rowScore };
      }
    });

    console.log("Final champion:", champion);
    return champion;
  } catch (error) {
    console.log("Error getting champion:", error.message);
    console.log("Error stack:", error.stack);
    return { name: "Noch kein Champion", score: 0 };
  }
}
