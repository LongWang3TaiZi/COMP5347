import React from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import AdminHome from '../pages/admin/Home';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/admin" element={<AdminHome/>}>
                <Route index element={<Navigate to="/admin/home" replace/>}/>
                <Route path="home"/>
            </Route>
        </Routes>
    );
};

export default AdminRoutes;