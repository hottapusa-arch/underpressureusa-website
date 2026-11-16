
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
      { status: 400 }
    );
  }

  try {
    const feedUrl =
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;

    const response = await fetch(feedUrl);

    if (!response.ok) {
      throw new Error(`YouTube feed returned ${response.status}`);
    }

    const xml = await response.text();

    const entries = [...xml.matchAll(
      /<entry>([\s\S]*?)<\/entry>/gi
    )];

    const videos = entries.map(match => {
      const entry = match[1];

      return {
        videoId: entry.match(
          /<yt:videoId>([^<]+)<\/yt:videoId>/i
        )?.[1],
        title: decodeXml(
          entry.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ''
        ),
        published: entry.match(
          /<published>([^<]+)<\/published>/i
        )?.[1] || null,
      };
    }).filter(video => video.videoId && video.published);

    if (!videos.length) {
      throw new Error('No videos found in playlist feed');
    }

    videos.sort(
      (a, b) =>
        new Date(b.published).getTime() -
        new Date(a.published).getTime()
    );

    const latest = videos[0];

    return Response.json(
      {
        series,
        playlistId,
        ...latest,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=900',
        },
      }
    );

  } catch (error) {
    return Response.json(
      {
        error: 'Latest video unavailable',
        detail: error.message,
      },
      { status: 502 }
    );
  }
}
