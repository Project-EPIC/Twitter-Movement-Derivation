# Data Acquisition

These tweets are being retrieved through the GNIP Historical Powertrack API.

The query configuration files are located in the ```GNIP_Query``` folder.


## Initial Data Cleaning

GNIP data is not the cleanest... (3,658,714 total tweets; ~20000 are not geotagged)

The `Spark-LoadCleanSortExport.ipynb` notebook loads all the GNIP tweets from Spark, converts to JSON, and writes out specific subsets of the data to the `working_data` directory.

- Extracts just the geo tweets (3,632,625)
- Finds the users who made these tweets in Zone A
- Finds just the tweets in Zone A
- Writes all these out as `geojsonl` files to the `working_data` directory


### Previous Queries (Deprecated)

[Manhattan Status](https://historical.gnip.com/accounts/CUResearch/publishers/twitter/historical/track/jobs/nv01wesa8d.json) | 
[Data](https://historical.gnip.com/accounts/CUResearch/publishers/twitter/historical/track/jobs/nv01wesa8d/results.json)

[Rockaways](https://historical.gnip.com:443/accounts/CUResearch/publishers/twitter/historical/track/jobs/gb1m638ktp.json) | 
[Data](https://historical.gnip.com/accounts/CUResearch/publishers/twitter/historical/track/jobs/gb1m638ktp/results.json)

[Staten Island](https://historical.gnip.com:443/accounts/CUResearch/publishers/twitter/historical/track/jobs/p510n2hvqp.json) | 
[Data](https://historical.gnip.com:443/accounts/CUResearch/publishers/twitter/historical/track/jobs/p510n2hvqp/results.json)

##### GNIP to PostGIS Pipeline?
1. Download all data from GNIP (in Parallel) to EPIC-Processing
2. Process the data with Spark as GNIPTweet Objects; save only those that fall within ZoneA.
3. Put these into a PostGIS Database?

