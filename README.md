# [Public Radio Finder](https://btoe.ws/npr)

[https://btoe.ws/npr](https://btoe.ws/npr)

Public Radio Finder finds the public radio stations (NPR stations) in the United States with the best chance of being available at your current location. Results are based on [station data](https://www.fcc.gov/media/radio/cdbs-database-public-files) and [service contour data](https://www.fcc.gov/media/radio/fm-service-contour-data-points) published by the FCC.

Visiting the tool in your browser loads data for all public radio stations in the United States. As your location changes, the results are updated automatically. This means you can load the tool while you have cell phone service in Denver and then find the nearest NPR station when you make it to middle-of-nowhere Kanas with no cell phone service.

Station recommendations should be fairly reliable. The FCC publishes "service contours" describing the area where towers' signals should reach and should be free on interference from other stations. This tool calculates your distance to each station using the [haversine formula](https://en.m.wikipedia.org/wiki/Law_of_haversines) and compares that to the FCC's range estimate for that station.

The FCC's data is far from perfect and Wikipedia's [list of NPR stations](https://en.wikipedia.org/wiki/List_of_NPR_stations) is too. If you notice missing or incorrect data, you can reach me on [Twitter](https://twitter.com/bptoews) or open a GitHub issue [here](https://github.com/btoews/npr/issues/new).

While this tool requests access to your location, that information never leaves your device. I am not collecting or selling your data.