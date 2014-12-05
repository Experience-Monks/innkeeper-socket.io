var test = require( 'tape' ),
	app = require('http').createServer(function(){}),
	io = require('socket.io')(app),
	forkfriend = require( 'forkfriend' ),
	innkeeper = require( './..' ),
	Room = require( '../lib/room' );

var sockets = [], friend = forkfriend(), keeper, room, key;

app.listen( 3333 );


test( 'reserving room', function( t ) {

	t.plan( 2 );

	io.on( 'connection', function( s ) {

		sockets.push( s );


		if( sockets.length == 3 ) {

			keeper = innkeeper();

			t.ok( keeper, 'keeper was created' );

			keeper.reserve( sockets[ 0 ] )
			.then( function( createdRoom ) {

				room = createdRoom;

				t.ok( room instanceof Room, 'received a room' );
			}, function( message ) {

				t.fail( 'failed reserving room: ' + message );
				t.end();
			});
		}
	});

	// create 3 socket.io clients (cannot run on same process otherwise it'll just be 1)
	friend.add( __dirname + '/clientTest.js' );
	friend.add( __dirname + '/clientTest.js' );
	friend.add( __dirname + '/clientTest.js' );
});

test( 'leaving room', function( t ) {

	t.plan( 1 );

	keeper.leave( sockets[ 0 ], room.id )
	.then( function( room ) {

		t.equal( room, null, 'User left room and no one is in room' );
	});
});

test( 'create another room', function( t ) {

	t.plan( 1 );

	keeper.reserve( sockets[ 0 ] )
	.then( function( createdRoom ) {

		room = createdRoom;

		t.ok( room instanceof Room, 'received a room' );
	});
});

test( 'creating a key for a room', function( t ) {

	t.plan( 1 );

	room.getKey()
	.then( function( createdKey ) {

		key = createdKey;

		t.ok( key, 'received a key to enter the room' );
	}, function() {

		t.fail( 'didnt receive key to enter room' );
	});
});

test( 'entering room with an id', function( t ) {

	t.plan( 2 );

	keeper.enter( sockets[ 1 ], room.id )
	.then( function( joinedRoom ) {

		t.ok( room === joinedRoom, 'Joined the same room' );
	}, function( message ) {

		t.fail( 'unable join existing room: ' + room.id + ' ' + message );
	});


	keeper.enter( sockets[ 0 ], room.id )
	.then( function( joinedRoom ) {

		t.fail( 'was able to join room twice with id' );
	}, function( message ) {

		t.pass( 'was not able to join room twice with id' );
	});
});

test( 'entering room with a key', function( t ) {

	t.plan( 2 );

	keeper.enterWithKey( sockets[ 2 ], key )
	.then( function( joinedRoom ) {

		t.ok( room === joinedRoom, 'Joined the same room' );
	}, function( message ) {

		t.fail( 'Failed entering with key: ' + key + ' ' + message );
	});

	keeper.enterWithKey( sockets[ 0 ], key )
	.then( function( joinedRoom ) {

		t.fail( 'was able to join room twice with key' );
	}, function( message ) {

		t.pass( 'was not able to join room twice with key' );
	});
});