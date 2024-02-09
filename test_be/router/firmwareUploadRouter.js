import  express from 'express';
import multer from 'multer';
import fs from 'fs';

const routes = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const hwVersion = req.body.hwVersion;
        const swVersion = req.body.swVersion;

        const dir = `uploads/${hwVersion}/${swVersion}`;
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });

routes.post('/api/firmwareUpload', upload.single('file'), (req, res, next) => {
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
    
    // # send response
    res.send('Firmware uploaded and updated successfully');
});

// Create a post route at /api/deleteFirmware
routes.post('/api/deleteFirmware', (req, res) => {
    // get the full version from the body
    const version = req.body.version;
    console.log("version: ", version);
    //delete the contents of the folder named version
    const dir = `uploads/${version}`;
    if (fs.existsSync(dir)){
        fs.rmSync(dir, { recursive: true });
    }

    // # send response
    res.send('Firmware deleted successfully');
});

export default routes;