var cp = require('child_process')
var fs = require('fs')

var path = require('path')

function forker(processor,config,area_type,area_name,year,done){

    console.log(area_type,area_name)
    var opts = { cwd: undefined,
                 env: process.env
               }
    config.name = area_name
    config.type = area_type
    config.year = year
    opts.env.CONFIGPARAMS=JSON.stringify(config)

    var n = cp.fork(processor)


    n.on('exit',function(code){
        console.log(['got exit: ',code, 'for',area_type,area_name,year].join(' '))
        // debug
        // throw new Error('croak while testing')
        return done()
    })

}

module.exports=forker
