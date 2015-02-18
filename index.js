module.exports = innkeeperSocketIO;

var innkeeper = require( 'innkeeper' );
var innRoom = require( './lib/room' );
var events = require( './lib/events' );

function innkeeperSocketIO( settings ) {

	if( !( this instanceof innkeeperSocketIO ) )
		return new innkeeperSocketIO( settings );

	if( !settings || !settings.io ) {

		throw new Error( 'You must pass in a settings object with an instance of io eg: { io: io }' );
	}

	this.settings = settings;
	this.innkeeper = innkeeper( settings );

	addIOListeners.call( this );
}

innkeeperSocketIO.prototype = {

	/**
	 * the reserve function will reserve a room. Reserve will return a promise which will
	 * return a room object on success.
	 * 
	 * @return {Promise} [description]
	 */
	reserve: function( socket ) {

		return this.innkeeper.reserve( socket.id )
		.then( joinRoom.bind( this, socket ) );
	},

	/**
	 * Using enter you can enter into a room. This method will return a promise
	 * which on succeed will return a room object. If the room does not exist the promise
	 * will fail.
	 * 
	 * @param  {String} id the id of a room you want to enter. Think of it as a room number.
	 * @return {Promise} a promise will be returned which on success will return a room object
	 */
	enter: function( socket, roomID ) {

		return this.innkeeper.enter( socket.id, roomID )
		.then( joinRoom.bind( this, socket ) );
	},

	/**
	 * Enter a room with a key instead of a roomid. Key's are shorter than roomid's
	 * so it is much nicer for a user on the frontend to enter with.
	 * 
	 * @param  {String} roomKey a key which will be used to enter into a room.
	 * @return {Promise} a promise will be returned which on success will return a room object
	 */
	enterWithKey: function( socket, roomKey ) {

		return this.innkeeper.enterWithKey( socket.id, roomKey )
		.then( joinRoom.bind( this, socket ) );
	},

	/**
	 * Leave a room.
	 * 
	 * @param  {String} roomID the id of a room you want to leave. Think of it as a room number.
	 * @return {Promise} a promise will be returned which on success will return a room object if users are still in room null if not
	 */
	leave: function( socket, roomID ) {

		return this.innkeeper.leave( socket.id, roomID )
		.then( function( room ) {

			var disconnectListeners = socket.listeners( 'disconnect' );
			var roomVarListeners = socket.listeners( events.ROOM_VARIABLE );
			var roomDataListeners = socket.listeners( events.ROOM_DATA );

			disconnectListeners.forEach( function( listener ) {

				if( listener.roomId == roomID ) {

					socket.removeListener( 'disconnect', listener );
				}
			});

			roomVarListeners.forEach( function( listener ) {

				if( listener.roomId == roomID ) {

					socket.removeListener( events.ROOM_VARIABLE, listener );
				}
			});

			roomDataListeners.forEach( function( listener ) {

				if( listener.roomId == roomID ) {

					socket.removeListener( events.ROOM_DATA, listener );
				}
			});


			// leave the room in socket.io
			socket.leave( roomID );

			return room;
		});
	}
};

function addIOListeners() {

	var io = this.settings.io;

	var reserve = this.reserve;
	var enter = this.enter;
	var enterWithKey = this.enterWithKey;
	var leave = this.leave;

	io.on( 'connection', function( socket ) {

		socket.on( events.ROOM_RESERVE, function( done ) {

			reserve( socket )
			.then( function( room ) {

				done( room.id );
			});
		});

		socket.on( events.ROOM_ENTER, function( roomID, done ) {

			enter( socket, roomID )
			.then( function( room ) {

				done( room.id );
			})
			.catch( function() {
				
				done( null );
			});
		});

		socket.on( events.ROOM_ENTER_WITH_KEY, function( roomKey, done ) {

			enterWithKey( socket, roomKey )
			.then( function( room ) {

				done( room.id );
			})
			.catch( function() {
				
				done( null );
			});
		});

		socket.on( events.ROOM_LEAVE, function( roomID, done ) {

			this.leave( socket, roomID )
			.then( function( room ) {

				done( room.id );
			})
			.catch( function() {
				
				done( null );
			});
		});
	});
}

function joinRoom( socket, room ) {

	// listener for disconnecting
	var onDisconnect = function() {

		this.leave( socket, room.id );
	}.bind( this );

	// listener for when the user wants to act on the room data for the room
	var onRoomVar = function( req ) {

		if( req.roomID == room.id ) {

			switch( req.action ) {

				case 'set':
					room.setVar( req.key, req.value );
				break;

				case 'delete':
					room.deleteVar( req.key );
				break;
			}
		}
	};

	// listener for when room data is set
	var onRoomData = function( req ) {

		if( req.roomID == room.id ) {

			room.setRoomData( req.data );
		}
	};

	onDisconnect.roomId = room.id; // need to set this variable so if leave is called manually on disconnect the same room wont be left
	onRoomVar.roomID = room.id;
	onRoomData.roomID = room.id;

	socket.on( 'disconnect', onDisconnect );
	socket.on( events.ROOM_VARIABLE, onRoomVar );
	socket.on( events.ROOM_DATA, onRoomData );

	// get socket.io to join a room
	socket.join( room.id );

	return innRoom( this.settings.io, room );
}