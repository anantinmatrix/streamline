import { useEffect, useState } from "react";


const RegisterForm = () => {

    let [formData, setformData] = useState({});
    const [loading, setloading] = useState(false);
    const [response, setresponse] = useState("");


    function handleChange(e) {
        e.preventDefault(); // to prevent default behavior of on change

        //changing form data according to the name of the field
        setformData({
            ...formData,
            [e.target.name]: e.target.value,
        })
        // handle the change in form data if field's value is a file
        if (e.target.files) {
            setformData({
                ...formData,
                [e.target.name]: e.target.files[0]
            })
        }
    }

    async function handleSubmit(e) {
        e.preventDefault(); // prevent default submit behavior

        setloading(true)

        // checking if all the fields are filled properly
        let { fullName, username, email, password, avatar } = formData;
        console.log({fullName, username, email, password, avatar})
        // if (
        //     [fullName, username, email, password, avatar].some((field)=> field === undefined)
        // ){
        //     return alert('Fill all the required fields')
        // }
        if(!fullName || !email || !username || !password || !avatar){
            console.log('some of the fields are empty.')
            setloading(false)
            return alert("Fill all the required fields");
        }

        // creating multipart form data
        let form = new FormData();
        Object.entries(formData).forEach((key) => {
            form.append(key[0], key[1])
        })

        // making a post request to register user
        const data = await fetch(`${import.meta.env.VITE_SERVER_URL}/user/register`, {
            method: "POST",
            body: form
        })

        const response = await data.json();

        console.log(response)
        setloading(false)
        setresponse(response.message)

    }

    useEffect(()=>{
        const responseTimeout = setTimeout(() => {
            setresponse("")
        }, 3000);

        return()=>{
            clearTimeout(responseTimeout)
        }
    },[response])




    return (
        <div id="register">
            <form onSubmit={(e) => handleSubmit(e)}>
                <div>
                    <label htmlFor="fullName">Full Name</label>
                    <input name="fullName" onChange={(e) => handleChange(e)} type="text" placeholder="Enter Name" />
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input name="email" onChange={(e) => handleChange(e)} type="email" placeholder="Enter Email" />
                </div>
                <div>
                    <label htmlFor="username">Username</label>
                    <input name="username" onChange={(e) => handleChange(e)} type="text" placeholder="Enter Username" />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input name="password" onChange={(e) => handleChange(e)} type="password" placeholder="Enter Password" />
                </div>
                <div>
                    <label htmlFor="avatar">Avatar</label>
                    <input name="avatar" onChange={(e) => handleChange(e)} type="file" placeholder="Select Avatar" />
                </div>
                <div>
                    <label htmlFor="cover">CoverImage (optional)</label>
                    <input name="coverImage" onChange={(e) => handleChange(e)} type="file" placeholder="Select Cover Image (optional)" />
                </div>
                <button type="submit">Register</button>
            </form>
            {loading && <p>Loading...</p>}
            {response && <p>{response}</p>}
        </div>
    )
}

export default RegisterForm;