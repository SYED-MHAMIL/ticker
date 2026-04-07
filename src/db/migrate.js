import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./index.js";
import { withTransaction } from "../utils/transaction.js";
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");



// ensure migration table
// 2. getaplied migration
// 3. runMigrationFile with actual folder

// 4.   runmigration file :
//          . get your sqls
//          .  is check alread applaied if yes skip 
//          . 


async function ensureMigrationTable() {
    const query = `
    CREATE TABLE IF NOT EXISTS migrations (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,   
    )
    `
    await db.query(query) 
}


// helper for get applaied migration to avoid run again and again and also to run in order of migration file
async function getApplaiedmigrations() {
    const query = `
        SELECT name from migrations ORDER BY id
    `
    await db.query(query) 
}


// helper for run migration file to insert in migration table and also run the sql file and also to run in order of migration file , and also to run in transaction to avoid any error in migration file and also to rollback if any error in migration file
async function runMigrationFile(filename) {
    const sql = `INSERT name INTO migrations VALUES($1)` 
    const migrationFiles = path.join(migrationsDir,filename)

    withTransaction(async(client)=>{
        await client.query(sql,[filename])
        await client.query(migrationFiles)
    })
}

const runMigrations = async () => {
    try {
        await ensureMigrationTable()
        const applaiedMigrations = new Set(await getApplaiedmigrations())
         const files =  fs.readdirSync(migrationsDir).filter(file=> file.endsWith(".sql")) 

         for(let file of files){
            if(applaiedMigrations.has(file)){
                console.log(`Migration file ${file} is already applied, skipping...`);
               continue;
            }
            console.log(`Running migration file ${file}...`);
            await runMigrationFile(file)
         }


    } catch (error) {
        new ApiError(500, "Error in running migrations", error)      
    }
}

runMigrations().then(()=>{
    console.log("Migrations run successfully");
    process.exit(0)
}   ).catch(err=>{
    console.log("Error in running migrations", err);
    process.exit(1)
})
