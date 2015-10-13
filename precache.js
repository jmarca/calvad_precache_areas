/**
 * this is a program to cache or replace all the known combinations of
 * areas and times
 **/

var argv = require('minimist')(process.argv.slice(2))
var path = require('path')

// configuration stuff
var rootdir = path.normalize(__dirname)

// where are the files

var config_file
if(argv.config === undefined){
    config_file = path.normalize(rootdir+'/config.json')
}else{
    config_file = path.normalize(rootdir+'/'+argv.config)
}
console.log('setting configuration file to ',config_file,'.  Change with the --config option.')


var config_okay = require('config_okay')


var queue = require('d3-queue').queue
var num_CPUs = require('os').cpus().length;
num_CPUs-- // leave slack for couchdb to work
// num_CPUs = 1  // debugging
if(argv.jobs !== undefined){
    num_CPUs = argv.jobs
}


var forker = require('./lib/forker.js')


var fs = require('fs');


var areatypes = require('calvad_areas')

// always hourly, so don't bother
var  hourly='hourly';



function precache(config){

    var root = process.cwd();

    if(argv.root !== undefined){
        root = argv.root
    }else{
        if(config.root !== undefined){
            root = config.root
        }
    }
    if(!path.isAbsolute(root)){
        path.normalize(rootdir+'/'+root)
    }
    console.log('setting root cache path to '+root)

    var subdir
    if(argv.subdir !== undefined){
        subdir = argv.subdir
    }else{
        if(config.subdir !== undefined){
            subdir = config.subdir
        }
    }
    if(subdir === undefined) throw new Error('need subdir.  set in config file, or with the --subdir command line option')
    if(!path.isAbsolute(subdir)){
        path.normalize(rootdir+'/'+subdir)
    }
    console.log('setting subdir to '+subdir)

    var year
    if(argv.year !== undefined){
        year = argv.year
    }else{
        if(config.year !== undefined){
            year = config.year
        }
    }

    if(!year){
        console.log('pass year in using the --year argument')
        return null
    }

    var area
    if(argv.area !== undefined){
        area = argv.area
    }else{
        if(config.area !== undefined){
            area = config.area
        }
    }
    if( areatypes[area] === undefined ){
        console.log('pass in a valid area using the --area argument, one of ',Object.keys(areatypes))
        return null
    }

    var cachedir = path.resolve(root+'/'+subdir)
    console.log(cachedir)
    config.cacheroot = cachedir

    var filere = /(.*).json/;
    var biglist = []
    //    _.each( areatypes , function(files,area){
    //var area = 'counties'
    var fs_q = queue(2)
    areatypes[area].forEach(  function(file){
        // do it in this order so as to keep data in
        // cache on psql between queries
        // this path is for the caching server
        var path = [cachedir,area,hourly,year,file].join('/');
        var res = filere.exec(file)
        if(!res){
            console.log(file)
            console.log(filere)
            throw new Error('regex fails again')
        }
        fs_q.defer(function(cb){
            fs.stat(path,function(e,stats){
                if(e){
                    // good, no precached file, so process this one
                    biglist.push({
                        path:path
                        ,areatype:area
                        ,areaname:res[1]
                    })
                }
                return cb()
            })
            return null
        })
    })
    fs_q.await(function(e,r){
        if(e) throw new Error(e)
        var q = queue(num_CPUs)
        // debugging
        // test with 5 at once
        // biglist = biglist.slice(0,5)


        biglist.forEach(function(opts){
            q.defer(forker,
                    __dirname + '/lib/call_get_data.js'
                    ,config
                    ,opts.areatype
                    ,opts.areaname
                    ,year)
        })
        q.await(function(e,r){
            if(e) console.log('died')
            return null
        })
        return null
    })
    return null
}


var mainQ = queue()
mainQ.defer(config_okay,config_file)
mainQ.await(function(e,config){
    precache(config)
    return null
})
