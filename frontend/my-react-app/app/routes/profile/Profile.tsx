import { Link } from "react-router";
import { getCookie } from "~/tools/getCookie";

export default function Profile() {
  return (
    <div>
      <h1>Profile page</h1><br />
      <button style={{color: "white"}} onClick={()=>{
        console.log("OKAY")
        console.log(getCookie(document.cookie, "token"))
      }}>Check</button>
      <br />
      <br />
      <br />
      <br />
      <Link to={"/editProfile"}>Edit profile</Link>
      {/* <NavBar /> */}
      {/* <h1>hi</h1> */}
    </div>
  );
}
