module.exports = room;

var events = require( './events' );

function room( io, innKeeperRoom ) {

	var proto = Object.getPrototypeOf( innKeeperRoom );
	var innSetVar = proto.setVar;
	var innDeleteVar = proto.deleteVar;
	var innSetRoomData = proto.setRoomData;

	innKeeperRoom.setVar = function( key, value ) {

		return innSetVar.call( this, key, value )
		.then( function( value ) {

			console.log( '---> sending to', innKeeperRoom.id, events.ROOM_VARIABLE );

			io.to( innKeeperRoom.id ).emit( events.ROOM_VARIABLE, {

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

				action: 'delete',
				key: key,
				value: value
			});

			return value;
		});
	};

	innKeeperRoom.setRoomData = function( data ) {

		return innSetRoomData.call( this, data )	
		.then( function( data ) {

			io.to( innKeeperRoom.id ).emit( events.ROOM_DATA, data );

			return data;
		});	
	};

	return innKeeperRoom;
}