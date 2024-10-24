import { boot } from "quasar/wrappers";

export default boot(async ({ app }) => {
    // The order of environment variables that will be read is the following:
    // 1. env.json - This is the file that is dynamically created from the environment variables
    // 2. .env - This is the file that is created by the developer
    // If there are any conflicts, the env.json file will take precedence.

    // Check if the file env.json exists
    const configJson = await fetch('/config.json');
    if (configJson.status === 200) {
        console.log('env.json exists');
        const env = await configJson.json();
        for (const key in env) {
            console.log(`${key}: ${env[key]}`);
            process.env[key] = env[key];
        }
    }

    // Get the rest of the environment variables from the .env file. If the same env variable has already 
    // been defined in the env.json file, it will be overriden
    const envFile = await fetch('/.env');
    if (envFile.status === 200) {
        console.log('.env exists');
        const env = await envFile.text();
        const lines = env.split('\n');
        for (const line of lines) {
            const [key, value] = line.split('=');
            
            console.log(`${key.trim()}: ${value.trim()}`);
            process.env[key.trim()] = value.trim();
        }
    }

    // Print all the environment variables
    console.log('Environment variables:');
    for (const key in process.env) {
        console.log(`${key}: ${process.env[key]}`);
    }
});
