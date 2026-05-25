import telebot
from telebot import types
import datetime
import json
import os

BOT_TOKEN = '7698086227:AAE1imyod4JMdoV-pTkATx0uY-blDOQsf6c'
ADMIN_ID = 5273703401  # ВАШ ID

# Файл для хранения заказов
ORDERS_FILE = 'orders.json'

def load_orders():
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_order_to_file(order):
    orders = load_orders()
    orders.append(order)
    with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = types.InlineKeyboardMarkup(row_width=1)
    web_app_url = 'https://barotjon-00.github.io/telegram-mini-app'
    web_app = types.WebAppInfo(url=web_app_url)
    btn_mini_app = types.InlineKeyboardButton(text="🎮 Открыть Arena X", web_app=web_app)
    markup.add(btn_mini_app)
    
    welcome_text = """
👋 <b>Добро пожаловать в Arena X Donate!</b>

Нажми кнопку ниже, чтобы начать! 👇
    """
    bot.send_message(message.chat.id, welcome_text, reply_markup=markup, parse_mode='HTML')

@bot.message_handler(content_types=['web_app_data'])
def process_web_app_data(message):
    data = message.web_app_data.data
    user_id = message.from_user.id
    username = message.from_user.username or f"user_{user_id}"
    
    try:
        parts = data.split('|')
        if len(parts) == 4:
            game = parts[0]
            package = parts[1]
            price = parts[2]
            player_id = parts[3]
            
            # Создаем объект заказа
            order = {
                "id": len(load_orders()) + 1,
                "user_id": user_id,
                "username": username,
                "game": game,
                "package": package,
                "price": price,
                "player_id": player_id,
                "status": "pending",
                "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
            # Сохраняем в файл
            save_order_to_file(order)
            
            # Отправляем АДМИНУ
            admin_msg = f"""
🔥 <b>НОВЫЙ ЗАКАЗ #{order['id']}</b>

👤 Пользователь: @{username} (ID: {user_id})
🎮 Игра: {game}
📦 Товар: {package}
💰 Цена: {price}
🆔 ID Игрока: {player_id}
📅 Дата: {order['date']}
📝 Статус: ⏳ В обработке

Для управления используйте Admin Panel в Mini App или команды бота.
            """
            bot.send_message(ADMIN_ID, admin_msg, parse_mode='HTML')
            
            # Подтверждение ПОЛЬЗОВАТЕЛЮ
            user_msg = f"""
✅ <b>Заказ #{order['id']} создан!</b>

📦 {package} ({game})
💰 {price}
🆔 ID: {player_id}

⏳ Ожидайте подтверждения оператора.
            """
            bot.send_message(user_id, user_msg, parse_mode='HTML')
            
        else:
            bot.send_message(user_id, "❌ Ошибка формата данных.")
            
    except Exception as e:
        bot.send_message(user_id, f"❌ Ошибка: {str(e)}")
        bot.send_message(ADMIN_ID, f"⚠️ Ошибка: {str(e)}\nДанные: {data}")

# Команда для админа: посмотреть все заказы
@bot.message_handler(commands=['orders'])
def show_orders(message):
    if message.from_user.id != ADMIN_ID:
        bot.send_message(message.chat.id, "❌ Доступ запрещен!")
        return
    
    orders = load_orders()
    if not orders:
        bot.send_message(message.chat.id, "📭 Заказов пока нет.")
        return
    
    text = "📋 <b>Все заказы:</b>\n\n"
    for order in orders[-10:]:  # Последние 10 заказов
        status_emoji = {"pending": "", "success": "✅", "error": "❌"}
        text += f"#{order['id']} | {order['game']} | {order['package']} | {order['price']}\n"
        text += f"👤 @{order['username']} | 🆔 {order['player_id']}\n"
        text += f"📝 Статус: {status_emoji.get(order['status'], '❓')} {order['status']}\n\n"
    
    bot.send_message(message.chat.id, text, parse_mode='HTML')

# Команда для админа: подтвердить заказ
@bot.message_handler(commands=['confirm'])
def confirm_order(message):
    if message.from_user.id != ADMIN_ID:
        bot.send_message(message.chat.id, "❌ Доступ запрещен!")
        return
    
    try:
        order_id = int(message.text.split()[1])
        orders = load_orders()
        
        for order in orders:
            if order['id'] == order_id:
                order['status'] = 'success'
                save_order_to_file(order)
                
                # Уведомляем пользователя
                bot.send_message(
                    order['user_id'],
                    f"✅ <b>Заказ #{order_id} подтвержден!</b>\n\n"
                    f"📦 {order['package']}\n"
                    f"💰 {order['price']}\n\n"
                    f"Средства будут зачислены в ближайшее время.",
                    parse_mode='HTML'
                )
                bot.send_message(message.chat.id, f"✅ Заказ #{order_id} подтвержден!")
                return
        
        bot.send_message(message.chat.id, f"❌ Заказ #{order_id} не найден!")
        
    except (IndexError, ValueError):
        bot.send_message(message.chat.id, "❌ Использование: /confirm [ID заказа]")

print("✅ Бот запущен...")
bot.polling(none_stop=True)