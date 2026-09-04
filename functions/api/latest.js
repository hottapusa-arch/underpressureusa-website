const PLAYLISTS = {
  underground: 'PL5j6gGdMnrLs-dy5sS7Sgp4zOMpq3X8HW',
  why: 'PLCq0-UCOI_bk',
};

function decodeXml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const series = url.searchParams.get('series');
  const playlistId = PLAYLISTS[series];

  if (!playlistId) {
    return Response.json(
      { error: 'Unknown series' },
      { status: 400, headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  }

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'UnderPressureUSA/2.0' },
    });

    if (!response.ok) {
      throw new Error(`YouTube feed returned ${response.status}`);
    }

    const xml = await response.text();
    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/i);

    if (!entryMatch) {
      throw new Error('No videos found in playlist feed');
    }

    const entry = entryMatch[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1];
    const title = entry.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/i)?.[1];

    if (!videoId) {
      throw new Error('Video ID missing from playlist feed');
    }

    return Response.json(
      {
        series,
        playlistId,
        videoId,
        title: decodeXml(title || ''),
        published: published || null,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=900',
        },
      }
    );
  } catch (error) {
    return Response.json(
      { error: 'Latest video unavailable', detail: error.message },
      { status: 502, headers: { 'Cache-Control': 'public, max-age=60' } }
    );
  }
}
