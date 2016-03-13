# Rentswatch API

Read the complete API documentation here: http://api.rentswatch.com/

# FAQ

## What’s Rentswatch?

Rentswatch is a database of rents prices in Europe in the open market (it does not cover subsidized housing). No public administration provides this information, even though we need it to assess the situation of the rental market. We stepped in.

## How is the data collected?

Rentswatch collects a sample of ads for rentals throughout Europe. Data collection sources include publicly advertised material, inclusion of existing databases and direct data collection from individuals.

## How is the data validated?

It happens that some data points were intended for a flat sale and not a flat rental or that the living space of a house is actually its number of rooms. Scammers can game the data by offering flats under market prices. Having worked with the data, we estimate that 99% of the data points regarding living space and rental price are corrects. In the data offered by the API, we automatically remove data points with extreme values to reduce the risk of contamination.

Location data is extracted based on the information available on each data point. An data point for which we have a precise address will be geolocated at this address. An data point that simply says the object is at “Ljubljana” will be geolocated at the center of Ljubljana.

## Can the data be compared across borders?

A rent is not the same thing in every country. In Berlin, real estate brokers are forbidden to charge a brokerage fee, so that the fee is passed on in the rental price. In Switzerland, the number of rooms is not counted in the same way in all cantons. These slight variations need to be kept in mind when comparing territories.

We always tried to have as complete as possible a view of the rent, aggregating service charges to the rental price whenever possible.

## Are all the rents on Rentswatch?

Rentswatch only covers flats and houses on the open market, not subsidized housing. Rentswatch gives prices for _new leases_, not the average price of all rents over an area. 

Properties that are put on the market more often are overrepresented (because they appear more often). To estimate the average rents price over an area, we compute the relation between prices and living spaces, making sure to keep the intercept at 0. See this blog post, [Finding the right price per square meter](http://blog.rentswatch.com/finding-the-right-price-per-sqm/), for the details.

## Who pays for Rentswatch?

Rentswatch is financed by the [center for media innovation of Babelsberg](http://www.miz-babelsberg.de/about-us), Brandenburg, Germany.

## Contact

Nicolas Kayser-Bril: nkb@jplusplus.org
