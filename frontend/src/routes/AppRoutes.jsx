import React from 'react'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import Login from '../Pages/Login'
import Register from '../Pages/Register'
import ForgotPassword from '../Pages/ForgotPassword'
import ResetPassword from '../Pages/ResetPassword'
import Home from '../Pages/Home'

const appRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={< Home/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={< Register/>} />
        <Route path="/forgot-password" element={< ForgotPassword/>} />
        <Route path="/reset-password/" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default appRoutes