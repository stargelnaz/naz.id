import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({ region: "us-east-1" }); 

export const handler = async (event) => {
  const code = JSON.parse(event.body).code;

  const params = {
    TableName: "AccessCodes",
    Key: {
      code: { S: code }
    }
  };

  try {
    const data = await db.send(new GetItemCommand(params));
    if (!data.Item) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Invalid code" })
      };
    }

    const email = data.Item.email.S;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Valid code",
        email: email
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server error" })
    };
  }
};
