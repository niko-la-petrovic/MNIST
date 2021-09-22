import * as React from 'react';
import { Route } from 'react-router';
import Layout from './components/Layout';
import Home from './components/Home';
import ImageUpload from './components/ImageUpload';
import Draw from './components/Draw';
import './custom.css'

export default () => (
    <Layout>
        <Route exact path='/' component={Home} />
        <Route path='/image-upload' component={ImageUpload} />
        <Route path='/draw' component={Draw} />
    </Layout>
);
