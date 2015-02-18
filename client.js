module.exports = client;

var promise = require( 'bluebird' );
var events = require( './lib/events' );
var clientRoom = require( './lib/clientRoom' );

function client( ioClient ) {

  if( !( this instanceof client ) ) {

    return new client( ioClient );
  }

  this.ioClient = ioClient;
  this.rooms = {};

  addListeners.call( this );
}

client.EVENTS = events;

client.prototype = {

  reserve: function() {

    var client = this.ioClient;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_RESERVE, function( roomID ) {

        ok( this.rooms[ roomID ] = clientRoom( client, roomID ) );
      };
    });
  },

  enter: function( roomID ) {

    var client = this.ioClient;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_ENTER, roomID, function( roomID ) {

        if( roomID ) {

          ok( this.rooms[ roomID ] = clientRoom( client, roomID ) );
        } else {

          err( 'Could not join room' );
        }
      };
    });
  },

  enterWithKey: function( roomKey ) {

    var client = this.ioClient;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_ENTER_WITH_KEY, roomKey, function( rVal ) {

        if( roomID ) {

          ok( this.rooms[ roomID ] = clientRoom( client, roomID ) );
        } else {

          err( 'Could not join room with key' );
        }
      };
    });
  },

  leave: function( roomID ) {

    var client = this.ioClient;

    return new promise( function( ok, err ) {

      client.emit( events.ROOM_LEAVE, roomID, function( roomID ) {

        if( roomID ) {

          var room = this.rooms[ roomID ];

          delete this.rooms[ roomID ];

          ok( room );
        } else {

          err( 'could not leave room' );
        }
      };
    });
  }
};