module.exports = client;

var promise = require( 'bluebird' );
var events = require( './lib/events' );
var clientRoom = require( './lib/clientRoom' );

function client( settings ) {

  if( !( this instanceof client ) ) {

    return new client( settings );
  }

  if( !settings.io ) {

    throw new Error( 'Please pass in a socket.io client in settings. eg. require( \'innkeeper-socket.io/client\' )( { io: io } );' );
  }

  this.ioClient = settings.io;
  this.rooms = {};
}

client.EVENTS = events;

client.prototype = {

  reserve: function( ) {

    var client = this.ioClient;
    var rooms = this.rooms;
    var room;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_RESERVE, function( roomID, roomData, roomUsers ) {

        room = clientRoom( client, roomID, roomData, roomUsers );
        rooms[ roomID ] = room;

        ok( room );
      });
    });
  },

  enter: function( roomID ) {

    var client = this.ioClient;
    var rooms = this.rooms;
    var room;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_ENTER, roomID, function( roomID, roomData, roomUsers ) {

        if( roomID ) {

          room = clientRoom( client, roomID, roomData, roomUsers );
          rooms[ roomID ] = room;

          ok( room );
        } else {

          err( 'Could not join room' );
        }
      });
    });
  },

  enterPublic: function() {

    var client = this.ioClient;
    var rooms = this.rooms;
    var room;

     return new promise( function( ok, err ) {

      client.emit( events.ROOM_ENTER_PUBLIC, function( roomID, roomData, roomUsers ) {

        if( roomID ) {

          room = clientRoom( client, roomID, roomData, roomUsers );
          rooms[ roomID ] = room;

          ok( room );
        } else {

          err( 'Could not join room' );
        }
      });
    });

  },

  enterWithKey: function( roomKey ) {

    var client = this.ioClient;
    var rooms = this.rooms;
    var room;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_ENTER_WITH_KEY, roomKey, function( roomID, roomData, roomUsers ) {

        if( roomID ) {

          room = clientRoom( client, roomID, roomData, roomUsers );
          room.key = roomKey;
          rooms[ roomID ] = room;

          ok( room );
        } else {

          err( 'Could not join room with key' );
        }
      });
    });
  },

  leave: function( roomID ) {

    var client = this.ioClient;
    var rooms = this.rooms;
    var room;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_LEAVE, roomID, function( roomID ) {

        if( roomID ) {

          room = rooms[ roomID ];

          delete rooms[ roomID ];

          ok( room );
        } else {

          err( 'could not leave room' );
        }
      });
    });
  }
};