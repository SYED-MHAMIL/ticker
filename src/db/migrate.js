import dotenv from "dotenv"
dotenv.config()
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { ApiError } from "../utils/ApiError.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {

    const files = ['user.schema.sql','venue.schema.sql','seat.schema.sql','event.schema.sql','seat_generation_jobs.schema.sql','event_seat.schema.sql','booking.schema.sql','payment.schema.sql'];
    
    for (const file of files) {
        const sql = fs.readFileSync(
            path.join(__dirname, '../models', file),
            'utf8'
        );
        await db.query(sql);
    }

    // *******************************************
    // RBAC autorization
    // *******************************************
    
        async function setSystemRoles() {
            const roles=   ['admin','orginzer','user','venue_owner']
            const values= Array.from({length:roles.length},(_,i)=> `($${i+1})`)
            const query = `
                INSERT  into roles (name)
                VALUES  ${values.join(',')}`
            await db.query(query,roles)
        }
    

    async function setSystemPermission() {
           const roles=   ['create_seat','create_event','create_venue','insert_batches','count_seats','create_venue','setup_payment','create_event','create_event_seat',  'update_event_seat_status','create_event_seat','update_event_seat_Status',  'reserved_seat_booking','get_booked_seat','get_booking_for_update','update_booking_status']
           const values= Array.from({length:roles.length},(_,i)=> `($${i+1})`)
           const query = `
            INSERT  into roles (name)
            VALUES  ${values.join(',')}`
           await db.query(query,roles)
    }
    
    async function connectRolesToPermission() {
        //   for admin role we will give you all permissions
            const  query = `INSERT into
             role_permissions (role_id,permission_id)
             SELECT r.id,p.id FROM roles r, permissions p
             WHERE r.name = 'admin'
            `
            await db.query(query)

            // for organizer role we will give create_event,createVenue,create_seat permission 
            
            const  query1 = `INSERT into
             role_permissions (role_id,permission_id)
                SELECT r.id,p.id 
                FROM roles r
                JOIN permissions p
                 ON p.name In ('create_event','create_venue','create_seat')
                WHERE r.name = 'orginzer' 
                
            `
            await db.query(query1)
             
            
            // for venue_owner we will give them them access of some of routes which is neccesssary to 
           const  query3 = `INSERT into
             role_permissions (role_id,permission_id)
                SELECT r.id,p.id 
                FROM roles r
                JOIN permissions p
                 ON p.name In ('create_event','create_venue','create_seat','delete_event','delete_venue','update_event')
                WHERE r.name = 'venue_owner' 
                
            `
            await db.query(query3)
             
            

            
            
            // for user role we will give you reserved_seat_booking,get_booked_seat,get_booking_for_update,update_booking_status permissions
            const query2 =`
            INSERT into role_permissions (role_id,permission_id)
            SELECT r.id,p.id 
            FROM roles r
            JOIN permissions p
            ON p.name IN (reserved_seat_booking,get_booked_seat,get_booking_for_update,update_booking_status)
            WHERE r.name = 'user'
            `     
             await db.query(query2)




    }


    //  set role && permission from  system or admin
    await setSystemRoles()
    await  setSystemPermission()

    // connect roles to required permissions
    await connectRolesToPermission() 




}

runMigration().catch((err) => {
    console.error(err);
    throw new ApiError(400, "Migration error");
});