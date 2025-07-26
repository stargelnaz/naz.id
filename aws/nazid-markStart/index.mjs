import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "us-east-1" });

export const handler = async (event) => {
  const code = JSON.parse(event.body).code;

  const getParams = {
    TableName: "AccessCodes",
    Key: {
      code: { S: code }
    }
  };

  try {
    const data = await db.send(new GetItemCommand(getParams));

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Code not found" })
      };
    }

    // If startTime already exists, don't overwrite
    if (data.Item.startTime) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "Class has already started for this code" })
      };
    }

    // Add current timestamp
    const now = new Date().toISOString();

    const updateParams = {
      TableName: "AccessCodes",
      Key: {
        code: { S: code }
      },
      UpdateExpression: "SET startTime = :startTime",
      ExpressionAttributeValues: {
        ":startTime": { S: now }
      },
      ConditionExpression: "attribute_not_exists(startTime)"
    };

    await db.send(new UpdateItemCommand(updateParams));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Start time recorded", startTime: now })
    };

  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "Class already started for this code" })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error", error: err.message })
    };
  }
};
