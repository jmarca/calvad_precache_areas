//do this later, not now
// build a callback function to pass to fs.stat call, below


var file_combinations = [];

// iterate over combinations, if the file exists, move on, if
// it does not, ask for it




function load_files(opts){
    var subdir = opts.cacheroot
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
                        // do it in this order so as to keep data in
                        // cache on psql between queries
                        // this path is for the caching server
                        var path = [subdir,area,hourly,year,file].join('/');
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
