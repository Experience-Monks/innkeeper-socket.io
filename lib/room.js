module.exports = room;

var events = require( './events' );

function room( io, innKeeperRoom ) {

	var proto = Object.getPrototypeOf( innKeeperRoom );
	innKeeperRoom.on('user', function(info) {
		io.to( innKeeperRoom.id ).emit( info.action, info);
	});

	innKeeperRoom.on(events.ROOM_DATA, function(info) {
		io.to( innKeeperRoom.id ).emit( events.ROOM_DATA, info);
	});

	innKeeperRoom.on(events.ROOM_VARIABLE, function(info) {
		io.to( innKeeperRoom.id ).emit( events.ROOM_VARIABLE, info);
	});
	// var innSetVar = proto.setVar;
	// var innDeleteVar = proto.deleteVar;
	// var innSetRoomData = proto.setRoomData;

	// innKeeperRoom.setVar = function( key, value ) {

	// 	return innSetVar.call( this, key, value )
	// 	.then( function( value ) {

	// 		io.to( innKeeperRoom.id ).emit( events.ROOM_VARIABLE, {

	// 			roomID: innKeeperRoom.id,
	// 			action: 'set',
	// 			key: key,
	// 			value: value
	// 		});

	// 		return value;
	// 	});
	// };

	// innKeeperRoom.deleteVar = function( key ) {

	// 	return innDeleteVar.call( this, key )
	// 	.then( function( value ) {

	// 		io.to( innKeeperRoom.id ).emit( events.ROOM_VARIABLE, {

	// 			roomID: innKeeperRoom.id,
	// 			action: 'delete',
	// 			key: key,
	// 			value: value
	// 		});

	// 		return value;
	// 	});
	// };

	// innKeeperRoom.setRoomData = function( data ) {
		
	// 	return innSetRoomData.call( this, data )	
	// 	.then( function( data ) {

	// 		data.roomID = innKeeperRoom.id;

	// 		io.to( innKeeperRoom.id ).emit( events.ROOM_DATA, data );

	// 		return data;
	// 	});	
	// };

	return innKeeperRoom;
}