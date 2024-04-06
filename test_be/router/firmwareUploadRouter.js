import  express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { checkRole } from '../middleware/auth.js';
import db from '../db/models/index.js';

const ROOT =process.cwd() + path.sep + 'uploads' + path.sep;

const routes = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const hwVersion = req.body.hwVersion;
        const swVersion = req.body.swVersion;

        const dir = `${ROOT}${path.sep}${hwVersion}${path.sep}${swVersion}`;
        if(!validatePath(dir)) {
            cb(new Error('Forbidden'), null);
            return;   
        }
        if (!fs.existsSync(dir)){
            console.log("creating dir: ", dir);
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

routes.post('/api/firmwareUpload', await checkRole(['admin']), upload.single('file'), async (req, res, next) => {
    // # handle form data  
    // # handle file upload
    const file = req.file;
    console.log("file: ", file);
    // Process the uploaded file here
    const hwVersion = req.body.hwVersion;
    console.log("hwVersion: ", hwVersion);

    const swVersion = req.body.swVersion;
    console.log("swVersion: ", swVersion);
    // Process the uploaded firmware here
    const dir = `${ROOT}${path.sep}${hwVersion}${path.sep}${swVersion}`;
    const firmware = await db.Firmware.create({
        hwVersion: hwVersion,
        swVersion: swVersion,
        path: dir,
        filename: file.originalname
    });

    console.log("firmware: ", firmware.toJSON());
    // # send response
    res.send('Firmware uploaded and updated successfully');
}, (error, req, res, next) => {
    res.status(403).send(error.message);
});

function validatePath(dir) {
    console.log("dir: ", dir);
    const resolvedPath = path.resolve(ROOT, dir);
    console.log("resolvedPath: ", resolvedPath);
    //const filepath = fs.realpathSync(resolvedPath);
    //console.log("filepath: ", filepath);
    //const filepath = fs.realpathSync(path.resolve(ROOT, dir));
    console.log("resolvedPath.startsWith: ", resolvedPath.startsWith(ROOT));
    return resolvedPath.startsWith(ROOT);
}

// Create a post route at /api/deleteFirmware
routes.post('/api/deleteFirmware', await checkRole(['admin']), async (req, res) => {
    // get the full version from the body
    const version = req.body.version;
    console.log("version: ", version);
    //delete the contents of the folder named version
    const filepath = path.resolve(ROOT, version);
    if (!validatePath(filepath)) {
        res.status(403).send('Forbidden');
        return;
    }
    if (fs.existsSync(filepath)){
        fs.rmSync(filepath, { recursive: true });
    }
    try{
        //delete the record from the database
        await db.Firmware.destroy({
            where: {
                id: req.body.id
            }
        });
    } catch (error) {
        console.log("error: ", error);
        res.status(403).send(error.message);
    }

    // # send response
    res.send('Firmware deleted successfully');
});

export default routes;