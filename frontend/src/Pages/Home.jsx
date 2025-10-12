
import { useUser } from '../context/user.context.jsx'
import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const Home = () => {

  const navigate = useNavigate();

  const {user,setUser} = useUser();
useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          const token = localStorage.getItem("token");
          if (!token) return navigate("/login"); // no token → redirect

          const res = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/users/profile`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setUser(res.data.user);
        }
      } catch (error) {
        // console.error(error);
        alert(error.response?.data?.message || error.message);
        navigate("/login");
      }
    };

    fetchProfile();
  }, []);

  return (

  <div>
    {!user ? (
      <p>Loading...</p> 
    ) : (
      <>
        <p>{user.email}</p>
        <p>{user._id}</p>
      </>
    )}
  </div>
);

  
}

export default Home