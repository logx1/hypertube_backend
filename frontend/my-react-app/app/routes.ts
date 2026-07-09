import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home/home.tsx"),
  route("components", "./routes/infos/infos.tsx"),
  route("user", "./routes/profile/Profile.tsx", { id: "editProfile" }),
  route("profile", "./routes/editProfile/editProfile.tsx"),
  route("login", "./routes/login/Login.tsx"),
  route(
    "movieInfos/:movieId/:movieName/:year",
    "./routes/movieInfos/movieInfos.tsx"
  ),
  route("signup", "./routes/signup/Signup.tsx"),
  route("forgot", "./routes/forgot/forgot.tsx"),
  route(
    "watch/:identifier/:identifier144/:name/:year/:quality",
    "./routes/watch/watch.tsx"
  ),
  route("reset/:token", "./routes/reset/reset.tsx"),
] satisfies RouteConfig;
