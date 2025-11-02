import axios from "../config/axios";

export const checkAuth = async (navigate, setUser) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }

    // decode expiry quick check 
    const base64Url = token.split(".")[1];
    if (!base64Url) {
      localStorage.removeItem("token");
      return null;
    }
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp || Date.now() >= decoded.exp * 1000) {
      localStorage.removeItem("token");
      return null;
    }

    // fetch the profile from backend and return it
    const res = await axios.get("/users/profile");
    setUser(res.data.user);
    return res.data.user;
  } catch (err) {
    console.error("Auth check failed:", err);
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
    return null;
  }
};
