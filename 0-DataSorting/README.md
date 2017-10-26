# Data Acquisition

The first set of tweets to be fetched are the geotagged tweets within specific spatiotemporal bounds (ie, in the bounding box, over a period of months before and after a storm). Tweets are being retrieved through the GNIP Historical Powertrack API.

The details for each collection can be found in the [GNIP](https://github.com/Project-EPIC/GNIP) repository.

## Data Format

The first step in the geovulnerable pipeline step expects a directory of `geojsonl` files of tweets per user.

There are scripts in the [GNIP](https://github.com/Project-EPIC/GNIP) repository to convert GNIP data to `geojsonl`.


### Spark Method (Deprecated)

GNIP data is not the cleanest... (3,658,714 total tweets; ~20000 are not geotagged)

The `Spark-LoadCleanSortExport.ipynb` notebook loads all the GNIP tweets from Spark, converts to JSON, and writes out specific subsets of the data to the `working_data` directory.

- Extracts just the geo tweets (3,632,625)
- Finds the users who made these tweets in Zone A
- Finds just the tweets in Zone A
- Writes all these out as `geojsonl` files to the `working_data` directory