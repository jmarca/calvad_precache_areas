var cp = require('child_process')

function forker(processor,config,area_type,area_name,year,done){
    var n
    var opts = { cwd: undefined,
                 env: process.env
               }
    console.log(area_type,area_name)

    config.name = area_name
    config.type = area_type
    config.year = year
    opts.env.CONFIGPARAMS=JSON.stringify(config)

    n = cp.fork(processor)

    n.on('exit',function(code){
        console.log(['got exit: ',code, 'for',area_type,area_name,year].join(' '))
        // debug
        // throw new Error('croak while testing')
        return done()
    })

}

module.exports=forker
