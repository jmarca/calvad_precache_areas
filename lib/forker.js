var cp = require('child_process')
var fs = require('fs')
function forker(processor,config,area_type,area_name,year,done){
    var n
    var opts = { cwd: undefined,
                 env: process.env
               }
    console.log('forking',area_type,area_name)

    config.name = area_name
    config.type = area_type
    config.year = year
    opts.env.CONFIGPARAMS=JSON.stringify(config)
    var logfile = 'log/'
            +area_type+'_'
            +area_name.replace('/','_')+'_'
            +year+'.log'
    console.log(logfile)
    var logstream = fs.createWriteStream(logfile
                                        ,{flags: 'a'
                                         ,encoding: 'utf8'
                                         ,mode: 0666 })
    var errstream = fs.createWriteStream(logfile
                                        ,{flags: 'a'
                                         ,encoding: 'utf8'
                                          ,mode: 0666 })
    n = cp.fork(processor,{silent:true})
    n.stderr.setEncoding('utf8')
    n.stdout.setEncoding('utf8')
    n.stdout.pipe(logstream)
    n.stderr.pipe(errstream)
    n.on('exit',function(code){
        console.log(['got exit: ',code, 'for',area_type,area_name,year].join(' '))
        // debug
        // throw new Error('croak while testing')
        return done()
    })

}

module.exports=forker
