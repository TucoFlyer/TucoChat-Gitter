# TucoChat-Gitter
TucoFlyer chat daemon for Gitter.

## Setup

 1. Download the packages using `yarn` or `npm install`.
 2. Define environment variables: `TUCOCHAT_CONNECTION_FILE` for specifying the `connection.txt` path, `TUCOCHAT_GITTER_TOKEN` for the Gitter bot token.
 3. Run! (`node index.js`)

## Log data types

 * Magenta: data
 * Blue: method
 * Green: OK
 * Red: FAIL
 * Yellow: Warning

## Dependencies

 * chalk: Used for colored console.
 * deasync: Used to wait for needed async functions (like request).
 * node-gitter: Gitter API lib.
 * request: Used for HTTP requests. (communication w/ Bot-Controller)
 * websocket: Used for websockets. (communication w/ Bot-Controller)

## To-do

 - [ ] Write websocket code.