export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from environment variable
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'YouTube API not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&type=video&safeSearch=moderate&videoEmbeddable=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch from YouTube' 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (data.items && data.items[0]) {
      const videoId = data.items[0].id.videoId;
      return new Response(
        JSON.stringify({ 
          success: true,
          videoId,
          title: data.items[0].snippet.title
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No videos found' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('YouTube API error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}