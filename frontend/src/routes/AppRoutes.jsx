import React from 'react'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import Login from '../Pages/Login'
import Register from '../Pages/Register'
import ForgotPassword from '../Pages/ForgotPassword'
import ResetPassword from '../Pages/ResetPassword'
import Home from '../Pages/Home'
import Project from '../Pages/Project'

const appRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={< Register/>} />
        <Route path="/forgot-password" element={< ForgotPassword/>} />
        <Route path="/reset-password/" element={<ResetPassword />} />
        <Route path="/project/:projectId" element={<Project />} />
      </Routes>
    </BrowserRouter>
  )
}

export default appRoutes