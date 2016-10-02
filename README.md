Twitter Movement Derivation 
==========================

Can a _geographically vulnerable_ user be identified by their Twitter behavior?
Can we then determine their movement during a storm?

## Methods
1. Data is extracted from GNIP for the East Coast during Hurricane Sandy. This process is further outlined in the `Data_Aquisition` Directory.

2. Data cleaned and processed with Spark to identify users with (1) tweet in ZoneA. And then clustered with _DBScan_. The details of this are outlined in the `GeoProcessing` Directory.

3. The `DataProcessing` directory filters all of the tweets by time (before, during, and after), and creates tilesets for visualiations.








ScratchPad
----------

Total Tweets (from all Jobs): 3,658,714
This number should be the sum of all the individual jobs, will have to confirm with the Dropbox file

Total Tweets with Geo Tag: 3,632,625... wtf?
