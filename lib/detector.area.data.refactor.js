/* global require exports */

// this one uses computed length from the db, not from caltrans


var pg = require('pg');
var _ = require('lodash');
var queue = require('queue-async')

//
// pull in the code from refactored files
//

var geoQuery = require('detector_postgis_query').geoQuery;
var reducer = require('calvad_reducer').reducer
var accumulate_features = require('accumulate_features')

var setup_connection = require('./setup_pg_connection.js')

// use direct couchdb query of collated records
var couchCache = require('calvad_couch_cacher').couchCache;


var doneGeoQuery = require('./doneGeoQuery.js')
var writeout_features = require('./writeout_features.js')
var geom_utils = require('geom_utils')

//
// the data service
//
function pg_detector_area_data_service(config,
                                       area_type,
                                       area_name,
                                       year,
                                       done){


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
    if(req.params[area_type] == 'counties'){
        docid = geom_utils.replace_fips(docid)
    }

    var opts = _.assign({}
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
    var accumulatedFeatures = new accumulate_features(docid)
    opts.accumulatedFeatures=accumulatedFeatures

    var req = {
        'params':{
            'area':area_type,
            'aggregate':'hourly',
            'year':year,
            'areaid':area_name,
            'format':'json'
        }
    }

    pg.connect(connectionString,function(e,client,clientdone){
        if(e) throw new Error(e)

        q.defer(geoQuery,req,opts)
        q.await(function(e,features){
            clientdone()
            if(e) throw new Error(e)
            var r = queue(1)
            r.defer(doneGeoQuery,features,year,opts)
            r.await(function(e){
                if(e) throw new Error(e)
                writeout_features(features,opts,done)
                return null
            })
            return null

        })
        return null

    })
    return null
}
