/* global require exports */

// this one uses computed length from the db, not from caltrans


var pg = require('pg')
var _ = require('lodash')
var queue = require('d3-queue').queue

//
// pull in the code from refactored files
//

var geoQuery = require('detector_postgis_query').geoQuery
var accumulate_features = require('accumulate_features')

var setup_connection = require('./setup_pg_connection.js')


var doneGeoQuery = require('./doneGeoQuery.js')
var writeout_features = require('./writeout_features.js')
var geom_utils = require('geom_utils')

//
// the data service
//

/**
 * get_data
 *
 * @param {} config - the configuration object
 * @param {} area_type - the type of area, like 'counties'
 * @param {} area_name - the name of the area, like 'Alameda' or 'AMA'
 * @param {} year - the year for this run
 * @param {} done - a callback when we're finished
 * @returns {} Nothing
 * @throws {} if anything is wrong will throw a message
 */
function get_data(config,
                  area_type,
                  area_name,
                  year,
                  done){

    var opts = {}
    var accumulatedFeatures,req
    var format = 'json'
    // expecting an osm2 connection string here
    var connectionString = setup_connection(config)

    var q = queue(1) // one thing at a time here;

    // for the server, the "path" is in the pattern
    // "rootdir/counties/hourly/2012/06001.json"
    // or
    // "rootdir/airdistricts/hourly/2012/AMA.json"
    // etc

    // so reconstruct that when it comes time to save the result
    var requestid = ['',area_type,'hourly',year,area_name+'.'+format].join('/')
    // also, people like to read county names, not FIPS codes, so
    var docid = requestid
    if(area_type === 'counties'){
        docid = geom_utils.replace_fips(docid)
    }

    opts = _.assign(opts
                        ,config
                        ,{
                            'area_param': 'areaid'
                            ,'area_type_param': 'area'
                            ,'docid':docid
                            ,'requestid':requestid
                        }
                       )

    //
    // accumulatedFeatures is the big steamer trunk that gets carried
    // throughout the below querying operations, loading up with the
    // information needed
    //
    // It gets passed around via opts
    //
    accumulatedFeatures = new accumulate_features(docid)
    opts.accumulatedFeatures=accumulatedFeatures

    req = {
        'params':{
            'area':area_type,
            'aggregate':'hourly',
            'year':year,
            'areaid':area_name+'',
            'format':'json'
        }
    }

    pg.connect(connectionString,function(e,client,clientdone){
        if(e) throw new Error(e)

        q.defer(function(cb){
            var querier = geoQuery(req,opts,cb)
            querier(null,client,clientdone)
            return null
        })
        q.await(function(er,features){
            var r
            pg.end() // not going to hit pg again in this program
            if(er) throw new Error(er)
            console.log('got',features.length,'features')
            r = queue(1)
            r.defer(doneGeoQuery,features,year,opts)
            r.await(function(err){
                if(err) throw new Error(err)
                writeout_features(features,opts,done)
                return null
            })
            return null

        })
        return null

    })
    return null
}

module.exports = get_data
