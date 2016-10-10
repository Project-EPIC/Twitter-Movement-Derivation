GeoProcessing
=============
These scripts rely on two modules in this directory, explained below.

##Methods

### 1. Remove Impossible Users

Using _geodistance_ and the timestamp, find user accounts that violate possible speeds of human travel, in this case $240 m/s$ \cite{Jordack}

### 2. Clustering

Using DBScan, find the right threshold for m, $\epsilon$ with different thresholds for numbers of clusters? What does this distribution look like across






## [geodistance](https://github.com/eamonustc/geodistance)

Allows us to use the haversine distance formula. This is a fast and efficient method which allows us to not have to deal with projections and such.


## [dbscan_python](https://github.com/choffstein/dbscan)

_Density Based Spatial Clustering of Applications with Noise_

Using this clustering method allows us to filter out the one-offs and the random points where users tweet.


# Methods

