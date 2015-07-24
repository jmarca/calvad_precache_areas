/* global require exports */

// this one uses computed length from the db, not from caltrans


var pg = require('pg');
var _ = require('lodash');
var queue = require('queue-async')

var fs = require('fs');
var makedir = require('makedir').makedir;
var path = require('path')

var global_utils=require('./globals.js');

//
// pull in the code from refactored files
//

var geoQuery = require('detector_postgis_query').geoQuery;
var doneDataSumUp = require('./doneDataCDBSumup')
var doneGeoQuery = require('./doneGeoQuery').doneGeoQuery;
var accumulate_features= require('./accumulate_features')

var setup_connection = require('./setup_pg_connection.js')

var geom_utils = require('geom_utils')


//
// the data service
//
function pg_detector_area_data_service(config,
                                       area_type,
                                       area_name,
                                       year,
                                       done){



    // expecting an osm2 connection string here
    var connectionString = setup_connection(config)

    var q = queue(1) // one thing at a time here;

    // for the server, the "path" is in the pattern
    // "rootdir/counties/hourly/2012/06001.json"
    // or
    // "rootdir/airdistricts/hourly/2012/AMA.json"
    // etc

    // so reconstruct that for caching



}



    var osmConnectionString        = "pg://"+user+":"+pass+"@"+host+":"+port+"/osm";

    var freeway_param = options.freeway_param;

    // temporary hack
    if(freeway_param == 'imputed'){
        freeway_param = undef;
    }



    return function pg_detector_area_data_service(req,res,next){

        // fake up a document id
        var docid = parseUrl(req.url).pathname;
        var requestid = docid
        res.connection.setTimeout(0); // this could take a while
        // build up the callbacks backwards, I guess

        var accumulatedFeatures = new accumulate_features(docid)
        options.accumulatedFeatures=accumulatedFeatures

        var alldone = doneGeo_doneData({'docid':docid
                                       ,'requestid':requestid
                                       ,'accumulatedFeatures':accumulatedFeatures}
                                      ,req,res,next);


        // note doneGeoQuery embeds doData doneData calls
        var doneGeo = doneGeoQuery(docid
                                  ,doneDataSumUp
                                  ,options
                                  ,alldone);

        var doGeo = geoQuery(req
                            ,{'area_param': area_param
                             ,'area_type_param': area_type }
                            ,doneGeo);
        pg.connect(osmConnectionString, doGeo);

        return null
    };

};


    function doneGeo_doneData(opts,req,res,next){
        var docid = opts.docid
        var requestid = opts.requestid

        return function(err,features){
            if(err) {
                next(err);
                return null
            }

            // add features to output and say goodbye
            console.log('sorting')
            opts.accumulatedFeatures.sort()
            //default is json
            console.log('dumping')
            // write it out
            console.log('write it')
            var p = path.dirname('public'+requestid)
            makedir(p,function(e){
                if(e){
                    throw new Error(e)
                    //fs.writeFile('bugdump.json', JSON.stringify(accumulatedFeatures.feature()), cb)
                }else{
                    fs.writeFile('public'+requestid, '{"type":"FeatureCollection","docid":"'+docid+'","features":['+JSON.stringify(opts.accumulatedFeatures.feature())+']}')
                }
            })
            return res.end()
        }

    }
