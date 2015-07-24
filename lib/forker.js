var cp = require('child_process')
var fs = require('fs')

var path = require('path')

function forker(processor,config,area_type,area_name,year,done){

    console.log(area_type,area_name)
    var opts = { cwd: undefined,
                 env: process.env
               }
    opts.env.CONFIGPARAMS=JSON.stringify(config)
    var n = cp.fork(processor,
                    ["--name",area_name,
                     "--type",area_type,
                     "--year",year]
                    )

    n.on('exit',function(code){
        console.log(['got exit: ',code, 'for',area_type,area_name,year].join(' '))
        // debug
        // throw new Error('croak while testing')
        return done()
    })

}

module.exports=forker
