const dbHandler = require('../database').dbHandler;

async function insertLog(logHandler, payload) {
  const query = `INSERT INTO push_notification_logs (channel_id, message_id, skipped, ios_failed, ios_success, android_failed, android_success) VALUES (?,?,?,?,?,?,?)`;

  const queryObj = {
    query,
    args: [payload.channel_id, payload.message_id, payload.skipped, payload.ios_failed,
      payload.ios_success, payload.android_failed, payload.android_success],
    event: 'insertLog'
  };

  try {
    const data = dbHandler.executeQuery(logHandler, queryObj);
    return data;
  } catch (error) {
    throw new Error(error);
  }
}

exports.insertLog = insertLog;
