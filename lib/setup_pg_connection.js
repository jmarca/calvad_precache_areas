function setup_connection(opts){

    var host = opts.postgresql.host ? opts.postgresql.host : '127.0.0.1';
    var user = opts.postgresql.auth.username ? opts.postgresql.auth.username : 'myname';
    //var pass = opts.postgresql.auth.password ? opts.postgresql.password : '';
    var port = opts.postgresql.port ? opts.postgresql.port :  5432;
    var db  = opts.postgresql.db ? opts.postgresql.db : 'spatialvds'
    var connectionString = "pg://"+user+"@"+host+":"+port+"/"+db
    console.log(connectionString)
    return connectionString
}

module.exports=setup_connection
