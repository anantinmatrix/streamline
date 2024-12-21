import dotenv from 'dotenv';
import { connectToDB } from './db/index.js';
import { app } from './app.js';


dotenv.config({path: './.env'})


connectToDB()
.then(()=>{
    app.listen(process.env.PORT, ()=>{
        console.log('Server is started on PORT : ',process.env.PORT )
    })
})
.catch((error)=>{
    console.log('some error occured while starting the server : ', error)
})


