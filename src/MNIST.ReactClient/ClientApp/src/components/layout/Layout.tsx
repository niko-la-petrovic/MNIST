import * as React from 'react';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import NavMenu from '../navMenu/NavMenu';
import 'react-toastify/dist/ReactToastify.css';

export default class Layout extends React.PureComponent<{}, { children?: React.ReactNode }> {
    public render() {
        return (
            <React.Fragment>
                <NavMenu />
                {/* // TODO light mode */}
                <ToastContainer
                    position="bottom-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover />
                <Container>
                    {this.props.children}
                </Container>
            </React.Fragment>
        );
    }
}