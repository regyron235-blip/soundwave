import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import SpotifyWebApi from 'spotify-web-api-node';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Helper to get Spotify access token
let tokenExpiration = 0;
async function ensureSpotifyToken() {
  if (Date.now() >= tokenExpiration) {
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body['access_token']);
      tokenExpiration = Date.now() + (data.body['expires_in'] * 1000) - 60000;
      console.log('Spotify token refreshed');
      return true;
    } catch (err) {
      console.error('Error refreshing Spotify token:', err);
      return false;
    }
  }
  return true;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize token on start
  await ensureSpotifyToken();

  // API Routes
  app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
      await ensureSpotifyToken();
      
      // Search Spotify
      const spPromise = spotifyApi.searchTracks(q as string, { limit: 10 });
      
      // Search YouTube (Simplified for demo, using public YouTube Search if needed or a mock for this stage)
      // For a real app, you'd use YouTube Data API or similar
      const ytPromise = axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(q as string)}&sp=EgIQAQ%253D%253D`)
        .then(() => []) // Mocking YT for now as it requires specific API handling
        .catch(() => []);

      const [spRes] = await Promise.all([spPromise, ytPromise]);

      const tracks = spRes.body.tracks?.items.map(item => ({
        id: item.id,
        title: item.name,
        artist: item.artists.map(a => a.name).join(', '),
        cover: item.album.images[0]?.url,
        preview: item.preview_url,
        dur_ms: item.duration_ms,
        source: 'spotify',
        uri: item.uri
      })) || [];

      res.json(tracks);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
