/* global require exports process console */
/**
* doneGeoQuery
*
* a function that executes when the geoquery is done fetching
* the list of active segments and times for the appropriate geo select
* (line, area, etc)
*
* fires off the data queries for each row returned from the geo query
*
**/

var ddq = require('./doDataQueryCDB').doDataQuery
var couchCache = require('calvad_couch_cacher').couchCache;
var reducer = require('calvad_reducer').reducer
var _ = require('lodash');
var queue = require('queue-async')


function doneGeoQuery(features,year,options,next){

    var accumulatedFeatures = options.accumulatedFeatures
    if(!accumulatedFeatures) throw new Error('need accumulated features new accumulate_features(docid) in options')

    // sometimes I don't have anything for a geometry in the
    // time period desired
    if(_.isEmpty(features)){
        console.log('features is empty, nothing to do');
        return next();
    }
    console.log('got features inside geo, now get data')

    //
    // To minimize RAM hit, sort by freeway
    var groupFeatures = _.groupBy(features,
                                  function(f){
                                      return f.properties.freeway
                                  })

    console.log('freeways:',Object.keys(groupFeatures))



    // *********************************************************

    // look at the features output, get the detector ids, get
    // summary data for each.

    // redoing things a bit here.

    var q = queue(1)
    _.each(groupFeatures,function(fwy_features,fwy){
        q.defer(processGroup,fwy,fwy_features,year,options)
    })
    q.awaitAll(function(e,f_hashes){
        f_hashes.forEach(function(featurehash){
            accumulatedFeatures
                .add_data(featurehash)
                .header(featurehash.header)
            return null
        })
        return next(null,accumulatedFeatures)
    })
    return null
}

function processGroup (freeway,gfeatures,year,config,cb){
    // send in a freeway, its group
    console.log('freeway is '+freeway+', with features length: '+gfeatures.length)
    console.log('start timer:',new Date())

    var accumulator = new reducer({'time_agg':'hourly'
                                   ,'spatial_agg':'freeway'});
    var getter = couchCache(
        _.assign({years:year},config.couchdb)
    ).get(accumulator.process_collated_record)

    var hd1,hd2
    var q = queue(1)
    gfeatures.forEach(function(feature){
        q.defer(getter,feature)
    })
    q.await(function(e,r){
        console.log('all features have been retrieved');
        // to minimize RAM hit,
        // when done with freeway (which is right
        // now), compress the reducer.  stash those
        //
        var featurehash = accumulator.stash_out({},'freeway')
        //accumulator.reset()
        console.log(freeway+' props data length: '
                    ,featurehash.properties.data.length)
        return cb(null,featurehash)
    })

    return null
}

exports.doneGeoQuery = doneGeoQuery
