/**
 * this is a library to cache all the known combinations of areas and times
 * I guess maybe it can also invalidate existing data
 **/

var forker = require('./lib/forker.js')
var get_data = require('./lib/get_data.js')

var fs = require('fs');
var http = require('http');
var _ = require('lodash');
var async = require('async');
var superagent = require('superagent')

var areatypes = require('calvad_areas')

//var time_aggregation=['monthly','weekly','daily','hourly'];
var  time_aggregation=['hourly'];


var file_combinations = [];

// iterate over combinations, if the file exists, move on, if
// it does not, ask for it
var get_options = {
    host: 'localhost',
    port:  80
};

var url = 'http://'+ get_options.host+":"+get_options.port

function call_server(cb){
    console.log(new Date());
    async.eachLimit(file_combinations,1
              ,function(file,done) {
                   console.log('next file is '+file);
                   var path = '/'+file
                   console.log(url+path)
                   superagent.get(url + path)
                   .end(function(e,r){
                       if(e){
                           console.log(e)
                           return done(e)
                       }
                       console.log(new Date());
                       return done()
                   })
                   return null
               }
              ,cb);
    return null
}

// build a callback function to pass to fs.stat call, below
function load_files(opts){

    var subdir = opts.subdir
    var root = opts.root
    var years = opts.years
    function stat_callback(path,cb){
        return function(err,stats){
            if(err){
                console.log(' pushing '+path);
                file_combinations.push(path);
            }else{
                //console.log('have it');
            }
            return cb()
        }
    }



    function checkfs (cb){
        // populate the file combinations array
        var biglist = []
        _.each(years,function(year){
            _.each( areatypes , function(files,area){
                _.each( files, function(file){
                    _.each(time_aggregation,function(agg){

                        // do it in this order so as to keep data in
                        // cache on psql between queries
                        // this path is for the caching server
                        var path = [subdir,area,agg,year,file].join('/');
                        // this path is for the filesystem
                        var existspath = [root,path].join('/');
                        biglist.push({'path':path
                                     ,'existspath':existspath})
                    })
                })
            })
        });

        async.eachLimit(biglist,2
                  ,function(obj,cb2){
                       fs.stat(obj.existspath,stat_callback(obj.path,cb2));
                   }
                  ,cb);
        return null
    }
    return checkfs
}

exports.precache = function precache(options){

    get_options.host = options.host ? options.host : get_options.host
    get_options.port = options.port ? options.port : get_options.port
    url = 'http://'+ get_options.host+":"+get_options.port

    var root =  options.root || process.cwd();
    var subdir = options.subdir;
    var years = options.years || [2007,2008,2009]
    if(subdir === undefined) throw new Error('need subdir defined in options')
    return function(cb){
        async.series([load_files({'root':root,'subdir':subdir,'years':years})
                     ,call_server]
                    ,function(e){
                         if(e){
                             console.log('died with an error')
                         }
                         return cb(e)
                     })
    }
}
