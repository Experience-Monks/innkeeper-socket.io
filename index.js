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
	reserve: function( socket, isPublic ) {

		return this.innkeeper.reserve( socket.id, isPublic )
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
	 * Join an available public room
	 *
	 * @param  {String} userId id of the user whose entering a room
	 * @return {Promise} This promise will resolve by sending a room instance or reject if no public rooms
	 */
	enterPublic: function( socket ) {
		return this.innkeeper.enterPublic( socket.id )
		.then( joinRoom.bind( this, socket ) );
	},

	/**
	 * Leave a room.
	 * 
	 * @param  {String} roomID the id of a room you want to leave. Think of it as a room number.
	 * @return {Promise} a promise will be returned which on success will return a room object if users are still in room null if not
	 */
	leave: function( socket, roomID ) {

		var io = this.settings.io;

		return this.innkeeper.leave( socket.id, roomID )
		.then( function( room ) {

			var disconnectListeners = socket.listeners( 'disconnect' );
			var roomVarListeners = socket.listeners( events.CLIENT_ROOM_VARIABLE );
			var roomDataListeners = socket.listeners( events.CLIENT_ROOM_DATA );
			var roomKeyListeners = socket.listeners( events.ROOM_KEY );

			disconnectListeners.forEach( function( listener ) {

				if( listener.roomId == roomID ) {

					socket.removeListener( 'disconnect', listener );
				}
			});

			roomVarListeners.forEach( function( listener ) {

				if( listener.roomId == roomID ) {

					socket.removeListener( events.CLIENT_ROOM_VARIABLE, listener );
				}
			});

			roomDataListeners.forEach( function( listener ) {

				if( listener.roomId == roomID ) {

					socket.removeListener( events.CLIENT_ROOM_DATA, listener );
				}
			});

			roomKeyListeners.forEach( function( listener ) {

				if( listener.roomId == roomID ) {

					socket.removeListener( events.ROOM_KEY, listener );
				}
			});

			// emit they're leaving a room
			socket.to( roomID ).emit( events.ROOM_LEAVE, socket.id );

			// leave the room in socket.io
			socket.leave( roomID );

			return room;
		});
	}
};

function addIOListeners() {

	var io = this.settings.io;

	var reserve = this.reserve.bind( this );
	var enter = this.enter.bind( this );
	var enterPublic = this.enterPublic.bind( this );
	var enterWithKey = this.enterWithKey.bind( this );
	var leave = this.leave.bind( this );

	io.on( 'connection', function( socket ) {

		socket.on( events.ROOM_RESERVE, function( isPublic, done ) {

			reserve( socket, isPublic )
			.then( function( room ) {

				done( room.id, {}, [ socket.id ] );
			});
		});

		socket.on( events.ROOM_ENTER, function( roomID, done ) {

			var roomData, users;

			enter( socket, roomID )
			.then( function( room ) {

				room.getRoomData()
				.then( function( rd ) {

					roomData = rd;

					return room.getUsers();
				})
				.then( function( u ) {

					users = u;

					done( room.id, roomData, users );
				});
			})
			.catch( function() {
				
				done( null );
			});
		});

		socket.on( events.ROOM_ENTER_PUBLIC, function( done ) {

			var roomData, users;

			enterPublic( socket )
			.then( function( room ) {

				room.getRoomData()
				.then( function( rd ) {

					roomData = rd;

					return room.getUsers();
				})
				.then( function( u ) {

					users = u;

					done( room.id, roomData, users );
				});
			})
			.catch( function() {
				
				done( null );
			});
		});

		socket.on( events.ROOM_ENTER_WITH_KEY, function( roomKey, done ) {

			enterWithKey( socket, roomKey )
			.then( function( room ) {

				room.getRoomData()
				.then( function( rd ) {

					roomData = rd;

					return room.getUsers();
				})
				.then( function( u ) {

					users = u;

					done( room.id, roomData, users );
				});
			})
			.catch( function() {
				
				done( null );
			});
		});

		socket.on( events.ROOM_LEAVE, function( roomID, done ) {

			leave( socket, roomID )
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

	var io = this.settings.io;

	// listener for disconnecting
	var onDisconnect = function() {

		this.leave( socket, room.id );
	}.bind( this );

	var onRoomKey = function( req, done ) {

		if( req.roomID == room.id ) {

			switch( req.action ) {

				case 'get':

					room.getKey()
					.then( done );
				break;

				case 'return':

					room.returnKey()
					.then( done );
				break;

				default: 

					throw new Error( 'undefined action in onRoomKey' );
			}
		}
	}.bind( this );

	// listener for when the user wants to act on the room data for the room
	var onRoomVar = function( req, done ) {

		if( req.roomID == room.id ) {

			switch( req.action ) {

				case 'set':
					room
					.setVar( req.key, req.value )
					.then( done );
				break;

				case 'get': 

					room.getVar( req.key )
					.then( done );
				break;

				case 'delete':
					room
					.deleteVar( req.key )
					.then( done );
				break;

				default: 

					throw new Error( 'undefined action in onRoomVar' );
			}
		}
	};

	// listener for when room data is set
	var onRoomData = function( req, done ) {

		if( req.roomID == room.id ) {

			if( req.data ) {

				room
				.setRoomData( req.data )
				.then( done );
			} else {

				room.getRoomData()
				.then( done );
			}
		}
	};

	// listener for whem room is set public
	var onRoomPublic = function( req, done ) {

		if( req.roomID == room.id ) {
			room.makePublic();
		}
	};

	// listener for when room is set private
	var onRoomPrivate = function( req, done ) {
		
		if( req.roomID == room.id ) {
			room.makePrivate();
		}
	};

	onDisconnect.roomId = room.id; // need to set this variable so if leave is called manually on disconnect the same room wont be left
	onRoomVar.roomID = room.id;
	onRoomData.roomID = room.id;
	onRoomKey.roomID = room.id;
	onRoomPublic.roomID = room.id;
	onRoomPrivate.roomID = room.id;

	socket.on( 'disconnect', onDisconnect );
	socket.on( events.CLIENT_ROOM_VARIABLE, onRoomVar );
	socket.on( events.CLIENT_ROOM_DATA, onRoomData );
	socket.on( events.ROOM_PUBLIC, onRoomPublic );
	socket.on( events.ROOM_PRIVATE, onRoomPrivate );
	socket.on( events.ROOM_KEY, onRoomKey );

	// get socket.io to join a room
	socket.join( room.id );

	// let others know you joined
	socket.to( room.id ).emit( events.ROOM_JOIN, socket.id );

	return innRoom( this.settings.io, room );
}