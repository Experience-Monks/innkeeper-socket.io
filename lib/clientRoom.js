module.exports = room;

var events = require( './events' );
var promise = require( 'bluebird' );

function room( client, roomID ) {

  if( !( this instanceof room ) ) {

    return new room( client, roomID );
  }

  this.client = client;
  this.id = roomID;
}

room.prototype = {

  setVar: function( key, value ) {

    this.client.emit( events.ROOM_VARIABLE, {

      roomID: this.id,
      action: 'set',
      key: key,
      value: value
    });
  },

  deleteVar = function( key ) {

    this.client.emit( events.ROOM_VARIABLE, {

      roomID: this.id,
      action: 'delete',
      key: key,
      value: value
    });
  },

  setRoomData = function( data ) {

    this.client.emit( events.ROOM_DATA, {

      roomID: this.id
      data: data 
    });
  }
};