var argv = require('minimist')(process.argv.slice(2))
var config_okay = require('config_okay')
var queue = require('queue-async')
var config_file = 'config.json'
var get_data = require('./get_data.js')

var q = queue(1)

var config = {}
if(argv.config){
    config_file=argv.config
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
    var areaname = config.name
    if(areaname === undefined){
        throw new Error('assign area name in the name parameter in '+config_file+' or use --name to pass area name')
    }

    var areatype = config.type
    if(areatype === undefined){
        throw new Error('assign area type (grid, county, etc) in the type parameter in '+config_file+', or use --type to pass area type')
    }
    console.log(areatype,areaname)
    console.log(areatype, ''+areaname)
    var year = config.year || argv.year
    if(year === undefined){
        throw new Error('assign year in '+config_file+', or use --year to pass year')
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
