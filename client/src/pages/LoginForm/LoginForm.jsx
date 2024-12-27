import { useEffect, useState } from "react";


const LoginForm = () => {
    let [formData, setformData] = useState({});
    const [loading, setloading] = useState(false);
    const [response, setresponse] = useState("");

    function handleChange(e){
        e.preventDefault(); // prevent deafult change bahavior

        // changing form data
        setformData({
            ...formData,
            [e.target.name] : e.target.value,
        })
    }
    
    async function handleSubmit(e){
        e.preventDefault(); // prevent default submission behavior
        setloading(true)

        // submitting form data to server
        const data = await fetch(`${import.meta.env.VITE_SERVER_URL}/user/login`,{
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
                "content-type": "application/json"
            }
        })
        const response = await data.json();
        console.log(response)
        setloading(false)
        setresponse(response.message)

    }

    useEffect(()=>{
        const loginTimeout = setTimeout(() => {
            setresponse('')
        }, 3000);

        return()=>{
            clearTimeout(loginTimeout)
        }
    },[response])

    return(
        <div id="login">
            <form onSubmit={(e)=> handleSubmit(e)}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input name="email" onChange={(e)=> handleChange(e)} type="email" placeholder="Enter Email" />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input name="password" onChange={(e)=> handleChange(e)} type="password" placeholder="Enter Email" />
                </div>
                <button type="submit">Login</button>
            </form>
            {loading && <p>Loading...</p>}
            {response && <p>{response}</p>}
        </div>
    )
}

export default LoginForm;