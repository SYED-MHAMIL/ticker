import { db } from "../db/index.js";
const withTransaction = async (handler) => {
  let client;
  try {
    client = await db.connect();
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw new ApiError(406, error);
  } finally {
    client.release();
  }
};

export {withTransaction}