import * as React from 'react';
import { connect } from 'react-redux';

const Home = () => {
  return (
    <>
    <h1>MNIST</h1>
    <h3>Try out the Draw and Image Upload links.</h3>
    </>
  );
};

export default connect()(Home);
