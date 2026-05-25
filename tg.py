import telebot
from telebot import types
import datetime
import os

BOT_TOKEN = '7698086227:AAE1imyod4JMdoV-pTkATx0uY-blDOQsf6c'
# ВАЖНО: Замените этот ID на свой реальный ID, который вы узнали через @userinfobot
ADMIN_ID = 5273703401 

bot = telebot.TeleBot(BOT_TOKEN)

# Функция сохранения заказа
def save_order(user_id, username, game, package, price, player_id):
    date_now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    order_info = f"🆔 ID Заказа: {user_id}_{date_now.replace(':', '-')}\n" \
                 f"👤 Пользователь: @{username} (ID: {user_id})\n" \
                 f"🎮 Игра: {game}\n" \
                 f"📦 Товар: {package}\n" \
                 f"💰 Цена: {price}\n" \
                 f"🆔 ID Игрока: {player_id}\n" \
                 f"📅 Дата: {date_now}\n" \
                 f"📝 Статус: ⏳ В обработке\n" \
                 f"-----------------------------------\n"
    
    with open('orders.txt', 'a', encoding='utf-8') as f:
        f.write(order_info)
    return order_info

@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = types.InlineKeyboardMarkup(row_width=1)
    
    # Ссылка на ваш Mini App
    web_app_url = 'https://barotjon-00.github.io/telegram-mini-app'
    web_app = types.WebAppInfo(url=web_app_url)
    btn_mini_app = types.InlineKeyboardButton(text="🎮 Открыть Arena X", web_app=web_app)
    
    markup.add(btn_mini_app)
    
    welcome_text = """
👋 <b>Добро пожаловать в Arena X Donate!</b>

Пополняй баланс в играх быстро и безопасно:
🔹 PUBG Mobile
🔹 Mobile Legends
🔹 Free Fire
🔹 Standoff 2
🔹 Telegram Premium

Нажми кнопку ниже, чтобы начать! 👇
    """
    
    bot.send_message(
        message.chat.id, 
        welcome_text,
        reply_markup=markup,
        parse_mode='HTML'
    )

# ГЛАВНАЯ ЧАСТЬ: Обработка данных от Mini App
@bot.message_handler(content_types=['web_app_data'])
def process_web_app_data(message):
    data = message.web_app_data.data
    user_id = message.from_user.id
    username = message.from_user.username or f"user_{user_id}"
    
    try:
        # Разделяем строку по символу |
        parts = data.split('|')
        
        if len(parts) == 4:
            game = parts[0]
            package = parts[1]
            price = parts[2]
            player_id = parts[3]
            
            # 1. Сохраняем заказ в файл
            order_text = save_order(user_id, username, game, package, price, player_id)
            
            # 2. Отправляем уведомление АДМИНУ (ВАМ)
            admin_msg = f"🔥 <b>НОВЫЙ ЗАКАЗ!</b>\n\n{order_text}"
            bot.send_message(ADMIN_ID, admin_msg, parse_mode='HTML')
            
            # 3. Отправляем подтверждение ПОЛЬЗОВАТЕЛЮ
            user_msg = f"""
✅ <b>Заказ успешно создан!</b>

📦 <b>Товар:</b> {package} ({game})
💰 <b>Сумма:</b> {price}
🆔 <b>ID Игрока:</b> {player_id}

⏳ <i>Статус: В обработке</i>
Ожидайте, оператор свяжется с вами для оплаты.
            """
            bot.send_message(user_id, user_msg, parse_mode='HTML')
            
        else:
            bot.send_message(user_id, "❌ Ошибка: Неверный формат данных.")
            
    except Exception as e:
        bot.send_message(user_id, f"❌ Произошла ошибка: {str(e)}")
        bot.send_message(ADMIN_ID, f"⚠️ Ошибка обработки: {str(e)}\nДанные: {data}")

print("✅ Бот запущен. Жду заказы...")
bot.polling(none_stop=True)