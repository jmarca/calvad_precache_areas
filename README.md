# Precache CalVAD area-wide hourlies

This is refactored out of code from geo_bbox, which is a big old
crufty repository with lots of good code but not at all modular.

As this is begun, the goal is to write code that will be able to be
forked.  That is, for each area, fork a job that invokes, say,
precache_this_area.js, which takes the area type, area name, year, and
then runs the code on it.

So basically, I'm pulling in the old version of
detector.area.data.refactor.js, but am rewriting it to not be an
express server route, but rather a stand alone program that I can
fork.

Not to mention, I hope things will be easier to understand in a few
years when I revisit this.

More as I work things out.

# Prerequisites

To use this properly, you have to have a database that actually
contains shapes and roads and so on.

So first make sure you've run all the code in the `detector_segments`
package, which will massage the OpenStreetMap data and then match up
detectors with data versus the correct road segment.

Then, after running `npm install` in this package, you have to make
sure some sqitch changes are deployed to your target database.
Assuming that the target database is on the local machine and it is
called "osm", look within the node_modules directory for
`calvad_areas_sql` and `fips_codes`.  Depending on your version of
npm, these might be found under the root node_modules directory, or
else under a path like

`node_modules/calvad_precahce_areas/node_modules/{fips_codes,calvad_areas_sql}`

typing `npm ls` might help discover them, or else `tree node_modules`

Drop down into the fips_codes package and run

```
sqitch deploy db:pg:osm
```

and then into calvad_areas_sql and run again

```
sqitch deploy db:pg:osm
```

As always, if you database is not called osm, or if it requires a
host, port, etc, then consult the proper formulation of db URIs at

[https://metacpan.org/pod/sqitchtutorial](https://metacpan.org/pod/sqitchtutorial)




# Usage


Once the above prerequisites are installed, then you can run this
package for all of the years you've processed in the
`detector_segments` package.

To run it, at a bare minimum, you type

```
node ./precache.js
```


`precache.js` reads some options from the config.json file, but
requires others on the command line.  A full command line might look
like:

```
node ./precache.js --jobs 6 --root public --subdir data --year 2014
--area counties > counties_2014.log 2>&1 &
```
