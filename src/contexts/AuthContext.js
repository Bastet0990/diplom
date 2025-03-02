import React, { createContext, useContext, useState, useEffect } from 'react'; // Импортируем необходимые хуки и компоненты из React
import { Card, Box, Typography, IconButton, Input, Stack, Link, Avatar, Button, CircularProgress } from '@mui/joy'; // Импортируем компоненты из библиотеки MUI Joy
import { Email, Key } from '@mui/icons-material'; // Импортируем иконки Email и Key из библиотеки MUI Icons
import { createClient } from "@supabase/supabase-js"; // Импортируем функцию createClient из библиотеки Supabase

// Создаем контекст аутентификации
const AuthContext = createContext();

// Создаем компонент AuthProvider, который будет предоставлять контекст аутентификации
function AuthProvider({ children }) {
    // Создаем клиент Supabase с использованием URL и ключа API
    const supabase = createClient("https://bksbhcgtyzncdyyseffy.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc2JoY2d0eXpuY2R5eXNlZmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NzE0MDMsImV4cCI6MjA1NDU0NzQwM30.iWirz-usL5zMVNl7rTuuNID22swMrwOLFdKkdYcOs2Q");
    // Состояние для отслеживания загрузки
    const [isLoading, setIsLoading] = useState(true);
    // Состояние для хранения информации о пользователе
    const [user, setUser] = useState(null);
    // Состояние для хранения значения поля ввода имени пользователя
    const [usernameField, setUsername] = useState('');
    // Состояние для хранения значения поля ввода пароля
    const [passwordField, setPassword] = useState('');

    // useEffect для проверки наличия данных пользователя в localStorage при загрузке компонента
    useEffect(() => {
        // Если в localStorage есть username и password
        if (localStorage.getItem("username") !== null && localStorage.getItem("password") !== null) {
            // Вызываем функцию login с данными из localStorage
            login(localStorage.getItem("username"), localStorage.getItem("password"), false);
        }
    }, []); // Зависимость - пустой массив, чтобы useEffect выполнился только один раз при монтировании компонента

    // Функция для проверки валидности email
    const isValidEmail = (email) => {
        // Регулярное выражение для проверки формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Возвращаем true, если email соответствует регулярному выражению, и false в противном случае
        return emailRegex.test(email);
    }

    // Функция для аутентификации пользователя
    const login = async (username, password, isHandWrited = true) => {
        // Проверяем длину username и password
        if (username.length < 3 || password.length < 3) {
            // Если длина меньше 3, показываем сообщение об ошибке (если ввод был ручным) и завершаем функцию
            if (isHandWrited)
                alert("Введите корректные данные.");
            setIsLoading(false);
            return;
        }

        // Проверяем, является ли username валидным email
        if (!isValidEmail(username)) {
            // Если username не является валидным email, показываем сообщение об ошибке (если ввод был ручным) и завершаем функцию
            if (isHandWrited)
                alert("Для регистрации подходит только почта.");

            setIsLoading(false);
            return;
        }

        // Устанавливаем состояние загрузки в true
        setIsLoading(true);

        try {
            // Выполняем запрос к базе данных Supabase для поиска пользователя с указанным username
            const { data: users, error } = await supabase
                .from("Users") // Указываем таблицу "Users"
                .select("*") // Выбираем все поля
                .eq("username", username); // Фильтруем по полю "username"

            // Если произошла ошибка при запросе
            if (error) {
                // Выводим ошибку в консоль и завершаем функцию
                console.error("Ошибка:", error);
                return;
            }

            // Если пользователь найден
            if (users && users.length > 0) {
                // Получаем информацию о пользователе из результата запроса
                const user = users[0];
                // Проверяем, соответствует ли введенный пароль паролю из базы данных
                if (user.password === password) {
                    // Если пароли совпадают, устанавливаем информацию о пользователе в состояние
                    setUser(user);
                    // Сохраняем username и password в localStorage
                    localStorage.setItem("username", username);
                    localStorage.setItem("password", password);
                } else {
                    // Если пароли не совпадают, показываем сообщение об ошибке
                    alert("Неверный пароль.");
                }
            } else {
                // Если пользователь не найден, создаем нового пользователя в базе данных
                const { data: newUser, error: newUserError } = await supabase
                    .from("Users") // Указываем таблицу "Users"
                    .insert([{ username: username, password: password }]) // Вставляем нового пользователя с указанными username и password
                    .select("*"); // Выбираем все поля

                // Если произошла ошибка при создании нового пользователя
                if (newUserError) {
                    // Выводим ошибку в консоль и завершаем функцию
                    console.error("Ошибка:", newUserError);
                    return;
                }

                // Если новый пользователь успешно создан
                if (newUser && newUser.length > 0) {
                    // Устанавливаем информацию о пользователе в состояние
                    setUser(newUser[0]);
                    // Сохраняем username и password в localStorage
                    localStorage.setItem("username", username);
                    localStorage.setItem("password", password);
                }
            }
        } catch (err) {
            // Обрабатываем любые другие ошибки
            console.error("Ошибка:", err);
        } finally {
            // В любом случае (успех или ошибка) устанавливаем состояние загрузки в false
            setIsLoading(false);
        }
    };

    // Функция для выхода из системы
    const logout = () => {
        // Удаляем username и password из localStorage
        localStorage.setItem("username", null);
        localStorage.setItem("password", null);
        // Очищаем информацию о пользователе в состоянии
        setUser(null);
    };

    // Возвращаем провайдер контекста AuthContext
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {/* Если идет загрузка, показываем CircularProgress */}
            {isLoading ? (
                <Box sx={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            ) :
                // Если пользователь авторизован, рендерим дочерние компоненты
                user ? (
                    children
                ) : (
                    // Если пользователь не авторизован, показываем форму авторизации
                    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Card variant='outlined' color="primary" sx={{ width: 340, borderRadius: 20, height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 3 }}>
                            <Typography level="h4" sx={{ mt: 2, mb: 3 }}>Авторизация</Typography>
                            <Stack spacing={1.5} sx={{ width: '100%' }}>
                                <Input startDecorator={<Email sx={{ height: 20 }} />} sx={{ borderRadius: 20, py: 1 }} value={usernameField} onChange={(e) => setUsername(e.target.value)} color="neutral" placeholder="Почта..." fullWidth></Input>
                                <Input startDecorator={<Key sx={{ height: 20 }} />} sx={{ borderRadius: 20, py: 1 }} value={passwordField} onChange={(e) => setPassword(e.target.value)} color="neutral" placeholder="Пароль..." type="password" fullWidth ></Input>
                                <Button size='lg' sx={{ borderRadius: 20 }} variant='soft' onClick={() => login(usernameField, passwordField)}>Вход</Button>
                            </Stack>
                        </Card>
                    </Box>
                )}
        </AuthContext.Provider>
    );
}

// Создаем хук useAuth для доступа к контексту аутентификации
function useAuth() {
    // Возвращаем значение контекста AuthContext
    return useContext(AuthContext);
}

// Экспортируем AuthProvider, useAuth и AuthContext
export { AuthProvider, useAuth, AuthContext };
