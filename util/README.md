# Clustering Tweets to learn about Evacuation

This project has been ported to javascript and node to better utilize the `@turfjs` library.

Using `async.queue`, multiple workers run in parallel to process individual geojson files.

The minimum requirements for the geojson files are to include the following `properties`:

    {
      user: <string>
      date: <ISO Date>
      text: <string>
    }

The worker function will handle the rest.
