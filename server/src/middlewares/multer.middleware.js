import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/temp')
    },
    filename: (req, file, cb) => {
        const date = Date.now();
        cb(null, `${date}-${file.originalname}`);
    }
})

export const upload = multer({storage});

