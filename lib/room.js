module.exports = room;

var events = require( './events' );

function room( io, innKeeperRoom ) {

	var proto = Object.getPrototypeOf( innKeeperRoom );
	var innSetVar = proto.setVar;
	var innDeleteVar = proto.deleteVar;
	var innSetRoomData = proto.setRoomData;

	console.log('created a innkeeper room');

	innKeeperRoom.setVar = function( key, value ) {

		return innSetVar.call( this, key, value )
		.then( function( value ) {

			io.to( innKeeperRoom.id ).emit( events.ROOM_VARIABLE, {

				roomID: innKeeperRoom.id,
				action: 'set',
				key: key,
				value: value
			});

			return value;
		});
	};

	innKeeperRoom.deleteVar = function( key ) {

		return innDeleteVar.call( this, key )
		.then( function( value ) {

			io.to( innKeeperRoom.id ).emit( events.ROOM_VARIABLE, {

				roomID: innKeeperRoom.id,
				action: 'delete',
				key: key,
				value: value
			});

			return value;
		});
	};

	innKeeperRoom.setRoomData = function( data ) {

		console.log( 'SERVER SET ROOM DATA', data );
		
		return innSetRoomData.call( this, data )	
		.then( function( data ) {

			data.roomID = innKeeperRoom.id;

			io.to( innKeeperRoom.id ).emit( events.ROOM_DATA, data );

			return data;
		});	
	};

	return innKeeperRoom;
}