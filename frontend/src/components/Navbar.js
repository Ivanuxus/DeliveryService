import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../utils/apiClient"; // Подключение вашего клиента API
import DinoGame from "./DinoGame";

const Navbar = () => {
  const role = localStorage.getItem("userRole");
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [completedOrders, setCompletedOrders] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  useEffect(() => {
    if (role === "courier") {
      // Получаем данные курьера
      apiClient
        .get("/couriers/")
        .then((response) => {
          if (response.data.length > 0) {
            const courier = response.data[0];
            setBalance(courier.balance);
            setCompletedOrders(courier.monthly_orders);
          }
        })
        .catch((error) => {
          console.error("Ошибка при получении данных курьера:", error);
          setBalance("Ошибка");
          setCompletedOrders("Ошибка");
        });
    }
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.container}>
          <Link
            to="/"
            style={styles.logo}
            onClick={(e) => {
              if (e.detail === 3) {
                // Тройной клик
                e.preventDefault();
                setIsGameActive(true);
              }
            }}
          >
            <img
              src="/klac.png"
              alt="Подсказка: клик 3 раза"
              style={{ height: 15, marginRight: -10, verticalAlign: "top" }}
            />
            Система управления доставкой
            <img
              src="/triple_click_hint.png"
              alt="Подсказка: клик 3 раза"
              style={{ height: 30, marginLeft: 5, verticalAlign: "middle" }}
            />
          </Link>

          <button
            style={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span style={styles.menuIcon}></span>
          </button>

          <ul
            style={{
              ...styles.navList,
              ...(isMenuOpen ? styles.navListMobile : styles.navListDesktop),
            }}
          >
            <li style={styles.navItem}>
              <Link to="/" style={styles.navLink}>
                Панель управления
              </Link>
            </li>
            {!role && (
              <>
                <li style={styles.navItem}>
                  <Link to="/login" style={styles.navLink}>
                    Войти
                  </Link>
                </li>
                <li style={styles.navItem}>
                  <Link to="/register" style={styles.navLink}>
                    Регистрация
                  </Link>
                </li>
              </>
            )}
            {role === "admin" && (
              <>
                <li style={styles.navItem}>
                  <Link to="/orders" style={styles.navLink}>
                    Заказы
                  </Link>
                </li>
                <li style={styles.navItem}>
                  <Link to="/couriers" style={styles.navLink}>
                    Курьеры
                  </Link>
                </li>
                <li style={styles.navItem}>
                  <Link to="/customers" style={styles.navLink}>
                    Клиенты
                  </Link>
                </li>
              </>
            )}
            {role === "courier" && (
              <>
                <li style={styles.navItem}>
                  <Link to="/orders" style={styles.navLink}>
                    Мои заказы
                  </Link>
                </li>
                <li style={styles.navItem}>
                  <div style={styles.statCard}>
                    <span style={styles.statLabel}>Баланс</span>
                    <span style={styles.statValue}>
                      {balance !== null ? `${balance} ₽` : "Загрузка..."}
                    </span>
                  </div>
                </li>
                <li style={styles.navItem}>
                  <div style={styles.statCard}>
                    <span style={styles.statLabel}>Выполненные заказы</span>
                    <span style={styles.statValue}>
                      {completedOrders !== null
                        ? completedOrders
                        : "Загрузка..."}
                    </span>
                  </div>
                </li>
              </>
            )}
            {role === "customer" && (
              <li style={styles.navItem}>
                <Link to="/orders" style={styles.navLink}>
                  Мои заказы
                </Link>
              </li>
            )}
            {role && (
              <>
                <li style={styles.navItem}>
                  <Link to="/profile" style={styles.navLink}>
                    Профиль
                  </Link>
                </li>
                <li style={styles.navItem}>
                  <button style={styles.logoutButton} onClick={handleLogout}>
                    Выйти
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
      <DinoGame
        isActive={isGameActive}
        onClose={() => setIsGameActive(false)}
      />
    </>
  );
};

const styles = {
  navbar: {
    backgroundColor: "#ffffff",
    padding: "1rem 0",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1a1a1a",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  },
  menuButton: {
    display: "none",
    background: "none",
    border: "none",
    padding: "0.5rem",
    "@media (maxWidth: 768px)": {
      display: "block",
    },
  },
  menuIcon: {
    display: "block",
    width: "24px",
    height: "2px",
    backgroundColor: "#1a1a1a",
    position: "relative",
    "::before": {
      content: '""',
      position: "absolute",
      width: "24px",
      height: "2px",
      backgroundColor: "#1a1a1a",
      top: "-6px",
    },
    "::after": {
      content: '""',
      position: "absolute",
      width: "24px",
      height: "2px",
      backgroundColor: "#1a1a1a",
      bottom: "-6px",
    },
  },
  navList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  navListDesktop: {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  },
  navListMobile: {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    padding: "1rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
  },
  navLink: {
    color: "#1a1a1a",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: "1rem",
    transition: "color 0.2s",
    "&:hover": {
      color: "#2563eb",
    },
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0.5rem 1rem",
    backgroundColor: "#f8fafc",
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: "0.25rem",
  },
  statValue: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1a1a1a",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#dc2626",
    },
  },
};

export default Navbar;
