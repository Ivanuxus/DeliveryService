import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const role = localStorage.getItem('userRole');
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userRole');
        navigate('/login');
    };
    return (
        <nav style={styles.navbar}>
            <ul style={styles.navList}>
                <li style={styles.navItem}>
                    <Link to="/" style={styles.navLink}>Главная</Link>
                </li>
                {!role && (
                    <>
                        <li style={styles.navItem}>
                            <Link to="/login" style={styles.navLink}>Вход</Link>
                        </li>
                        <li style={styles.navItem}>
                            <Link to="/register" style={styles.navLink}>Регистрация</Link>
                        </li>
                    </>
                )}
                {role === 'admin' && (
                    <>
                        <li style={styles.navItem}>
                            <Link to="/orders" style={styles.navLink}>Заказы</Link>
                        </li>
                        <li style={styles.navItem}>
                            <Link to="/couriers" style={styles.navLink}>Курьеры</Link>
                        </li>
                        <li style={styles.navItem}>
                            <Link to="/customers" style={styles.navLink}>Клиенты</Link>
                        </li>
                    </>
                )}
                {role === 'courier' && (
                    <li style={styles.navItem}>
                        <Link to="/orders" style={styles.navLink}>Мои заказы</Link>
                    </li>
                )}
                {role === 'customer' && (
                    <li style={styles.navItem}>
                        <Link to="/orders" style={styles.navLink}>Мои заказы</Link>
                    </li>
                )}
                {role && (
                    <li style={styles.navItem}>
                        <button style={styles.logoutButton} onClick={handleLogout}>
                            Выйти
                        </button>
                    </li>
                )}
            </ul>
        </nav>
    );
};

const styles = {
    navbar: {
        backgroundColor: '#282c34',
        padding: '10px 20px',
    },
    navList: {
        listStyle: 'none',
        display: 'flex',
        margin: 0,
        padding: 0,
    },
    navItem: {
        marginRight: '20px',
    },
    navLink: {
        color: '#61dafb',
        textDecoration: 'none',
        fontSize: '18px',
    },
};

export default Navbar;