import  { createContext, useContext, useState } from 'react';

// Create the context
const UserContext = createContext();

// Context provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    return (
        <UserContext.Provider value={{ user,setUser }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook for easy access
export const useUser = () => useContext(UserContext);