# innkeeper-socket.io

[![NPM](https://nodei.co/npm/innkeeper-socket.io.png)](https://www.npmjs.com/package/innkeeper-socket.io)

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

rooms++ for socket.io. Allows for private rooms where a key is used and storing data for a room.

## Usage

Example Server:
```javascript
var app = require('http').createServer( function(){} );
var io = require( 'socket.io' )( app );
var innkeeper = require( 'innkeeper-socket.io' );

var keeper = innkeeper( { io: io } );

app.listen( 8888 );
```

Example Client:
```javascript
var ioClient = require( 'socket.io-client' );
var io = ioClient( 'http://localhost:8333' );
var innkeeper = require( 'innkeeper-socket.io/client' );

var keeper = innkeeper( { io: io } );

// create a room other users/sockets can join
// reserver returns a promise which returns a room object
keeper.reserve()
.then( function( room ) {
  
  // watch for room data changes
  room.on( 'data', function( data, action ) {

    console.log( data ); // current room data
    console.log( action ); // what was done to change room data
  });

  // create a variable which will be stored for the room
  room.setVar( 'variable_name', 'some value' );
  .then( function( value ) {

    console.log( value ); // "some value"
  }); 
});
```

## API

## Server

### Constructor - 

Optionally in the options object you may pass a memory store. By default an in memory store will be used however Redis can be easily used by using [`innkeeper-storeredis`](https://www.npmjs.com/package/innkeeper-storeredis).

Below is an example of creating a `innkeeper-socket.io` server using a redis store.
```javascript
var app = require('http').createServer( function(){} );
var io = require( 'socket.io' )( app );
var innkeeper = require( 'innkeeper-socket.io' );
var redis = redis = require( 'redis' );

var keeper = innkeeper({ 
  io: io,
  memory: require('innkeeper-storeredis')(redis.createClient())
});

app.listen( 8888 );
```

## Client

### Constructor -

#### `client = require( 'innkeeper-socket.io/client' )(opts);` -

Will construct a new client. A settings object must be passed which must include a variable `io` which will be an instance of a Socket.io client.

### Properties -

#### `client.rooms` -

An object which will store all rooms created or joined by this client. The room's id is the 
key/variable name of the object.

### Methods -

#### `client.reserve( isPublic )` -

Reserve a room. A promise is returned which when it succeeds returns a `room` instance. Optionally pass
in true for `isPublic` if you want the room to be joinable via `enterPublic`

#### `client.enter( roomid )` -

Enter a premade room using the rooms id. A promise is returned which when it succeeds returns a `room` 
instance. This promise will fail when an incorrect room id was passed or the room doesn't exist anymore.

#### `client.enterWithKey( key )` -

Enter a premade room using a key. A key is a short numeric pin which a room can have. A room can have
both a room id and a key. A promise is returned which when it succeeds returns a `room` 
instance. This promise will fail when an incorrect room key was passed or the room doesn't exist anymore.

#### `client.enterPublic()` -

Enters a publicly available room. A public room is simply a room that anyone can enter using the 
`enterPublic()` method. This allows for easier anonymous multiuser connections. This promise will return a standard 
room instance or reject if no rooms are available.  

#### `client.leave( roomid )` -

Leave a premade room using the room id. A promise is returned which when it succeeds returns a `room` 
instance for the room which you left.



## Room

### Properties -

#### `room.id` -

Room id. This can be shared to enter into a room. A room id is longer than a room key.

#### `room.users` -

Users in the room. An array of all the users in a room.

#### `room.roomData` -

Current data in the room.

### Methods -

#### `room.getKey()` -

Will reserve a key for this room. This key can be shared to allow other users to enter into this room.
A some point in time this key should be returned. So for instance if we're expecting a room to become
"full" when there are 3 users then we can return the key. The key is also automatically returned when
the room becomes empty. A promise is returned which when it resolved returns the key. If it fails most
likely the server has run out of keys.

#### `room.returnKey()` -

Returns a key which has been reserved for this room. A promise is returned which will always resolve.

#### `room.setVar( key, value )` -

adds or sets a variable on a room. `key` is the name of the variable. `value` is the value for the variable.
The value of the variable should be a primitive type. (no Arrays or Objects). When a room variable is set 
everyone receives an event notifiying that a variable has been changed. Room variables are handy to have a 
shared model to save the state of your application. A promise is returned which will return the value of the 
variable.

#### `room.getVar( key )` -

get the value of a variable. `key` is the name of the variable. A promise is returned which when it resolves
returns the value of the variable. If the variable doesn't exist the promise returns null.

#### `room.deleteVar( key )` -

delete a room variable. `key` is the name of the variable. A promise is returned which will resolve once the
variable has been deleted.

#### `room.setRoomData( data )` -

set multiple variables at the same time. This is a convenient way to initialize room variables. `data` is
an Object with values for the room. Values of variables should be Javascript primitive values.

#### `room.getRoomData()` -

get all variables and values stored for the room. A promise is returned. When this promise resolved an `Object`
is returned.

### Events -
#### `room.on( 'data', function( data, action ) { } );`

An event `'data'` is emitted whenever the rooms data is changed. `data` is an Object which is the rooms current 
data. `action` has details about the action which was taken to modify the rooms data for instance calling
`room.setVar( key, value )` would return the following `action` data:

```javascript
{
  roomID: id, // id of the room in which data was changed
  action: 'set', // what action was performed such as 'set' or 'delete'
  key: key, // the variable name or key in the object which was changed
  value: value // the value of the variable
}
```

If `room.setRoomData( data )` is used then `action` will be `null`.




## License

MIT, see [LICENSE.md](http://github.com/jam3/innkeeper-socket.io/blob/master/LICENSE.md) for details.
