var innkeeper = require( './../../' );
var forkfriend = require( 'forkfriend' );
var app = require('http').createServer( function(){} );
var ioServer = require('socket.io')( app );
var friend1, friend2;

app.listen( 8333 );

keeper = innkeeper( { io: ioServer } );

friend1 = forkfriend();
friend1.on( 'message', function( data ) {

  switch( data.action ) {

    case 'room id':

      friend2.send( data.roomID );
    break;

    case 'end tests' :

      friend1.stop();
      friend2.stop();

      ioServer.close();
    break;
  }
});
friend1.add( __dirname + '/client.js' );

friend2 = forkfriend();
friend2.on( 'message', function() {
  
});
friend2.add( __dirname + '/clientSender.js' );