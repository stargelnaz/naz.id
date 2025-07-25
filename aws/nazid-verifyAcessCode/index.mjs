import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({ region: 'us-east-1' });

export const handler = async (event) => {
  console.log('Raw event:', JSON.stringify(event)); // log entire event

  let code;
  try {
    code = JSON.parse(event.body).code;
  } catch (err) {
    console.error('Error parsing event.body:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad request' })
    };
  }

  console.log('Parsed code:', code); // log the code we're looking up

  const params = {
    TableName: 'AccessCodes',
    Key: {
      code: { S: code }
    }
  };

  try {
    const data = await db.send(new GetItemCommand(params));
    console.log('DynamoDB response:', data);

    if (!data.Item) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid code' })
      };
    }

    const email = data.Item.email.S;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Valid code',
        email: email
      })
    };
  } catch (err) {
    console.error('DynamoDB error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error' })
    };
  }
};
