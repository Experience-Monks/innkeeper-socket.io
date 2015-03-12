module.exports = room;

var EventEmitter = require( 'events' ).EventEmitter;
var events = require( './events' );
var promise = require( 'bluebird' );

function room( ioClient, roomID, roomData, roomUsers ) {

  if( !( this instanceof room ) ) {

    return new room( ioClient, roomID, roomData, roomUsers );
  }

  this.ioClient = ioClient;
  this.id = roomID;
  this.key = null;
  this.keyPromise = null;
  this.roomData = roomData || {};
  this.users = roomUsers || [];
  this.emitter = new EventEmitter();
  this.ioListeners = [];

  ioClient.on( events.ROOM_JOIN, function( user ) {

    this.users.push( user );

    this.emitter.emit( 'user', {

      action: 'join',
      user: user,
      users: this.users
    });
  }.bind( this ));

  ioClient.on( events.ROOM_LEAVE, function( user ) {

    this.users.splice( this.users.indexOf( user ), 1 );

    this.emitter.emit( 'user', {

      action: 'leave',
      user: user,
      users: this.users
    });
  }.bind( this ));

  ioClient.on( events.ROOM_VARIABLE, function( data ) {

    if( data.roomID == roomID ) {

      switch( data.action ) {

        case 'set':

          console.log( 'SET ROOM VAR', data.key, data.value );
          this.roomData[ data.key ] = data.value;
        break;

        case 'delete':

          delete this.roomData[ data.key ];
        break;

        default:

          throw new Error( 'undefined action: ', data.action );
      }

      this.emitter.emit( 'data', this.roomData, data );
    }
  }.bind( this ));

  ioClient.on( events.ROOM_DATA, function( data ) {

    if( data.roomID == roomID ) {
      
      this.roomData = data;
      this.emitter.emit( 'data', this.roomData, null ); 
    }
  }.bind( this ));
}

var p = room.prototype = {};

/**
 * Emit a socket.io message to all sockets in the room
 */
p.emit = function() {

  this.ioClient.to( this.id ).emit.call( this.ioClient, arguments );

  return this;
};

/**
 * Listen to socket.io messages sent to this room.
 */
p.on = p.addListener = function( event, listener ) {

  switch( event ) {

    case 'user':
    case 'data':

      this.emitter.on( event, listener );
    break;

    default:

      this.ioClient.on( event, listener );
      this.ioListeners.push( event, listener );
    break;
  }

  return this;
};

p.once = function( event, listener ) {

  switch( event ) {

    case 'user':
    case 'data':

      this.emitter.once( event, listener );
    break;

    default:

      this.ioClient.once( event, listener );
      this.ioListeners.push( event, listener );
    break;
  }

  return this;
};

p.removeListener = function( event, listener ) {

  switch( event ) {

    case 'user':
    case 'data':

      this.emitter.removeListener( event, listener );
    break;

    default:

      this.ioClient.removeListener( event, listener );
    break;
  }

  return this;
};

p.setMaxListeners = function( count ) {

  this.emitter.setMaxListeners( count );
  this.ioClient.setMaxListeners( count );
};

p.removeAllListeners = function( event ) {

  this.emitter.removeAllListeners( event );

  for( var i = 0, len = this.ioListeners.length; i < len; i++ ) {

    if( event && ( event == this.ioListeners[ i ] ) || !event ) {

      this.ioClient.removeListener( this.ioListeners[ i ], this.ioListeners[ i + 1 ] );  
    }
  }
};

/**
 * getKey will reserve a key for this room. This key can be shared
 * to allow other users to enter into this room.
 * 
 * @return {Promise} this promise will return the key for this room
 */
p.getKey = function() {

  if( !this.key ) {

    var id = this.id;
    var ioClient = this.ioClient;
    var onReceiveKey = function( ok, err, key ) {

      if( key ) {

        this.key = key;  

        ok( key );
      } else {

        this.keyPromise = null;
        err( 'no key\'s available' );
      }
    }.bind( this );

    return new promise( function( ok, err ) {

      ioClient.emit( 
        events.ROOM_KEY, 
        { roomID: id, action: 'get' }, 
        onReceiveKey.bind( undefined, ok, err )
      );
    });
  } else {

    return promise.resolve( this.key );
  }
};

/**
 * Return the key that this room was using. This will ensure there will be enough keys in the inn.
 * There can be way more roomid's there than can be keys. Therefore it's always good practice to
 * return a key for a room when we're finished with it.
 *
 * For example your room can have 3 guests max. Once we've reached the max room size we may want to
 * return the key back to the pool of keys.
 * 
 * @return {Promise} this promise will always succeed even if no key was made for the room
 */
p.returnKey = function() {

  if( this.key ) {

    var id = this.id;
    var ioClient = this.ioClient;
    var key = this.key;
    var onReturnKey = function( ok, err ) {

      ok();
    }.bind( this );

    return new promise( function( ok, err ) {

      ioClient.emit( 
        events.ROOM_KEY, 
        { roomID: id, action: 'return' }, 
        onReturnKey.bind( undefined, ok, err )
      );
    });
  } else {

    return promise.resolve();
  }
};

/**
 * Sets a variable on the room. All users in the room will receive an event that a variable
 * change happened.
 * 
 * @param {String} key The name of the variable you want to set
 * @param {*} value A value which will be stored for this key
 * @return {Promise} This promise will resolve and return the value passed when the value was set
 */
p.setVar = function( key, value ) {

  var id = this.id;
  var ioClient = this.ioClient;

  return new promise( function( ok, err ) {

    ioClient.emit( events.CLIENT_ROOM_VARIABLE, {

      roomID: id,
      action: 'set',
      key: key,
      value: value
    }, ok );
  });
};

/**
 * Gets a variable set in the room. If this variable does not exist undefined will be returned.
 * 
 * @param  {String} key a string which is the variable name for a variable
 * @return {Promise} This promise will resolve once the room data has been written
 */
p.getVar = function( key ) {
  
  var id = this.id;
  var ioClient = this.ioClient;

  return new promise( function( ok, err ) {

    ioClient.emit( events.CLIENT_ROOM_VARIABLE, {

      roomID: id,
      action: 'get',
      key: key
    }, ok );
  });
};

/**
 * If you want to delete a variable from the room's data.
 * 
 * @param  {String} key Key for the variable you want to delete
 * @return {Promise} A promise will be returned which will resolve once then variable is deleted the value passed was the deleted value
 */
p.deleteVar = function( key ) {

  var id = this.id;
  var ioClient = this.ioClient;

  return new promise( function( ok, err ) {

    ioClient.emit( events.CLIENT_ROOM_VARIABLE, {

      roomID: id,
      action: 'delete',
      key: key
    }, ok );
  });
};

/**
 * Set the data stored in the room. All users in the room will receive an event that room data
 * was changed.
 *
 * @param {Object} data The data used by this room.
 * @return {Promise} A promise will be returned which will resolve once the room data is set
 */
p.setRoomData = function( data ) {

  var id = this.id;
  var ioClient = this.ioClient;

  return new promise( function( ok, err ) {

    ioClient.emit( events.CLIENT_ROOM_DATA, {

      roomID: id,
      data: data 
    }, ok );
  });
};

/**
 *  Get the data stored for this room as an Object.
 * 
 * @return {Object} Room data stored for this room.
 */
p.getRoomData = function() {

  var id = this.id;
  var ioClient = this.ioClient;

  return new promise( function( ok, err ) {

    ioClient.emit( events.CLIENT_ROOM_DATA, {

      roomID: id
    }, ok );
  });
};