import "./App.css";
import LoginForm from "./pages/LoginForm/LoginForm";
import RegisterForm from "./pages/RegisterForm/RegisterForm";


const App = () => {


  return (
    <>
      <div id="app">
        <p>This is the app component for youtube clone frontend.</p>
        <h5>Register Form</h5>
        <RegisterForm />

        <h5>Login Form</h5>
        <LoginForm />
      </div>
    </>
  )
}

export default App;