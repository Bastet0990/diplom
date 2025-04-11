import { useRef, useState } from "react"; // Импорт хука useState из библиотеки React для управления состоянием компонентов
import { Card, Box, Typography, IconButton, Input, Stack, Link, Avatar, Button } from '@mui/joy'; // Импорт компонентов из библиотеки Material UI (MUI) Joy для создания пользовательского интерфейса
import { Send, Logout } from "@mui/icons-material" // Импорт иконок Send и Logout из библиотеки Material UI (MUI) Icons
import { useAuth } from "../contexts/AuthContext"; // Импорт хука useAuth из контекста AuthContext для работы с аутентификацией пользователя

function Chat() {
    const chatRef = useRef(null);
    // Объявление состояний компонента с использованием хука useState
    const [messages, setMessages] = useState([]); // Состояние для хранения списка сообщений в чате
    const [inputMessage, setInputMessage] = useState(''); // Состояние для хранения текста вводимого сообщения
    const [isThinking, setIsThinking] = useState(false); // Состояние для отслеживания процесса "размышления" (ожидания ответа от сервера)


    // Получение данных пользователя и функции выхода из системы из контекста аутентификации
    const { user, logout } = useAuth();

    // Функция для отправки сообщения
    const sendMessage = async () => {
        // Если поле ввода сообщения пустое, функция завершает выполнение
        if (inputMessage == '')
            return;

        // Устанавливаем состояние "размышления" в true, чтобы заблокировать поле ввода и кнопку отправки
        setIsThinking(true);

        // Сохраняем текст сообщения во временную переменную
        const message = inputMessage;

        // Добавляем сообщение пользователя в список сообщений
        addMessage(message, 0, "user");
        // Очищаем поле ввода сообщения
        setInputMessage('');
        try {
            // Отправляем POST-запрос к API для получения ответа от модели
            const res = await fetch('https://api.screwltd.com/v3/ai/generate/7d01a950-4419-458c-96e0-88d6c59fc78a', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Указываем, что отправляем данные в формате JSON
                    'X-API-KEY': 'fbea9732-7bff-45d8-a395-c11cd26098ff', // Ключ API для аутентификации запроса
                },
                body: JSON.stringify({ message: message, version: '4.3', history: convertMessagesToHistoryFormat(messages), instructions: `Information about current user: ${JSON.stringify(user)}.` }), // Тело запроса в формате JSON, содержащее сообщение, версию API, историю сообщений и информацию о пользователе
            });

            // Если запрос не успешен, выбрасываем ошибку
            if (!res.ok) {
                throw new Error(res.status);
            }

            // Преобразуем ответ от сервера в JSON
            const data = await res.json();
            // Добавляем ответ модели в список сообщений
            addMessage(data.text, data.duration, "model");
        } catch (error) {
            // Обрабатываем ошибки, возникшие при отправке запроса
            console.error('Ошибка при отправке запроса:', error);

            // Если в списке сообщений есть сообщения, удаляем последнее сообщение (возможно, сообщение пользователя, которое не было отправлено)
            if (messages.length > 0) {
                setMessages(messages.slice(0, messages.length - 1));
            }
        }
        finally {
            // В любом случае (успех или ошибка) устанавливаем состояние "размышления" в false, чтобы разблокировать поле ввода и кнопку отправки
            setIsThinking(false);
        }
    };

    // Функция для преобразования списка сообщений в формат, необходимый для отправки в API
    const convertMessagesToHistoryFormat = (messages) => {
        return messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model', // Определяем роль отправителя сообщения (пользователь или модель)
            parts: [{ text: msg.text }] // Текст сообщения
        }));
    };

    // Функция для добавления нового сообщения в список сообщений
    const addMessage = (text, duration, role) => {
        const newMessage = { text: text, duration: duration, role: role }; // Создаем объект нового сообщения
        setMessages(prevMessages => {
            const updatedMessages = [...prevMessages, newMessage]; // Добавляем новое сообщение в список, используя предыдущее состояние
            // Используем requestAnimationFrame для прокрутки после рендеринга DOM
            requestAnimationFrame(() => {
                chatRef.current?.scrollIntoView({ behavior: 'smooth' });
            });
            return updatedMessages;
        });
    };

    // Функция для преобразования времени в миллисекундах в секунды с двумя знаками после запятой
    const convertToSeconds = (timeString) => {
        const ms = parseFloat(timeString); // Преобразуем строку времени в число с плавающей точкой
        return (ms / 1000).toFixed(2); // Делим миллисекунды на 1000, чтобы получить секунды, и округляем до двух знаков после запятой
    };

    // Рендерим пользовательский интерфейс компонента
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}> {/* Контейнер для центрирования контента */}
            <Box sx={{ width: '720px', height: '100vh', display: 'flex', flexDirection: 'column' }}> {/* Основной контейнер чата */}
                <Card variant="plain" sx={{ borderRadius: "0px 0px 18px 18px" }}> {/* Карточка заголовка */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}> {/* Контейнер для элементов заголовка */}
                        <Box sx={{ flexGrow: 1 }}> {/* Контейнер для информации о пользователе, занимает все доступное пространство */}
                            <Stack sx={{ alignItems: 'center' }} spacing={1} direction="row"> {/* Стек для выравнивания элементов по горизонтали */}
                                <Avatar /> {/* Аватар пользователя */}
                                <Typography>{user.username}</Typography> {/* Имя пользователя */}
                            </Stack>
                        </Box>
                        <Box> {/* Контейнер для кнопки выхода */}
                            <Button onClick={logout} variant="soft" startDecorator={<Logout />} color="danger" sx={{ borderRadius: 250 }}>Выход</Button> {/* Кнопка выхода из системы */}
                        </Box>
                    </Box>
                </Card>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', scrollbarWidth: 'none' }}> {/* Контейнер для сообщений, занимает все доступное пространство по вертикали и имеет прокрутку */}
                    <Stack spacing={1} sx={{ width: '100%', py: 4 }}> {/* Стек для вертикального расположения сообщений */}
                        {messages.map((message, index) => ( // Отображаем каждое сообщение в списке
                            <Stack key={index} direction={message.role === 'user' ? 'row-reverse' : 'row'} spacing={1}> {/* Стек для горизонтального расположения сообщения, направление зависит от роли отправителя */}
                                <Card sx={{ borderRadius: message.role === 'user' ? '18px 6px 18px 18px' : '6px 18px 18px 18px' }} color="neutral" variant="soft"> {/* Карточка сообщения, с разными углами закругления в зависимости от роли отправителя */}
                                    <Stack spacing={0.1}> {/* Стек для вертикального расположения элементов внутри сообщения */}
                                        {message.role === 'user' ? ( // Если сообщение от пользователя
                                            <Typography level="title-md">{user.username}</Typography> // Отображаем имя пользователя
                                        ) : ( // Если сообщение от модели
                                            <Link target="_blank" href="https://chat.screwltd.com/" level="title-md">Сильвестр Андреевич</Link> // Отображаем ссылку на сайт Capricorn AI
                                        )}
                                        <Typography level="body-sm">{message.text}</Typography> {/* Текст сообщения */}
                                        {message.duration != 0 && ( // Если есть информация о времени ответа
                                            <Typography sx={{ pt: 1 }} level="body-xs"> Ответил за {convertToSeconds(message.duration)} сек.</Typography> // Отображаем время ответа
                                        )}
                                    </Stack>
                                </Card>
                            </Stack>
                        ))}
                        <div ref={chatRef}/>
                    </Stack>
                </Box>
                <Box> {/* Контейнер для поля ввода сообщения */}
                    <Input sx={{ mb: 2, borderRadius: '18px', py: 1, px: 2 }} // Поле ввода сообщения
                        color="primary"
                        disabled={isThinking} // Блокируем поле ввода, пока модель "думает"
                        value={inputMessage} // Привязываем значение поля ввода к состоянию inputMessage
                        endDecorator={<IconButton sx={{ borderRadius: '18px' }} disabled={isThinking} onClick={() => sendMessage()}><Send /></IconButton>} // Кнопка отправки сообщения
                        onKeyDown={(e) => { // Обрабатываем нажатие клавиш в поле ввода
                            if (e.key === 'Enter') { // Если нажата клавиша Enter
                                if (e.shiftKey) { // Если нажата клавиша Shift вместе с Enter
                                    return; // Ничего не делаем (позволяем вставить перенос строки)
                                } else { // Если нажата только клавиша Enter
                                    e.preventDefault(); // Предотвращаем стандартное поведение (перенос строки)
                                    sendMessage(); // Отправляем сообщение
                                }
                            }
                        }}
                        onChange={(e) => setInputMessage(e.target.value)} // Обновляем состояние inputMessage при изменении значения поля ввода
                        placeholder="Спросите что-нибудь…" // Текст-подсказка в поле ввода
                    />
                </Box>
            </Box>
        </Box>
    );
}
export default Chat; // Экспортируем компонент Chat
