var client = require( 'socket.io-client' );

var c = client( 'http://localhost:3333' );

c.on( 'variable', function( data ) {

  process.send( data );
});