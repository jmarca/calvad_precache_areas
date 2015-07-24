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
