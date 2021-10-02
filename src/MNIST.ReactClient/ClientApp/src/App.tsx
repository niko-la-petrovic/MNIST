import * as React from 'react';
import { Route } from 'react-router';
import Layout from './components/layout/Layout';
import Home from './components/home/Home';
import ImageUpload from './components/imageUpload/ImageUpload';
import Draw from './components/draw/Draw';
import './custom.css'

export default () => (
    <Layout>
        <Route exact path='/' component={Home} />
        <Route path='/image-upload' component={ImageUpload} />
        <Route path='/draw' component={Draw} />
    </Layout>
);
