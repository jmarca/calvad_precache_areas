"use strict"
var argv = require('minimist')(process.argv.slice(2))
var config_okay = require('config_okay')
var queue = require('d3-queue').queue
var config_file = 'config.json'
var get_data = require('./get_data.js')

var q = queue(1)

var config = {}
if(argv.config){
    config_file=process.cwd() + '/' + argv.config
}

function _configure(cb){
    if(process.env.CONFIGPARAMS === undefined){
        // then try to get it from config_okay
        config_okay(config_file,function(e,c){
            if(e) throw new Error(e)
            config = Object.assign(config,c)
            return cb()
        })
    }else{
        config = JSON.parse(process.env.CONFIGPARAMS)
        if(!config){
            throw new Error('failed to pass config params')
        }
        cb()
    }
    return null
}

function doit(cb){
    console.log(argv)
    var areaname =  argv.name || config.name
    var areatype =  argv.type || config.type
    var year =      argv.year || config.year
    if(areatype === undefined){
        console.log('assign area type (grid, county, etc) in the type parameter in '+config_file+', or use --type to pass area type')
        return cb('fix config')
    }
    if(areaname === undefined){
        console.log('assign area name in the name parameter in '+config_file+' or use --name to pass area name')
        return cb('fix config')
    }
    if(year === undefined){
        console.log('assign year in '+config_file+', or use --year to pass year')
        return cb('fix config')
    }
    console.log({'type':areatype,
                 'name':areaname,
                 'year':year})
    if(config.cacheroot === undefined){
        console.log('defaulting output directory for cached files to "data"')
        config.cacheroot = 'data'
    }else{
        console.log('output directory for cached files: '+config.cacheroot+'.  Change by setting config.cacheroot')
    }
    get_data(config,areatype,areaname,year,function(e,r){
        if(e) throw new Error(e)
        console.log('done with',areatype,areaname,year,' Wrote to',r)
        return cb()
    })
    return null
}

q.defer(_configure)
q.defer(doit)
q.await(function(e){
    console.log('all done')
    return null
})
