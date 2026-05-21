import telebot
from telebot import types

BOT_TOKEN = '7698086227:AAE1imyod4JMdoV-pTkATx0uY-blDOQsf6c'

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = types.InlineKeyboardMarkup(row_width=2)
    
    # Кнопка для Mini App
    web_app_url = 'https://barotjon-00.github.io/telegram-mini-app'
    web_app = types.WebAppInfo(url=web_app_url)
    btn_mini_app = types.InlineKeyboardButton(text="🎮 Играть", web_app=web_app)
    
    # Другие кнопки
    btn_contact = types.InlineKeyboardButton(text="📞 Contact Us", callback_data="contact")
    btn_instruction = types.InlineKeyboardButton(text="📖 Instruction", callback_data="instruction")
    btn_help = types.InlineKeyboardButton(text="❓ Help", callback_data="help")
    
    # Добавляем кнопки
    markup.add(btn_mini_app)
    markup.add(btn_contact, btn_instruction)
    markup.add(btn_help)
    
    # Текст приветствия
    welcome_text = """
🎮 <b>Добро пожаловать!</b> 🎮

<i>Biz bilamiz oson va qulay!</i>

🚀 Быстрое пополнение игровых аккаунтов
💰 Лучшие цены
⚡ Мгновенное зачисление

🎯 Выберите игру и пополните баланс прямо сейчас!
    """
    
    # ✅ ОТПРАВКА ЛОКАЛЬНОГО ФОТО
    try:
        with open('1.png', 'rb') as photo:
            bot.send_photo(
                message.chat.id,
                photo=photo,
                caption=welcome_text,
                reply_markup=markup,
                parse_mode='HTML'
            )
    except FileNotFoundError:
        # Если файл не найден - отправляем только текст
        bot.send_message(
            message.chat.id, 
            welcome_text,
            reply_markup=markup,
            parse_mode='HTML'
        )

# Обработчик нажатий на кнопки
@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.data == "contact":
        contact_text = """
📞 <b>Свяжитесь с нами:</b>

📱 Telegram: @777
📧 Email: support@uzpin.uz
🕐 Работаем 24/7
        """
        bot.answer_callback_query(call.id, "Контактная информация")
        bot.send_message(call.message.chat.id, contact_text, parse_mode='HTML')
        
    elif call.data == "instruction":
        instruction_text = """
📖 <b>Инструкция:</b>

1️⃣ Нажмите кнопку "🎮 Играть"
2️⃣ Выберите вашу игру
3️⃣ Введите ваш ID аккаунта
4️⃣ Выберите сумму пополнения
5️⃣ Оплатите удобным способом
6️⃣ Получите средства мгновенно!
        """
        bot.answer_callback_query(call.id, "Инструкция")
        bot.send_message(call.message.chat.id, instruction_text, parse_mode='HTML')
        
    elif call.data == "help":
        help_text = """
❓ <b>Помощь:</b>

💬 Напишите нам: @777
📞 Поддержка: 24/7

Частые вопросы:
• Как пополнить? - Нажмите "Играть"
• Сколько времени? - Мгновенно
• Какие игры? - PUBG, Mobile Legends, Free Fire
        """
        bot.answer_callback_query(call.id, "Помощь")
        bot.send_message(call.message.chat.id, help_text, parse_mode='HTML')

print("✅ Бот запущен...")
bot.polling(none_stop=True)