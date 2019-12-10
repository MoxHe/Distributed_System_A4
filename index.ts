import AWS, { config } from 'aws-sdk';
import mysql from 'serverless-mysql'
import { Context, Callback, APIGatewayEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { setMaxListeners } from 'cluster';


const db = mysql({
    config: {
        host: "database-1.cufeptd00xps.us-east-1.rds.amazonaws.com",
        user: "admin",
        password: "Hmx_19950228",
        port: 3306,
        database: "LiftRides"
        
    }
})

// /skiers/{resortID}/seasons/{seasonID}/days/{dayID}/skiers/{skierID}
export const handler: Handler<APIGatewayEvent> =
    async (event: APIGatewayEvent, context: Context, callback: Callback): Promise<APIGatewayProxyResult> => {
        context.callbackWaitsForEmptyEventLoop = false

        if (event.httpMethod === 'POST') {
            var parts = event.path.split("/");
            var resortID = parts[2];
            var seasonID = parts[4];
            var dayID = parts[6];
            var skierID = parts[8];
            var body = JSON.parse(event.body === null ? "{}" : event.body)
            var time = body.time;
            var liftID = body.liftID;
            var vertical = 10 * Number(skierID);
            
            console.log([resortID, seasonID, dayID, skierID, liftID, time, vertical]);

            var sql = "INSERT IGNORE INTO LiftRidesWrite (resortID, seasonID, dayID, skierID, liftID, time, vertical) VALUES ?";
            var values = [[resortID, seasonID, dayID, skierID, liftID, time, vertical]];
            const result = await db.query(sql, [values])

            sql = "INSERT INTO LiftRidesRead (resortID, seasonID, dayID, skierID, totalVertical) VALUES ? "+
        "ON DUPLICATE KEY UPDATE totalVertical = totalVertical + VALUES(totalVertical)";
            values = [[resortID, seasonID, dayID, skierID, vertical]];
            await db.query(sql, [values]);

            db.end();

            return {
                statusCode: 201,
                body: 'post success ' + JSON.stringify(result)
            };

        } else if (event.httpMethod === 'GET') {
            var parts = event.path.split("/");
            var resortID = parts[2];
            var seasonID = parts[4];
            var dayID = parts[6];
            var skierID = parts[8];

            var sql = "SELECT totalVertical FROM LiftRidesRead WHERE resortID = ? AND seasonID = ? AND dayID = ? AND skierID = ?";
            var prams = [resortID, seasonID, dayID, skierID];
            const result: Array<any> = await db.query(sql, prams);

            db.end();
            return {
                statusCode: 200,
                body: JSON.stringify(result[0].totalVertical)
            }
            
        }
        return {
            statusCode: 200,
            body: 'error'
        };
    }