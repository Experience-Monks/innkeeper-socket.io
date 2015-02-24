var innClient = require( './../../client' );
var ioClient = require( 'socket.io-client' );
var test = require( 'tape' ).createHarness();
var io, client, room;

io = ioClient( 'http://localhost:8333' );
client = innClient( { io: io } );

test.createStream().pipe( process.stdout );

test( 'get a room!', function( t ) {

  t.plan( 1 );

  client
  .reserve()
  .then( function( r ) {

    room = r;

    t.ok( room, 'received a room' );
  })
  .catch( function( err ) {

    t.fail( 'didn\'t get a room: ' + err );
  });  
});

test( 'get a room key', function( t ) { 

  t.plan( 1 );

  room.getKey()
  .then( function( key ) {

    t.ok( key, 'received a key: ' + key );
  })
  .catch( function( err ) {

    t.fail( err );
  });
});

test( 'return a room key', function( t ) { 

  t.plan( 1 );

  room.returnKey()
  .then( function() {

    t.pass( 'returned the key' );
  })
  .catch( function( err ) {

    t.fail( err );
  });
});

test( 'set room data', function( t ) {

  t.plan( 1 );

  room.setRoomData( {

    snakes: 333
  })
  .then( function( data ) {

    t.equal( data.snakes, 333, 'there are 333 snakes' );
  });
});

test( 'get room data', function( t ) {

  t.plan( 1 );

  room.getRoomData()
  .then( function( data ) {

    t.equal( data.snakes, 333, 'there are 333 snakes' );
  });
});

test( 'set variable', function( t ) {

  t.plan( 1 );

  room.setVar( 'snakes', 3 )
  .then( function( value ) {

    t.equal( value, 3, 'there are 3 snakes' );
  });
});

test( 'get variable', function( t ) {

  t.plan( 1 );

  room.getVar( 'snakes' )
  .then( function( value ) {

    t.equal( value, 3, 'there are 3 snakes' );
  });
});

test( 'other joining and setting variable', function( t ) {

  // sub test getting others room variable
  t.plan( 5 );
  t.timeoutAfter( 1000 );

  room.on( 'user', function( info ) {

    t.equal( info.action, 'join', 'action was correct' );
    t.ok( info.user, 'received user id' );
    t.equal( info.users.length, 2, 'two users in room' );

    room.removeAllListeners( 'user' );
  });

  room.on( 'data', function( roomData, action ) {

    t.equal( roomData.other_set, 3333, 'other_set was correct' );
    t.equal( roomData.snakes, 3, 'snakes was correct' );

    room.removeAllListeners( 'data' );
  });

  process.send( {

    action: 'room id',
    roomID: room.id
  });
});

test( 'delete variable', function( t ) {

  t.plan( 2 );

  room.deleteVar( 'snakes' )
  .then( function( value ) {

    t.equal( value, 3, '3 snakes were deleted' );

    room.getVar( 'snakes' )
    .then( function( value ) {

      t.equal( value, null, 'null snakes after delete' );

      endTests();
    });
  });
});

function endTests() {

  process.send( {
    action: 'end tests' 
  });
}