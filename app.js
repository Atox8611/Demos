const { createServer } = require ( 'http' );
const { readFile } = require ( 'node:fs/promises' );

const { port, userDataDir, assetsDir } = require ( './config.json' );

const mimeTypes = {
    'css': 'text/css',
    'html': 'text/html',
    'svg': 'image/svg+xml',
    'js': 'text/javascript',
    'json': 'application/json',
};

const handleMissingContent = ( response, url ) => {
    const missingContentMessage = 'The content at url "' + url + '" not found.';
    response.writeHead ( 404, { 'Content-Type': 'text/plain', 'Content-Length': missingContentMessage.length } );
    response.end ( missingContentMessage );
};

const parseRequestBody = request => {
    let bodyBuffer = '';
    request.on ( 'data', data => bodyBuffer += data.toString () );
    return new Promise ( resolve => request.on ( 'end', () => resolve ( JSON.parse ( bodyBuffer ) ) ) );
};

const server = createServer ( async ( request, response ) => {
    const { method, url } = request;
    console.log ( url );
    if ( method === 'GET' ) {
        if ( url === '/' ) {
            const indexFileContent = await readFile ( './index.html' );

            response.writeHead ( 200, { 'Content-Type': mimeTypes[ 'html' ], 'Content-Length': indexFileContent.length } );
            response.end ( indexFileContent );
        } else if ( url.startsWith ( assetsDir.slice ( 1 ) ) ) {
            const fileName = url.split ( '/' ).reverse ()[ 0 ]
            const extension = fileName.split ( '.' )[ 1 ];
            const mimeType = mimeTypes[ extension ];
            console.log ( extension )
            const assetFileContent = await readFile ( assetsDir + extension + '/' + fileName );

            response.writeHead ( 200, { 'Content-Type': mimeType, 'Content-Length': assetFileContent.length } );
            response.end ( assetFileContent );
        } else {
            handleMissingContent ( response, url );
        }
    } else if ( method === 'POST' ) {
        if ( url === '/login' ) {
            let result = { errorMessage: null };
            const { userName, password } = await parseRequestBody ( request );

            try {
                console.log ( userDataDir + userName + '.json' );
                const userData = JSON.parse ( await readFile ( userDataDir + userName + '.json' ) );
                if ( password !== userData.password ) {
                    result.errorMessage = 'Incorrect Password';
                }
            } catch {
                result.errorMessage = 'Incorrect User Name';
            }

            result = JSON.stringify ( result );
            response.writeHead ( 200, { /* 'Access-Control-Allow-Origin' : '*' ,*/ 'Content-Length': result.length } );
            response.end ( result );
        } else {
            handleMissingContent ( response, url );
        }
    } else {
        response.end ( 'Method "' + method + '" can not be handled.' );
    }    
} );

server.listen ( port, () => console.log ( 'Server started on port: ' + port ) );