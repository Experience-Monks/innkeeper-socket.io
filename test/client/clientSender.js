var innClient = require( './../../client' );
var ioClient = require( 'socket.io-client' );
var io, client, room;

io = ioClient( 'http://localhost:8333' );
client = innClient( { io: io } );

process.on( 'message', function( roomID ) {

  client.enter( roomID )
  .then( function( room ) {

    room.setVar( 'other_set', 3333 );
  })
  .catch( function( err ) {

    throw 'client sender could not join: ' + err;
  });
});