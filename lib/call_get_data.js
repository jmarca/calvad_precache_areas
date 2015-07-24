var argv = require('minimist')(process.argv.slice(2))

var config = JSON.parse(process.env.CONFIGPARAMS)
if(!config){
    throw new Error('failed to pass config params')
}

var areaname = config.name
if(areaname === undefined){
    throw new Error('use --name to pass area name')
}

var areatype = config.type
if(areatype === undefined){
    throw new Error('use --type to pass area type')
}
console.log(areatype,areaname)
console.log(areatype, ''+areaname)
var year = config.year
if(year === undefined){
    throw new Error('use --year to pass year')
}



var queue = require('queue-async')

var get_data = require('./get_data.js')

var q = queue(1)

q.defer(get_data,config,areatype,areaname,year)
q.await(function(e,r){
    if(e) throw new Error(e)
    console.log('done with',areatype,areaname,year,' Wrote to',r)
    return null
})
