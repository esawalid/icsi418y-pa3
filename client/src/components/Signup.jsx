import { useState } from "react";

function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:9000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          f_name: firstName,
          l_name: lastName,
          username: username,
          password: password
        })
      });

      const data = await response.json();
      setMessage(data.message);

      // clear the form if it worked
      if (response.ok) {
        setFirstName("");
        setLastName("");
        setUsername("");
        setPassword("");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  }

  return (
    <div>
      <h2>Sign Up</h2>
                  <form onSubmit={handleSubmit}>
                <label htmlFor="firstName">First Name</label>
                <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />

                <label htmlFor="lastName">Last Name</label>
                <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />

                <label htmlFor="signupUsername">Username</label>
                <input
                    id="signupUsername"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label htmlFor="signupPassword">Password</label>
                <input
                    id="signupPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Sign Up</button>
            </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Signup;