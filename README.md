# Onion Redis Call

This project demonstrates how to make remote procedure calls using Onion Redis queues over Tor.

## Files

- `index.js` - Main server implementation wrapping the Onion Redis client
- `configuration.js` - Configuration for Onion Redis and Tor
- `commit.sh` - Git configuration script
- `package.json` - Node.js package definition
- `/tests` - Test cases
    - `add.js` - Addition test
    - `echo.js` - String echo test

## Usage

To use:

1. Run `npm install` to install dependencies
2. Start Onion Redis server
3. Configure Tor proxy in `configuration.js`
4. Run test scripts:
   ```
   node tests/add.js
   node tests/echo.js
   ```

The test scripts demonstrate making RPC calls between isolated services over Onion Redis.

## Server API

Key objects:

- `Server` - Manages connection to Onion Redis
- `Namespace` - Groups classes into namespaces
- `Class` - Provides and consumes methods
- `Call` - Encapsulates method call

Main methods:

- `provide()` - Offer method to service callers
- `consume()` - Call remote method

## License

LGPL License.
