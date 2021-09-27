import * as React from 'react';
import { Collapse, Container, Nav, Navbar, NavbarBrand, NavItem, NavLink } from 'react-bootstrap';
import { BrowserRouter, Link } from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap'
import './NavMenu.css';

export default class NavMenu extends React.PureComponent<{}, { isOpen: boolean }> {
    public state = {
        isOpen: false
    };

    public render() {
        return (
            <header>
                <Navbar className="navbar-expand-sm navbar-toggleable-sm border-bottom box-shadow mb-3" bg="light">
                    <Container>
                        <Navbar.Brand>MNIST.ReactClient</Navbar.Brand>
                        <Navbar.Toggle onClick={this.toggle} className="mr-2" />
                        <Collapse className="d-sm-inline-flex flex-sm-row-reverse" appear={this.state.isOpen}>
                            <ul className="navbar-nav flex-grow">
                               <Nav className="me-auto">
                                    <LinkContainer to="/">
                                        <Nav.Link className="text-dark">Home</Nav.Link>
                                    </LinkContainer>
                                    <LinkContainer to="/image-upload">
                                        <NavLink className="text-dark">Image Upload</NavLink>
                                    </LinkContainer>
                                    <LinkContainer to="/draw">
                                        <NavLink className="text-dark">Draw</NavLink>
                                    </LinkContainer>
                               </Nav>
                            </ul>
                        </Collapse>
                    </Container>
                </Navbar>
            </header>
        );
    }

    private toggle = () => {
        this.setState({
            isOpen: !this.state.isOpen
        });
    }
}
