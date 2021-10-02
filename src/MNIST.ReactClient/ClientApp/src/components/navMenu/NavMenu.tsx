import * as React from 'react';
import { Container, Nav, Navbar, NavLink } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap'
import './NavMenu.css';

export default class NavMenu extends React.PureComponent<{}, { isOpen: boolean }> {
    public state = {
        isOpen: false
    };

    public render() {
        return (
            <header>
                <Navbar bg="light" expand="lg" className="shadow-sm">
                    <Container>
                        <LinkContainer to="/">
                            <Navbar.Brand> MNIST.ReactClient</Navbar.Brand>
                        </LinkContainer>
                        <Navbar.Toggle onClick={this.toggle} aria-controls="navbar-collapse" className="mr-2" />
                        <Navbar.Collapse id="navbar-collapse" className="justify-content-end" appear={this.state.isOpen}>
                            <Nav className="me-auto justify-content-end">
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
                        </Navbar.Collapse>
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
