/* global require exports */

// this one uses computed length from the db, not from caltrans


var sys = require('sys');
var pg = require('pg');
var parseUrl = require('url').parse;
var caching_service = require('caching_service');
var _ = require('lodash');
var async = require('async');

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



function compare(a, b) {
    var aa = a[0] + ' ' + a[1]
    var bb = b[0] + ' ' + b[1]
    if (aa < bb ) return -1
    if (aa > bb ) return 1
    // a must be equal to b
    return 0
}


//
// the data service
//
exports.pg_detector_area_data_service = function pg_detector_area_data_service(options){

    //psql
    var host = options.host ? options.host : '127.0.0.1';
    var user = options.username ? options.username : 'myname';
    var pass = options.password ? options.password : 'secret';
    var port = options.port ? options.port :  5432;
    //couchdb
    var chost = options.chost ? options.chost : '127.0.0.1';
    var cuser = options.cusername ? options.cusername : 'myname';
    var cpass = options.cpassword ? options.cpassword : 'secret';
    var cport = options.cport ? options.cport :  5984;

    var area_param = options.area_param ? options.area_param : 'areaid';
    var area_type = options.area_type ? options.area_type : 'area';

    var spatialvdsConnectionString = "pg://"+user+":"+pass+"@"+host+":"+port+"/spatialvds";
    var osmConnectionString        = "pg://"+user+":"+pass+"@"+host+":"+port+"/osm";

    var freeway_param = options.freeway_param;

    // temporary hack
    if(freeway_param == 'imputed'){
        freeway_param = undef;
    }


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


    return function pg_detector_area_data_service(req,res,next){

        // fake up a document id
        var docid = parseUrl(req.url).pathname;
        var requestid = docid
        if(req.params[area_type] == 'counties'){
            docid = global_utils.replace_fips(docid)
        }
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
