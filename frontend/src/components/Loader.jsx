import React from "react";

const Loader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="relative flex flex-col items-center">
  
        <div className="w-14 h-14 border-4 border-transparent border-t-blue-600 border-l-purple-600 rounded-full animate-spin" />
       
        <div className="absolute w-14 h-14 blur-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-40 animate-pulse" />
      </div>
      <p className="text-gray-400 text-sm mt-6 tracking-wide">Loading...</p>
    </div>
  );
};

export default Loader;
