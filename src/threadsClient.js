import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function postToThreads(text) {
  const userId = process.env.THREADS_USER_ID;
  const token = process.env.THREADS_ACCESS_TOKEN;

  try {
    // 1. Create the media container
    const container = await axios.post(`https://graph.threads.net/v1.0/${userId}/threads`, null, {
      params: {
        media_type: 'TEXT',
        text: text,
        access_token: token
      }
    });

    const creationId = container.data.id;

    // 2. Publish the container
    const publishResponse = await axios.post(`https://graph.threads.net/v1.0/${userId}/threads_publish`, null, {
      params: {
        creation_id: creationId,
        access_token: token
      }
    });

    console.log("✅ Successfully posted to Threads! Post ID:", publishResponse.data.id);
    return publishResponse.data;

  } catch (error) {
    console.error("❌ Threads API Error:");
    if (error.response) {
      // This helps you see exactly why Meta rejected it (e.g., "Token Expired")
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}