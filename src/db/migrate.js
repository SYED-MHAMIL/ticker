import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const files = ['seat.schema.sql','event.schema.sql','event_seat.schema.sql','booking.schema.sql','payment.schema.sql'];
    for (const file of files) {
        const sql = fs.readFileSync(
            path.join(__dirname, '../models', file),
            'utf8'
        );
        await db.query(sql);
    }
}

runMigration().catch((err) => {
    console.error(err);
    throw new ApiError(400, "Migration error");
});