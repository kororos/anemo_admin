// dependencies
import { readFileSync } from 'fs';
//import { error, debug } from '../log';

const dockerSecret = {};

dockerSecret.read = function read(secretNameAndPath) {
    if (!secretNameAndPath) return false;
  try {
    return readFileSync(secretNameAndPath, 'utf8');
  } catch(err) {
    if (err.code !== 'ENOENT') {
      console.error(`An error occurred while trying to read the secret: ${secretNameAndPath}. Err: ${err}`);
    } else {
      console.debug(`Could not find the secret, probably not running in swarm mode: ${secretNameAndPath}. Err: ${err}`);
    }    
    return false;
  }
};
export default dockerSecret;