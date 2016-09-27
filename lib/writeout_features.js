var fs = require('fs');
var path = require('path')

var makedir = require('makedir').makedir;


/**
 * writeout_features
 *
 * @param {} features
 * @param {} opts if you're trying to follow the logic, remember that
 * opts contains accumulatedFeatures, which is loading up on all the
 * results as we go here
 * @param {} done
 * @returns {}
 * @throws {}
 */
function writeout_features(features,opts,done){
    var docid = opts.docid
    var requestid = opts.requestid

    // add features to output and say goodbye
    console.log('sorting')
    opts.accumulatedFeatures.sort()
    //default is json
    // write it out
    var filepath = opts.cacheroot+requestid
    var p = path.dirname(filepath)
    console.log('write it to',filepath,'via',p)
    makedir(p,function(e){
        if(e){
            throw new Error(e)
        }else{
            fs.writeFile(filepath,
                         '{"type":"FeatureCollection","docid":"'
                         +docid
                         +'","features":['
                         +JSON.stringify(opts.accumulatedFeatures.feature())
                         +']}'
                         ,function(e){
                             if(e) return done(e)
                             return done(null,filepath)
                         })
        }
        return null
    })
    return null
}

module.exports=writeout_features
