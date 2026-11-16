
const PLAYLISTS = {
  underground: 'PLB4-XaSkLK8s',
  why: 'PLCq0-UCOI_bk',
};

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
    const apiKey = context.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    let pageToken = '';
    let latest = null;
    let pagesChecked = 0;

    do {
      const apiUrl = new URL(
        'https://www.googleapis.com/youtube/v3/playlistItems'
      );

      apiUrl.searchParams.set('part', 'snippet');
      apiUrl.searchParams.set('playlistId', playlistId);
      apiUrl.searchParams.set('maxResults', '50');
      apiUrl.searchParams.set('key', apiKey);

      if (pageToken) {
        apiUrl.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(apiUrl.toString());

      if (!response.ok) {
        throw new Error(
          `YouTube API returned ${response.status}`
        );
      }

      const data = await response.json();

      for (const item of data.items || []) {
        const snippet = item.snippet || {};
        const videoId = snippet.resourceId?.videoId;
        const addedAt = snippet.publishedAt;

        if (!videoId || !addedAt) continue;
        if (snippet.title === 'Deleted video') continue;
        if (snippet.title === 'Private video') continue;

        if (
          !latest ||
          Date.parse(addedAt) > Date.parse(latest.addedAt)
        ) {
          latest = {
            videoId,
            title: snippet.title,
            addedAt,
            published: snippet.videoPublishedAt || null,
          };
        }
      }

      pageToken = data.nextPageToken || '';
      pagesChecked++;
    } while (pageToken && pagesChecked < 20);

    if (!latest) {
      throw new Error('No accessible videos found');
    }

    return Response.json(
      {
        series,
        playlistId,
        ...latest,
      },
      {
        headers: {
          'Cache-Control':
            'public, max-age=300, s-maxage=900',
        },
      }
    );
  } catch (error) {
    return Response.json(
      {
        error: 'Latest video unavailable',
        detail: error.message,
      },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
